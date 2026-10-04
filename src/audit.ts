import type { AuditEvent } from './model.ts';
import { ASSET, NETWORK, RECIPIENT, REASONS, fail, integer } from './model.ts';

export class AuditLog {
  readonly #events: Readonly<AuditEvent>[] = [];
  readonly #capacity: number;
  constructor(capacity = 10000) { this.#capacity = integer(capacity, 1, 100000); }
  append(event: AuditEvent): void {
    if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(event.timestamp)
      || !/^[0-9a-f-]{36}$/.test(event.request_id)
      || !['wallet.address', 'wallet.balance', 'payment.purchase'].includes(event.operation)
      || !['READ', 'WRITE'].includes(event.read_write_class)
      || !['ALLOW', 'DENY'].includes(event.policy_result)
      || !REASONS.includes(event.policy_reason)
      || !['READ', 'REJECTED', 'PREPARED', 'DRY_RUN', 'SETTLED', 'FAILED'].includes(event.payment_state)
      || !['NOT_REQUESTED', 'VERIFIED', 'FAILED'].includes(event.verification_state)
      || !/^(0|[1-9][0-9]{0,23})$/.test(event.amount)) fail('MALFORMED');
    // Explicit projection: unknown fields, credentials, error messages and external identifiers cannot leak.
    const sanitized: AuditEvent = {
      timestamp: event.timestamp, request_id: event.request_id, operation: event.operation,
      read_write_class: event.read_write_class,
      network: event.network === NETWORK ? NETWORK : 'untrusted', asset: event.asset === ASSET ? ASSET : 'untrusted',
      amount: event.amount, recipient: event.recipient === RECIPIENT ? RECIPIENT : 'untrusted',
      policy_result: event.policy_result, policy_reason: event.policy_reason,
      payment_state: event.payment_state, verification_state: event.verification_state
    };
    if (this.#events.length >= this.#capacity) this.#events.shift();
    this.#events.push(Object.freeze(sanitized));
  }
  get events(): Readonly<AuditEvent>[] { return this.#events.map(event => ({ ...event })); }
  jsonLines(): string { return this.#events.map(event => JSON.stringify(event)).join('\n'); }
}
