import { ADDRESS, ASSET, NETWORK, RECIPIENT, fail, integer, keys, object, parseIntent, reason, text } from './model.ts';
import type { AuditEvent, Intent, Operation, Result } from './model.ts';
import { AuditLog } from './audit.ts';
import { DEFAULT_POLICY, PolicyEngine } from './policy.ts';

export interface ReadWallet { getAddress(): Promise<string>; getBalance(): Promise<bigint> }
export interface SandboxOptions {
  policy?: unknown;
  clock?: () => number;
  wallet?: ReadWallet;
  prepare?: (intent: Readonly<Intent>, signal: AbortSignal) => Promise<Readonly<Intent>>;
}
interface Receipt { id: string; intent: Readonly<Intent>; consumed: boolean }

export function createSandbox(options: SandboxOptions = {}) {
  const engine = new PolicyEngine(options.policy ?? DEFAULT_POLICY);
  const audit = new AuditLog(engine.policy.maxStateEntries);
  const clock = options.clock ?? Date.now;
  const capabilities = new Map<string, ReadonlySet<Operation>>();
  const receipts = new Map<string, Receipt>();
  let balance = 100000000n;
  let writes = 0;
  const wallet = options.wallet ?? {
    getAddress: async () => ADDRESS,
    getBalance: async () => balance
  };
  const prepare = options.prepare ?? (async (intent: Readonly<Intent>) => intent);
  const log = (operation: Operation, requestId: string, intent: Readonly<Intent> | undefined,
    result: Result, state: AuditEvent['payment_state'], verification: AuditEvent['verification_state'] = 'NOT_REQUESTED') => {
    audit.append({ timestamp: new Date(clock()).toISOString(), request_id: requestId,
      operation, read_write_class: operation === 'payment.purchase' ? 'WRITE' : 'READ',
      network: intent?.network === NETWORK ? NETWORK : 'untrusted', asset: intent?.asset === ASSET ? ASSET : 'untrusted',
      amount: intent?.amount ?? '0', recipient: intent?.recipient === RECIPIENT ? RECIPIENT : 'untrusted',
      policy_result: result.ok ? 'ALLOW' : 'DENY', policy_reason: result.ok ? 'ALLOWED' : result.reason,
      payment_state: state, verification_state: verification });
  };
  async function bounded<T>(work: (signal: AbortSignal) => Promise<T>, timeout: number, external?: AbortSignal): Promise<T> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancel: (() => void) | undefined;
    try {
      if (external?.aborted) fail('TIMEOUT');
      return await Promise.race([Promise.resolve().then(() => work(controller.signal)), new Promise<never>((_, reject) => {
        cancel = () => { controller.abort(); reject(new Error('timeout')); };
        external?.addEventListener('abort', cancel, { once: true });
        timer = setTimeout(cancel, timeout);
      })]).catch(error => { if (controller.signal.aborted) fail('TIMEOUT'); throw error; });
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      if (cancel !== undefined) external?.removeEventListener('abort', cancel);
    }
  }
  const agent = Object.freeze({
    async call(raw: unknown, capability: unknown, signal?: AbortSignal): Promise<Result> {
      let operation: Operation = 'payment.purchase';
      let intent: Readonly<Intent> | undefined;
      // Deliberately never copy attacker-controlled identifiers into logs.
      const auditId = crypto.randomUUID();
      let reserved = false;
      try {
        const command = object(raw);
        const descriptor = Object.getOwnPropertyDescriptor(command, 'operation');
        if (!descriptor || !('value' in descriptor)) fail('MALFORMED');
        if (command.operation !== 'wallet.address' && command.operation !== 'wallet.balance' && command.operation !== 'payment.purchase') fail('MALFORMED');
        operation = command.operation;
        if (operation === 'payment.purchase') keys(command, ['operation', 'payment']);
        else keys(command, ['operation']);
        if (typeof capability !== 'string' || !capabilities.get(capability)?.has(operation)) fail('UNAUTHORIZED');
        if (signal?.aborted) fail('TIMEOUT');
        if (operation !== 'payment.purchase') {
          const value = await bounded(async () => {
            if (operation === 'wallet.address') return await wallet.getAddress();
            const amount = await wallet.getBalance();
            if (typeof amount !== 'bigint' || amount < 0n) fail('PREPARATION_FAILED');
            return amount.toString();
          }, engine.policy.requestTimeoutMs, signal);
          // Never return arbitrary wallet error material; address must match configured fixture format.
          if (operation === 'wallet.address' && value !== ADDRESS && !/^0x[0-9a-fA-F]{40}$/.test(value)) fail('PREPARATION_FAILED');
          const result: Result = { ok: true, state: 'READ', value };
          log(operation, auditId, undefined, result, 'READ');
          return result;
        }
        intent = parseIntent(command.payment);
        engine.evaluate(intent, clock());
        const deadline = Math.min(intent.expiresAt, clock() + engine.policy.requestTimeoutMs);
        const prepared = await bounded(signal => prepare(intent as Readonly<Intent>, signal), Math.max(1, deadline - clock()), signal);
        const canonical = parseIntent(prepared);
        if (JSON.stringify(canonical) !== JSON.stringify(intent)) fail('PREPARATION_FAILED');
        if (!capabilities.get(capability)?.has(operation)) fail('UNAUTHORIZED');
        if (signal?.aborted) fail('TIMEOUT');
        engine.reserve(intent, clock());
        reserved = true;
        log(operation, auditId, intent, { ok: true, state: 'DRY_RUN', value: '' }, 'PREPARED');
        if (engine.policy.dryRun) {
          const result: Result = { ok: true, state: 'DRY_RUN', value: 'no-payment-executed' };
          log(operation, auditId, intent, result, 'DRY_RUN');
          return result;
        }
        if (BigInt(intent.amount) > balance) fail('INSUFFICIENT_BALANCE');
        // Sole payment mutation. Synchronous, mock-only, unreachable without successful reservation.
        const id = crypto.randomUUID();
        balance -= BigInt(intent.amount);
        writes += 1;
        receipts.set(id, { id, intent, consumed: false });
        const result: Result = { ok: true, state: 'SETTLED', value: id };
        log(operation, auditId, intent, result, 'SETTLED');
        return result;
      } catch (error) {
        const result: Result = { ok: false, reason: reason(error) };
        log(operation, auditId, intent, result, reserved ? 'FAILED' : 'REJECTED');
        return result;
      }
    }
  });
  return Object.freeze({
    agent,
    host: Object.freeze({
      authorize(operations: Operation[] = ['wallet.address', 'wallet.balance', 'payment.purchase']): string {
        if (capabilities.size >= engine.policy.maxStateEntries) fail('STATE_CAPACITY');
        if (operations.some(op => !['wallet.address', 'wallet.balance', 'payment.purchase'].includes(op))) fail('MALFORMED');
        const credential = crypto.randomUUID();
        capabilities.set(credential, new Set(operations));
        return credential;
      },
      revoke(capability: string): void { capabilities.delete(capability); }
    }),
    verifier: Object.freeze({
      reject(expected: unknown): void {
        try {
          const intent = parseIntent(expected);
          log('payment.purchase', crypto.randomUUID(), intent, { ok: false, reason: 'VERIFICATION_FAILED' }, 'FAILED', 'FAILED');
        } catch { /* No raw verification material is logged. */ }
      },
      consume(receiptId: unknown, expected: unknown): boolean {
        try {
          const id = text(receiptId, /^[a-zA-Z0-9_-]+$/, 80);
          const intent = parseIntent(expected);
          const receipt = receipts.get(id);
          integer(clock(), 0, Number.MAX_SAFE_INTEGER);
          if (!receipt || receipt.consumed || receipt.intent.expiresAt <= clock() || JSON.stringify(intent) !== JSON.stringify(receipt.intent)) {
            log('payment.purchase', crypto.randomUUID(), intent, { ok: false, reason: 'VERIFICATION_FAILED' }, 'FAILED', 'FAILED');
            return false;
          }
          receipt.consumed = true;
          log('payment.purchase', crypto.randomUUID(), intent, { ok: true, state: 'SETTLED', value: '' }, 'SETTLED', 'VERIFIED');
          return true;
        } catch { return false; }
      }
    }),
    get audit(): AuditLog { return audit; },
    get stats() { return { writes, balance: balance.toString(), ...engine.totals }; }
  });
}
