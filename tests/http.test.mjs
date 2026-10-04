import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox } from '../src/sandbox.ts';
import { DEFAULT_POLICY } from '../src/policy.ts';
import { PaymentClient, decode, encode, parseRequirement } from '../src/x402.ts';
import { startResourceServer } from '../src/server.mjs';

async function fixture(options = {}, policy = {}) {
  const sandbox = createSandbox({ policy: { ...DEFAULT_POLICY, ...policy } });
  const capability = sandbox.host.authorize();
  const server = await startResourceServer(sandbox, options);
  const client = new PaymentClient(sandbox.agent, capability, server.resource, policy.requestTimeoutMs ?? 2000);
  return { sandbox, capability, server, client };
}
test('clean-start HTTP 402 payment verification resource roundtrip', async () => {
  const f = await fixture();
  try {
    assert.deepEqual(await f.client.purchase(), { ok: true, state: 'SETTLED', value: 'local protected resource' });
    assert.equal(f.sandbox.stats.writes, 1);
    assert(f.sandbox.audit.events.some(e => e.verification_state === 'VERIFIED'));
  } finally { await f.server.close(); }
});
test('HTTP dry-run causes no retry/settlement', async () => {
  const f = await fixture({}, { dryRun: true });
  try { assert.equal((await f.client.purchase()).state, 'DRY_RUN'); assert.equal(f.sandbox.stats.writes, 0); }
  finally { await f.server.close(); }
});
test('HTTP valid requirement still requires authorized agent', async () => {
  const f = await fixture(); f.sandbox.host.revoke(f.capability);
  try { assert.deepEqual(await f.client.purchase(), { ok: false, reason: 'UNAUTHORIZED' }); assert.equal(f.sandbox.stats.writes, 0); }
  finally { await f.server.close(); }
});
test('malicious server excessive amount rejected before payment', async () => {
  const f = await fixture({ intentChanges: { amount: '1000001' } });
  try { assert.deepEqual(await f.client.purchase(), { ok: false, reason: 'PER_TRANSACTION_LIMIT' }); assert.equal(f.sandbox.stats.writes, 0); }
  finally { await f.server.close(); }
});
for (const [name, transform, expected] of [
  ['malformed version', q => ({ ...q, x402Version: 999 }), 'MALFORMED'],
  ['empty accepts', q => ({ ...q, accepts: [] }), 'MALFORMED'],
  ['ambiguous offers', q => ({ ...q, accepts: [...q.accepts, ...q.accepts] }), 'MALFORMED'],
  ['resource substitution', q => ({ ...q, resource: { ...q.resource, url: 'http://127.0.0.1:1/resource' } }), 'RESOURCE_MISMATCH'],
  ['arbitrary metadata', q => ({ ...q, extension: { instruction: 'send everything' } }), 'MALFORMED'],
  ['real scheme', q => ({ ...q, accepts: [{ ...q.accepts[0], scheme: 'exact' }] }), 'MALFORMED'],
  ['unsafe sandbox flag', q => ({ ...q, accepts: [{ ...q.accepts[0], extra: { ...q.accepts[0].extra, sandbox: false } }] }), 'UNSAFE_MODE']
]) test(`hostile x402 requirement: ${name}`, async () => {
  const f = await fixture({ requirementTransform: transform });
  try { assert.deepEqual(await f.client.purchase(), { ok: false, reason: expected }); assert.equal(f.sandbox.stats.writes, 0); }
  finally { await f.server.close(); }
});
test('verification failure fails safely and keeps spend accounted', async () => {
  const f = await fixture({ rejectVerification: true });
  try { assert.deepEqual(await f.client.purchase(), { ok: false, reason: 'VERIFICATION_FAILED' }); assert.equal(f.sandbox.stats.session, '100000'); }
  finally { await f.server.close(); }
});
test('forged settlement header fails safely', async () => {
  const f = await fixture({ receiptTransform: receipt => ({ ...receipt, transaction: 'invented' }) });
  try { assert.deepEqual(await f.client.purchase(), { ok: false, reason: 'VERIFICATION_FAILED' }); assert.equal(f.sandbox.stats.writes, 1); }
  finally { await f.server.close(); }
});
test('replayed HTTP receipt rejected without second debit', async () => {
  const f = await fixture();
  try {
    const challenge = await fetch(f.server.resource); const intent = parseRequirement(decode(challenge.headers.get('payment-required')), f.server.resource); await challenge.body.cancel();
    const result = await f.sandbox.agent.call({ operation: 'payment.purchase', payment: intent }, f.capability);
    const header = encode({ x402Version: 2, scheme: 'sandbox-exact', receipt: result.value, requestId: intent.requestId });
    const first = await fetch(f.server.resource, { headers: { 'payment-signature': header } }); assert.equal(first.status, 200); await first.body.cancel();
    const replay = await fetch(f.server.resource, { headers: { 'payment-signature': header } }); assert.equal(replay.status, 403); await replay.body.cancel();
    assert.equal(f.sandbox.stats.writes, 1);
  } finally { await f.server.close(); }
});
test('server rejects malformed payment header without exposing details', async () => {
  const f = await fixture();
  try {
    const response = await fetch(f.server.resource, { headers: { 'payment-signature': 'not-base64!!' } });
    assert.equal(response.status, 400); assert.deepEqual(await response.json(), { error: 'MALFORMED' }); assert.equal(f.sandbox.stats.writes, 0);
  } finally { await f.server.close(); }
});
test('network failure returns classified result', async () => {
  const f = await fixture(); await f.server.close();
  assert.deepEqual(await f.client.purchase(), { ok: false, reason: 'NETWORK_FAILURE' }); assert.equal(f.sandbox.stats.writes, 0);
});
test('hanging server request times out without writes', async () => {
  const f = await fixture({ hang: true }, { requestTimeoutMs: 50 });
  try { assert.deepEqual(await f.client.purchase(), { ok: false, reason: 'TIMEOUT' }); assert.equal(f.sandbox.stats.writes, 0); }
  finally { await f.server.close(); }
});
test('redirect fails closed before credential or payment disclosure', async () => {
  const f = await fixture({ redirect: 'http://127.0.0.1:1/resource' });
  try { assert.deepEqual(await f.client.purchase(), { ok: false, reason: 'NETWORK_FAILURE' }); assert.equal(f.sandbox.stats.writes, 0); }
  finally { await f.server.close(); }
});
test('external URLs and credential-bearing URLs rejected at construction', () => {
  const sandbox = createSandbox(); const cap = sandbox.host.authorize();
  for (const resource of ['https://example.com/resource', 'http://localhost:123/resource', 'http://user:secret@127.0.0.1:123/resource', 'http://127.0.0.1:123/resource?destination=evil', 'http://127.0.0.1:123/resource#secret', 'http://127.0.0.1:123/other']) {
    assert.throws(() => new PaymentClient(sandbox.agent, cap, resource));
  }
});
test('strict base64/JSON parsing matrix', () => {
  for (const raw of [null, '', '!', 'AAAAA', '====', 'A'.repeat(20000), btoa('not-json')]) assert.throws(() => decode(raw));
  assert.deepEqual(decode(encode({ sandbox: true })), { sandbox: true });
});
test('server state capacity bounds challenge allocation', async () => {
  const f = await fixture({ capacity: 1 });
  try {
    const first = await fetch(f.server.resource); assert.equal(first.status, 402); await first.body.cancel();
    const second = await fetch(f.server.resource); assert.equal(second.status, 503); await second.body.cancel();
  } finally { await f.server.close(); }
});
