import { ASSET, CONTRACT, NETWORK, RECIPIENT, fail, integer, keys, object, text, units } from './model.ts';
import type { Intent, Policy } from './model.ts';

export const DEFAULT_POLICY: Readonly<Policy> = Object.freeze({
  mode: 'mock', externalSpendLimit: '0', dryRun: false,
  perTransaction: '1000000', sessionLimit: '3000000', dailyLimit: '5000000',
  recipients: Object.freeze([RECIPIENT]) as unknown as string[],
  networks: Object.freeze([NETWORK]) as unknown as string[],
  assets: Object.freeze([ASSET]) as unknown as string[],
  contracts: Object.freeze([CONTRACT]) as unknown as string[],
  requestTimeoutMs: 2000, maxStateEntries: 10000
});

export function parsePolicy(value: unknown): Readonly<Policy> {
  const data = object(value);
  keys(data, Object.keys(DEFAULT_POLICY));
  if (data.mode !== 'mock' || data.externalSpendLimit !== '0') fail('UNSAFE_MODE');
  if (typeof data.dryRun !== 'boolean') fail('MALFORMED');
  const list = (key: string): string[] => {
    const values = data[key];
    if (!Array.isArray(values) || values.length === 0 || values.length > 64) fail('MALFORMED');
    const result = values.map(value => text(value, /^[a-zA-Z0-9:_-]+$/));
    if (new Set(result).size !== result.length) fail('MALFORMED');
    return Object.freeze(result) as unknown as string[];
  };
  const policy: Policy = {
    mode: 'mock', externalSpendLimit: '0', dryRun: data.dryRun,
    perTransaction: units(data.perTransaction, true), sessionLimit: units(data.sessionLimit, true), dailyLimit: units(data.dailyLimit, true),
    recipients: list('recipients'), networks: list('networks'), assets: list('assets'), contracts: list('contracts'),
    requestTimeoutMs: integer(data.requestTimeoutMs, 10, 30000), maxStateEntries: integer(data.maxStateEntries, 1, 100000)
  };
  // Configuration cannot enable real rails, regardless of allowlists.
  if (policy.networks.some(network => network !== NETWORK) || policy.assets.some(asset => asset !== ASSET)
    || policy.contracts.some(contract => contract !== CONTRACT) || policy.recipients.some(recipient => recipient !== RECIPIENT)) fail('UNSAFE_MODE');
  return Object.freeze(policy);
}

export class PolicyEngine {
  readonly #policy: Readonly<Policy>;
  readonly #requests = new Set<string>();
  readonly #nonces = new Set<string>();
  #session = 0n;
  #day = '';
  #daily = 0n;
  #lastNow = 0;
  constructor(policy: unknown = DEFAULT_POLICY) { this.#policy = parsePolicy(policy); }
  get policy(): Readonly<Policy> { return this.#policy; }
  get totals(): { session: string; daily: string; day: string } {
    return { session: this.#session.toString(), daily: this.#daily.toString(), day: this.#day };
  }
  evaluate(intent: Readonly<Intent>, now: number): void {
    integer(now, 0, Number.MAX_SAFE_INTEGER);
    if (now < this.#lastNow) fail('EXPIRED');
    if (intent.expiresAt <= now || intent.expiresAt > now + this.#policy.requestTimeoutMs) fail('EXPIRED');
    if (!this.#policy.networks.includes(intent.network)) fail('NETWORK_DENIED');
    if (!this.#policy.assets.includes(intent.asset)) fail('ASSET_DENIED');
    if (!this.#policy.contracts.includes(intent.contract)) fail('CONTRACT_DENIED');
    if (!this.#policy.recipients.includes(intent.recipient)) fail('RECIPIENT_DENIED');
    if (this.#requests.has(intent.requestId)) fail('DUPLICATE');
    if (this.#nonces.has(intent.nonce)) fail('REPLAY');
    if (this.#requests.size >= this.#policy.maxStateEntries) fail('STATE_CAPACITY');
    const amount = BigInt(intent.amount);
    if (amount > BigInt(this.#policy.perTransaction)) fail('PER_TRANSACTION_LIMIT');
    if (this.#session + amount > BigInt(this.#policy.sessionLimit)) fail('SESSION_LIMIT');
    const day = new Date(now).toISOString().slice(0, 10);
    const spent = day === this.#day ? this.#daily : 0n;
    if (spent + amount > BigInt(this.#policy.dailyLimit)) fail('DAILY_LIMIT');
  }
  reserve(intent: Readonly<Intent>, now: number): void {
    // No await between checks and accounting: atomic in this single-process harness.
    this.evaluate(intent, now);
    this.#requests.add(intent.requestId);
    this.#nonces.add(intent.nonce);
    this.#lastNow = now;
    const day = new Date(now).toISOString().slice(0, 10);
    if (day !== this.#day) { this.#day = day; this.#daily = 0n; }
    if (!this.#policy.dryRun) {
      this.#session += BigInt(intent.amount);
      this.#daily += BigInt(intent.amount);
    }
    // Retain reservations even on timeout/ambiguous failure; no unsafe retry refunds.
  }
}
