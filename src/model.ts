export const NETWORK = 'sandbox:local';
export const ASSET = 'mock:USDT0';
export const CONTRACT = 'mock:usdt0-contract';
export const RECIPIENT = 'mock:resource-merchant';
export const ADDRESS = 'mock:agent-wallet';
export const SCHEME = 'sandbox-exact';
export type Operation = 'wallet.address' | 'wallet.balance' | 'payment.purchase';
export const REASONS = ['ALLOWED', 'MALFORMED', 'UNAUTHORIZED', 'UNSAFE_MODE', 'EXPIRED',
  'PER_TRANSACTION_LIMIT', 'SESSION_LIMIT', 'DAILY_LIMIT', 'RECIPIENT_DENIED',
  'NETWORK_DENIED', 'ASSET_DENIED', 'CONTRACT_DENIED', 'DUPLICATE', 'REPLAY',
  'TIMEOUT', 'PREPARATION_FAILED', 'EXECUTION_FAILED', 'NETWORK_FAILURE',
  'VERIFICATION_FAILED', 'RESOURCE_MISMATCH', 'STATE_CAPACITY', 'INSUFFICIENT_BALANCE'] as const;
export type Reason = typeof REASONS[number];

export class SandboxError extends Error {
  readonly code: Reason;
  constructor(code: Reason) { super(code); this.name = 'SandboxError'; this.code = code; }
}
export function fail(code: Reason): never { throw new SandboxError(code); }
export function reason(error: unknown): Reason {
  return error instanceof SandboxError && REASONS.includes(error.code) ? error.code : 'EXECUTION_FAILED';
}
export interface Intent {
  requestId: string;
  nonce: string;
  operation: 'payment.purchase';
  intent: 'purchase-resource';
  network: string;
  asset: string;
  contract: string;
  amount: string;
  recipient: string;
  resource: string;
  expiresAt: number;
}
export interface Policy {
  mode: 'mock';
  externalSpendLimit: '0';
  dryRun: boolean;
  perTransaction: string;
  sessionLimit: string;
  dailyLimit: string;
  recipients: string[];
  networks: string[];
  assets: string[];
  contracts: string[];
  requestTimeoutMs: number;
  maxStateEntries: number;
}
export interface AuditEvent {
  timestamp: string;
  request_id: string;
  operation: Operation;
  read_write_class: 'READ' | 'WRITE';
  network: string;
  asset: string;
  amount: string;
  recipient: string;
  policy_result: 'ALLOW' | 'DENY';
  policy_reason: Reason;
  payment_state: 'READ' | 'REJECTED' | 'PREPARED' | 'DRY_RUN' | 'SETTLED' | 'FAILED';
  verification_state: 'NOT_REQUESTED' | 'VERIFIED' | 'FAILED';
}
export type Result = { ok: true; state: 'READ' | 'DRY_RUN' | 'SETTLED'; value: string }
  | { ok: false; reason: Reason };

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) fail('MALFORMED');
  return value as Record<string, unknown>;
}
export function keys(value: Record<string, unknown>, expected: string[]): void {
  if (Object.keys(value).length !== expected.length || expected.some(key => !Object.hasOwn(value, key))) fail('MALFORMED');
  // Accessors are executable code, not JSON data.
  if (Object.values(Object.getOwnPropertyDescriptors(value)).some(descriptor => !('value' in descriptor))) fail('MALFORMED');
}
export function text(value: unknown, pattern: RegExp, max = 160): string {
  if (typeof value !== 'string' || value.length > max || !pattern.test(value)) fail('MALFORMED');
  return value;
}
export function units(value: unknown, allowZero = false): string {
  const result = text(value, /^(0|[1-9][0-9]*)$/, 24);
  if (!allowZero && result === '0') fail('MALFORMED');
  return result;
}
export function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) fail('MALFORMED');
  return value;
}
export function resourceUrl(value: unknown): string {
  if (typeof value !== 'string' || value.length > 256) fail('MALFORMED');
  let url: URL;
  try { url = new URL(value); } catch { fail('MALFORMED'); }
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.username || url.password || url.hash || url.search || url.pathname !== '/resource' || url.href !== value) fail('RESOURCE_MISMATCH');
  return url.href;
}
export function parseIntent(value: unknown): Readonly<Intent> {
  const data = object(value);
  keys(data, ['requestId', 'nonce', 'operation', 'intent', 'network', 'asset', 'contract', 'amount', 'recipient', 'resource', 'expiresAt']);
  if (data.operation !== 'payment.purchase' || data.intent !== 'purchase-resource') fail('MALFORMED');
  return Object.freeze({
    requestId: text(data.requestId, /^[a-zA-Z0-9_-]+$/, 80),
    nonce: text(data.nonce, /^[a-zA-Z0-9_-]+$/, 80),
    operation: data.operation, intent: data.intent,
    network: text(data.network, /^[a-zA-Z0-9:_-]+$/),
    asset: text(data.asset, /^[a-zA-Z0-9:_-]+$/),
    contract: text(data.contract, /^[a-zA-Z0-9:_-]+$/),
    amount: units(data.amount), recipient: text(data.recipient, /^[a-zA-Z0-9:_-]+$/),
    resource: resourceUrl(data.resource), expiresAt: integer(data.expiresAt, 0, Number.MAX_SAFE_INTEGER)
  });
}
