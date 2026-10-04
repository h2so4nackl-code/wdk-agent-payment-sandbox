import { createHash } from 'node:crypto';
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { decodePaymentRequiredHeader, decodePaymentResponseHeader } from '@x402/core/http';
import { createSandbox } from '../../src/sandbox.ts';
import { DEFAULT_POLICY, parsePolicy } from '../../src/policy.ts';
import { ASSET, CONTRACT, NETWORK, RECIPIENT, fail, keys, object, reason, resourceUrl, units } from '../../src/model.ts';
import { testWallet } from './test-wallet.mjs';
import { WdkX402ClientSigner } from './wdk-x402-client-signer.ts';

export const TEST_NETWORK = 'eip155:31337';
export const TEST_ASSET = '0x1111111111111111111111111111111111111111';
export const TEST_RECIPIENT = '0x2222222222222222222222222222222222222222';
export function testRequirement(resource, changes = {}) {
  return { x402Version: 2, resource: { url: resource, description: 'Local WDK conformance fixture', mimeType: 'application/json' }, accepts: [{
    scheme: 'exact', network: TEST_NETWORK, asset: TEST_ASSET, amount: '100000', payTo: TEST_RECIPIENT,
    maxTimeoutSeconds: 30, extra: { name: 'SandboxToken', version: '1', assetTransferMethod: 'eip3009' }, ...changes
  }] };
}
export function validateRequirement(raw, pinnedResource) {
  // Snapshot only JSON data; reject accessors before any library interprets it.
  const q = object(raw); keys(q, Object.hasOwn(q, 'error') ? ['x402Version', 'resource', 'accepts', 'error'] : ['x402Version', 'resource', 'accepts']);
  if (Object.hasOwn(q, 'error') && q.error !== 'Payment required') fail('MALFORMED');
  if (q.x402Version !== 2 || !Array.isArray(q.accepts) || q.accepts.length !== 1) fail('MALFORMED');
  const resource = object(q.resource); keys(resource, ['url', 'description', 'mimeType']);
  if (resourceUrl(resource.url) !== pinnedResource) fail('RESOURCE_MISMATCH');
  if (resource.description !== 'Local WDK conformance fixture' || resource.mimeType !== 'application/json') fail('MALFORMED');
  const r = object(q.accepts[0]); keys(r, ['scheme', 'network', 'asset', 'amount', 'payTo', 'maxTimeoutSeconds', 'extra']);
  if (r.scheme !== 'exact' || r.maxTimeoutSeconds !== 30) fail('MALFORMED');
  if (r.network !== TEST_NETWORK) fail('NETWORK_DENIED');
  if (r.asset !== TEST_ASSET) fail('ASSET_DENIED');
  if (r.payTo !== TEST_RECIPIENT) fail('RECIPIENT_DENIED');
  units(r.amount);
  const extra = object(r.extra); keys(extra, ['name', 'version', 'assetTransferMethod']);
  if (extra.name !== 'SandboxToken' || extra.version !== '1' || extra.assetTransferMethod !== 'eip3009') fail('CONTRACT_DENIED');
  return JSON.parse(JSON.stringify({ x402Version: q.x402Version, resource: q.resource, accepts: q.accepts }));
}
function validateTypedData(data, requirement, address, now) {
  const r = requirement.accepts[0];
  const d = object(data); keys(d, ['domain', 'types', 'primaryType', 'message']);
  const domain = object(d.domain); keys(domain, ['name', 'version', 'chainId', 'verifyingContract']);
  if (domain.chainId !== 31337 || domain.verifyingContract !== TEST_ASSET || domain.name !== r.extra.name || domain.version !== r.extra.version) fail('CONTRACT_DENIED');
  const expectedTypes = { TransferWithAuthorization: [
    { name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' }, { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' }
  ] };
  if (d.primaryType !== 'TransferWithAuthorization' || JSON.stringify(d.types) !== JSON.stringify(expectedTypes)) fail('MALFORMED');
  const m = object(d.message); keys(m, ['from', 'to', 'value', 'validAfter', 'validBefore', 'nonce']);
  if (m.from.toLowerCase() !== address.toLowerCase() || m.to !== TEST_RECIPIENT || m.value !== BigInt(r.amount)) fail('PREPARATION_FAILED');
  if (m.validAfter !== 0n || typeof m.validBefore !== 'bigint' || m.validBefore <= BigInt(Math.floor(now / 1000) + 6) || m.validBefore > BigInt(Math.floor(now / 1000) + 30)) fail('EXPIRED');
  if (typeof m.nonce !== 'string' || !/^0x[0-9a-f]{64}$/i.test(m.nonce)) fail('MALFORMED');
}
export async function createWdkTestMode(options = {}) {
  if (options.mode !== 'wdk-test') fail('UNSAFE_MODE');
  const resource = resourceUrl(options.resource);
  const clock = options.clock ?? Date.now;
  const policy = parsePolicy(options.policy ?? DEFAULT_POLICY);
  const wallet = await testWallet();
  const sandbox = createSandbox({ policy, clock, wallet: wallet.account });
  let testAuthorizations = 0;
  function requirement(raw) {
    const q = validateRequirement(raw, resource);
    if (BigInt(q.accepts[0].amount) > BigInt(policy.perTransaction)) fail('PER_TRANSACTION_LIMIT');
    return q;
  }
  async function client(capability, context, signal) {
    const signer = await new WdkX402ClientSigner(wallet.account, async data => {
      if (signal?.aborted) fail('TIMEOUT');
      if (!context.requirement) fail('UNAUTHORIZED');
      validateTypedData(data, context.requirement, wallet.account.address, clock());
      const requestId = createHash('sha256').update(JSON.stringify(context.requirement)).digest('hex');
      const payment = { requestId, nonce: data.message.nonce, operation: 'payment.purchase', intent: 'purchase-resource',
        network: NETWORK, asset: ASSET, contract: CONTRACT, recipient: RECIPIENT,
        amount: context.requirement.accepts[0].amount, resource, expiresAt: clock() + 1800 };
      const decision = await sandbox.agent.call({ operation: 'payment.purchase', payment }, capability, signal);
      if (!decision.ok) fail(decision.reason);
      if (decision.state === 'DRY_RUN') throw new Error('DRY_RUN');
      if (signal?.aborted) fail('TIMEOUT');
    }, clock, () => { testAuthorizations++; context.signed = true; }).initialize();
    const c = new x402Client();
    c.setSpendControls({ allowedAssets: [{ network: TEST_NETWORK, asset: TEST_ASSET, maxAmountPerPayment: policy.perTransaction }] });
    registerExactEvmScheme(c, { signer, networks: [TEST_NETWORK] });
    return c;
  }
  async function bounded(work, external) {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    if (external?.aborted) controller.abort();
    external?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(cancel, policy.requestTimeoutMs);
    try {
      return await Promise.race([work(controller.signal), new Promise((_, reject) => {
        if (controller.signal.aborted) reject(new Error('TIMEOUT'));
        else controller.signal.addEventListener('abort', () => reject(new Error('TIMEOUT')), { once: true });
      })]);
    } finally { clearTimeout(timer); external?.removeEventListener('abort', cancel); }
  }
  const agent = Object.freeze({
    async call(raw, capability, signal) {
      try {
        const command = object(raw);
        const descriptor = Object.getOwnPropertyDescriptor(command, 'operation');
        if (!descriptor || !('value' in descriptor)) fail('MALFORMED');
        if (command.operation !== 'payment.purchase') return await sandbox.agent.call(command, capability, signal);
        keys(command, ['operation', 'payment']);
        const required = requirement(command.payment);
        const context = { requirement: required };
        const payload = await bounded(async signal => (await client(capability, context, signal)).createPaymentPayload(required), signal);
        return { ok: true, state: 'PREPARED', value: JSON.stringify(payload) };
      } catch (error) { return { ok: false, reason: error?.message === 'DRY_RUN' ? 'DRY_RUN' : error?.message === 'TIMEOUT' ? 'TIMEOUT' : reason(error) }; }
    },
    async purchase(capability, transport, signal) {
      // transport is a trusted HOST test fixture, never an agent-supplied URL or command.
      try {
        const context = {};
        const response = await bounded(async signal => {
          const guardedFetch = async input => {
            if (signal.aborted) fail('TIMEOUT');
            const req = new Request(input, { signal, redirect: 'error' });
            if (req.url !== resource || req.method !== 'GET') fail('RESOURCE_MISMATCH');
            const response = await transport(req);
            if (response.status === 402) {
              const header = response.headers.get('payment-required');
              if (!header || header.length > 16384) fail('MALFORMED');
              context.requirement = requirement(decodePaymentRequiredHeader(header));
              // The library gets a bounded, reconstructed response, never an arbitrary stream.
              return new Response('{}', { status: 402, headers: { 'payment-required': header } });
            }
            return response;
          };
          return await wrapFetchWithPayment(guardedFetch, await client(capability, context, signal))(resource);
        }, signal);
        if (response.status !== 200 || !context.signed) fail('VERIFICATION_FAILED');
        const header = response.headers.get('payment-response');
        if (!header || header.length > 16384) fail('VERIFICATION_FAILED');
        const settled = decodePaymentResponseHeader(header);
        if (settled.success !== true || settled.network !== TEST_NETWORK || settled.payer?.toLowerCase() !== wallet.account.address.toLowerCase()
          || typeof settled.transaction !== 'string' || !/^0x[0-9a-f]{64}$/i.test(settled.transaction)) fail('VERIFICATION_FAILED');
        return { ok: true, state: 'VERIFIED_RESOURCE', value: response };
      } catch (error) {
        const message = typeof error?.message === 'string' ? error.message : '';
        const known = ['DRY_RUN', 'TIMEOUT', 'UNAUTHORIZED', 'DUPLICATE', 'PER_TRANSACTION_LIMIT', 'SESSION_LIMIT', 'DAILY_LIMIT'];
        const wrapped = known.find(code => message === code || message.endsWith(`: ${code}`));
        return { ok: false, reason: wrapped ?? reason(error) };
      }
    }
  });
  return Object.freeze({ agent, host: sandbox.host, get audit() { return sandbox.audit; },
    get stats() { return { ...sandbox.stats, ...wallet.stats(), testAuthorizations }; }, dispose: wallet.dispose });
}
