import { ASSET, CONTRACT, NETWORK, RECIPIENT, SCHEME, fail, integer, keys, object, parseIntent, reason, resourceUrl, text, units } from './model.ts';
import type { Intent, Result } from './model.ts';

export function encode(value: unknown): string { return btoa(JSON.stringify(value)); }
export function decode(value: unknown): unknown {
  const encoded = text(value, /^[A-Za-z0-9+/]+={0,2}$/, 16384);
  if (encoded.length % 4 !== 0) fail('MALFORMED');
  try {
    if (btoa(atob(encoded)) !== encoded) fail('MALFORMED');
    return JSON.parse(atob(encoded)) as unknown;
  } catch { fail('MALFORMED'); }
}
export function requirement(intent: Readonly<Intent>) {
  return {
    x402Version: 2,
    resource: { url: intent.resource, description: 'Synthetic sandbox resource', mimeType: 'application/json' },
    accepts: [{ scheme: SCHEME, network: intent.network, asset: intent.asset, amount: intent.amount,
      payTo: intent.recipient, maxTimeoutSeconds: 2,
      extra: { sandbox: true, contract: intent.contract, requestId: intent.requestId, nonce: intent.nonce, expiresAt: intent.expiresAt } }]
  };
}
export function parseRequirement(value: unknown, pinnedResource: string): Readonly<Intent> {
  const data = object(value);
  keys(data, ['x402Version', 'resource', 'accepts']);
  if (data.x402Version !== 2 || !Array.isArray(data.accepts) || data.accepts.length !== 1) fail('MALFORMED');
  const resource = object(data.resource);
  keys(resource, ['url', 'description', 'mimeType']);
  if (resourceUrl(resource.url) !== resourceUrl(pinnedResource)) fail('RESOURCE_MISMATCH');
  if (resource.description !== 'Synthetic sandbox resource' || resource.mimeType !== 'application/json') fail('MALFORMED');
  const offer = object(data.accepts[0]);
  keys(offer, ['scheme', 'network', 'asset', 'amount', 'payTo', 'maxTimeoutSeconds', 'extra']);
  if (offer.scheme !== SCHEME || offer.maxTimeoutSeconds !== 2) fail('MALFORMED');
  const extra = object(offer.extra);
  keys(extra, ['sandbox', 'contract', 'requestId', 'nonce', 'expiresAt']);
  if (extra.sandbox !== true) fail('UNSAFE_MODE');
  return parseIntent({ requestId: extra.requestId, nonce: extra.nonce, operation: 'payment.purchase', intent: 'purchase-resource',
    network: offer.network, asset: offer.asset, contract: extra.contract, amount: offer.amount,
    recipient: offer.payTo, resource: resource.url, expiresAt: extra.expiresAt });
}
export function makeIntent(resource: string, now = Date.now(), changes: Partial<Intent> = {}): Readonly<Intent> {
  return parseIntent({ requestId: crypto.randomUUID(), nonce: crypto.randomUUID(), operation: 'payment.purchase', intent: 'purchase-resource',
    network: NETWORK, asset: ASSET, contract: CONTRACT, amount: '100000', recipient: RECIPIENT,
    resource, expiresAt: now + 1800, ...changes });
}
export interface AgentGateway { call(command: unknown, capability: unknown, signal?: AbortSignal): Promise<Result> }
export class PaymentClient {
  readonly #agent: AgentGateway;
  readonly #capability: string;
  readonly #resource: string;
  readonly #timeout: number;
  constructor(agent: AgentGateway, capability: string, pinnedResource: string, timeoutMs = 2000) {
    this.#agent = agent; this.#capability = capability; this.#resource = resourceUrl(pinnedResource);
    this.#timeout = integer(timeoutMs, 10, 30000);
  }
  async purchase(): Promise<Result> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.#timeout);
    try {
      const initial = await fetch(this.#resource, { redirect: 'error', signal: controller.signal });
      if (initial.status !== 402) { await initial.body?.cancel(); fail('VERIFICATION_FAILED'); }
      const raw = initial.headers.get('payment-required');
      await initial.body?.cancel();
      const intent = parseRequirement(decode(raw), this.#resource);
      if (controller.signal.aborted) fail('TIMEOUT');
      const result = await this.#agent.call({ operation: 'payment.purchase', payment: intent }, this.#capability, controller.signal);
      if (!result.ok || result.state === 'DRY_RUN') return result;
      if (controller.signal.aborted) fail('TIMEOUT');
      const response = await fetch(this.#resource, { redirect: 'error', signal: controller.signal,
        headers: { 'payment-signature': encode({ x402Version: 2, scheme: SCHEME, receipt: result.value, requestId: intent.requestId }) } });
      if (response.status !== 200) { await response.body?.cancel(); fail('VERIFICATION_FAILED'); }
      const settlement = object(decode(response.headers.get('payment-response')));
      keys(settlement, ['success', 'network', 'transaction', 'requestId']);
      if (settlement.success !== true || settlement.network !== NETWORK || settlement.transaction !== result.value || settlement.requestId !== intent.requestId) {
        await response.body?.cancel(); fail('VERIFICATION_FAILED');
      }
      // Resource body is bounded; it is untrusted content and never an agent command.
      const reader = response.body?.getReader();
      if (!reader) fail('VERIFICATION_FAILED');
      let body = '';
      let bytes = 0;
      const decoder = new TextDecoder('utf-8', { fatal: true });
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.length;
        if (bytes > 16384) { await reader.cancel(); fail('VERIFICATION_FAILED'); }
        body += decoder.decode(chunk.value, { stream: true });
      }
      body += decoder.decode();
      const payload = object(JSON.parse(body) as unknown);
      keys(payload, ['data', 'requestId']);
      if (payload.requestId !== intent.requestId || payload.data !== 'local protected resource') fail('VERIFICATION_FAILED');
      return { ok: true, state: 'SETTLED', value: payload.data };
    } catch (error) {
      return { ok: false, reason: controller.signal.aborted ? 'TIMEOUT' : error instanceof TypeError ? 'NETWORK_FAILURE' : reason(error) };
    } finally { clearTimeout(timer); }
  }
}
export function parsePaymentHeader(raw: unknown): { receipt: string; requestId: string } {
  const data = object(decode(raw));
  keys(data, ['x402Version', 'scheme', 'receipt', 'requestId']);
  if (data.x402Version !== 2 || data.scheme !== SCHEME) fail('MALFORMED');
  return { receipt: text(data.receipt, /^[a-zA-Z0-9_-]+$/, 80), requestId: text(data.requestId, /^[a-zA-Z0-9_-]+$/, 80) };
}
export function validateAmount(value: unknown): string { return units(value); }
