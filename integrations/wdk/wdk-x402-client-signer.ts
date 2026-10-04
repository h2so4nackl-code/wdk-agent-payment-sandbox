import type { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import type { ClientEvmSigner } from '@x402/evm';
import { SandboxError, fail, REASONS } from '../../src/model.ts';

type Hex = `0x${string}`;
type SigningInput = Parameters<ClientEvmSigner['signTypedData']>[0];
type WdkInput = Parameters<WalletAccountEvm['signTypedData']>[0];
export type WdkSigningAccount = Pick<WalletAccountEvm, 'getAddress' | 'signTypedData'>;
export type PolicyAuthorization = (data: SigningInput) => Promise<void>;
const ASSET = '0x1111111111111111111111111111111111111111';
const RECIPIENT = '0x2222222222222222222222222222222222222222';
const FIELDS = [
  { name: 'from', type: 'address' }, { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' }, { name: 'validAfter', type: 'uint256' },
  { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' }
];

export function isHexEvmAddress(value: unknown): value is Hex {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value);
}
export function isEoaSignature(value: unknown): value is Hex {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{128}(1[bBcC])$/.test(value);
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}
function record(value: unknown, names: readonly string[]): Record<string, unknown> {
  if (!isRecord(value) || Reflect.ownKeys(value).length !== names.length) fail('MALFORMED');
  for (const name of names) {
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) fail('MALFORMED');
  }
  return value;
}
function address(value: unknown): Hex {
  if (!isHexEvmAddress(value)) fail('PREPARATION_FAILED');
  return value;
}

// Only the local EIP-3009 EOA profile is supported. No permit/transaction capabilities.
function convert(input: unknown, payer: Hex, now: number): { x402: SigningInput; wdk: WdkInput } {
  const d = record(input, ['domain', 'types', 'primaryType', 'message']);
  const domain = record(d.domain, ['name', 'version', 'chainId', 'verifyingContract']);
  if (domain.chainId !== 31337) fail('NETWORK_DENIED');
  if (domain.name !== 'SandboxToken' || domain.version !== '1' || domain.verifyingContract !== ASSET) fail('CONTRACT_DENIED');
  if (d.primaryType !== 'TransferWithAuthorization') fail('MALFORMED');
  const types = record(d.types, ['TransferWithAuthorization']);
  const fields = types.TransferWithAuthorization;
  if (!Array.isArray(fields) || fields.length !== FIELDS.length) fail('MALFORMED');
  const arrayKeys = Reflect.ownKeys(fields);
  if (arrayKeys.length !== FIELDS.length + 1) fail('MALFORMED');
  for (let i = 0; i < FIELDS.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(fields, String(i));
    if (!descriptor || !('value' in descriptor)) fail('MALFORMED');
    const field = record(descriptor.value, ['name', 'type']);
    const expected = FIELDS[i];
    if (!expected || field.name !== expected.name || field.type !== expected.type) fail('MALFORMED');
  }
  const m = record(d.message, ['from', 'to', 'value', 'validAfter', 'validBefore', 'nonce']);
  const from = address(m.from);
  const to = address(m.to);
  if (from.toLowerCase() !== payer.toLowerCase()) fail('PREPARATION_FAILED');
  if (to !== RECIPIENT) fail('RECIPIENT_DENIED');
  if (typeof m.value !== 'bigint' || m.value <= 0n || m.value >= 2n ** 256n) fail('MALFORMED');
  const seconds = Math.floor(now / 1000);
  if (!Number.isSafeInteger(seconds) || seconds < 0 || m.validAfter !== 0n || typeof m.validBefore !== 'bigint'
    || m.validBefore <= BigInt(seconds + 6) || m.validBefore > BigInt(seconds + 30)) fail('EXPIRED');
  if (typeof m.nonce !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(m.nonce)) fail('MALFORMED');
  const mappedDomain = Object.freeze({ name: 'SandboxToken', version: '1', chainId: 31337, verifyingContract: ASSET });
  const mappedMessage = Object.freeze({ from, to, value: m.value, validAfter: 0n, validBefore: m.validBefore, nonce: m.nonce });
  // Distinct field arrays: a host authorization callback cannot mutate what WDK will sign.
  const wdk: WdkInput = { domain: mappedDomain, types: { TransferWithAuthorization: FIELDS.map(f => ({ ...f })) }, message: mappedMessage };
  const x402: SigningInput = Object.freeze({ domain: mappedDomain,
    types: Object.freeze({ TransferWithAuthorization: Object.freeze(FIELDS.map(f => Object.freeze({ ...f }))) }),
    primaryType: 'TransferWithAuthorization', message: mappedMessage });
  return { x402, wdk };
}

export class WdkX402ClientSigner implements ClientEvmSigner {
  #account: WdkSigningAccount;
  #authorize: PolicyAuthorization;
  #clock: () => number;
  #onSigned: () => void;
  #address: Hex | undefined;
  #used = new Set<string>();
  #busy = false;
  constructor(account: WdkSigningAccount, authorize: PolicyAuthorization = async () => { fail('UNAUTHORIZED'); }, clock: () => number = Date.now, onSigned: () => void = () => {}) {
    this.#account = account; this.#authorize = authorize; this.#clock = clock;
    this.#onSigned = onSigned;
  }
  get address(): Hex {
    if (!this.#address) fail('PREPARATION_FAILED');
    return this.#address;
  }
  async initialize(): Promise<this> {
    let value: unknown;
    try { value = await this.#account.getAddress(); } catch { fail('PREPARATION_FAILED'); }
    const validated = address(value);
    if (this.#address && validated !== this.#address) fail('PREPARATION_FAILED');
    this.#address = validated;
    return this;
  }
  async signTypedData(input: SigningInput): Promise<Hex> {
    if (this.#busy) fail('DUPLICATE');
    const mapped = convert(input, this.address, this.#clock());
    const nonce = mapped.x402.message.nonce;
    if (typeof nonce !== 'string') fail('MALFORMED');
    if (this.#used.has(nonce)) fail('REPLAY');
    if (this.#used.size >= 1024) fail('STATE_CAPACITY');
    this.#busy = true;
    try {
      try { await this.#authorize(mapped.x402); }
      catch (error) {
        if (error instanceof SandboxError && REASONS.includes(error.code)) throw new SandboxError(error.code);
        if (error instanceof Error && error.message === 'DRY_RUN') throw new Error('DRY_RUN');
        fail('UNAUTHORIZED');
      }
      // Revalidate time after the asynchronous policy gate, before the only signing call.
      convert(mapped.x402, this.address, this.#clock());
      this.#used.add(nonce);
      let signature: unknown;
      try { signature = await this.#account.signTypedData(mapped.wdk); } catch { fail('PREPARATION_FAILED'); }
      if (!isEoaSignature(signature)) fail('PREPARATION_FAILED');
      try { this.#onSigned(); } catch { fail('PREPARATION_FAILED'); }
      return signature;
    } finally { this.#busy = false; }
  }
}
