import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox } from '../src/sandbox.ts';
import { DEFAULT_POLICY, parsePolicy } from '../src/policy.ts';
import { makeIntent } from '../src/x402.ts';
import { ADDRESS } from '../src/model.ts';

const START = Date.UTC(2026, 9, 3, 12);
const RESOURCE = 'http://127.0.0.1:12345/resource';
function setup(changes = {}, options = {}) {
  let now = START;
  const sandbox = createSandbox({ policy: { ...DEFAULT_POLICY, ...changes }, clock: () => now, ...options });
  const capability = sandbox.host.authorize();
  let sequence = 0;
  const intent = (changes = {}) => makeIntent(RESOURCE, now, { requestId: `request-${++sequence}`, nonce: `nonce-${sequence}`, ...changes });
  const pay = payment => sandbox.agent.call({ operation: 'payment.purchase', payment }, capability);
  return { sandbox, capability, intent, pay, setTime: value => { now = value; } };
}
test('read-only address and balance succeed without writes', async () => {
  const f = setup();
  assert.deepEqual(await f.sandbox.agent.call({ operation: 'wallet.address' }, f.capability), { ok: true, state: 'READ', value: ADDRESS });
  assert.equal((await f.sandbox.agent.call({ operation: 'wallet.balance' }, f.capability)).value, '100000000');
  assert.equal(f.sandbox.stats.writes, 0);
});
test('allowed mock payment prepares, reserves and settles', async () => {
  const f = setup();
  assert.equal((await f.pay(f.intent())).state, 'SETTLED');
  assert.equal(f.sandbox.stats.writes, 1);
  assert.equal(f.sandbox.stats.balance, '99900000');
  assert.equal(f.sandbox.stats.session, '100000');
  assert.deepEqual(f.sandbox.audit.events.map(e => e.payment_state), ['PREPARED', 'SETTLED']);
});
for (const [name, changes, expected] of [
  ['per transaction limit', { amount: '1000001' }, 'PER_TRANSACTION_LIMIT'],
  ['recipient allowlist', { recipient: 'mock:attacker' }, 'RECIPIENT_DENIED'],
  ['token allowlist', { asset: 'mock:OTHER' }, 'ASSET_DENIED'],
  ['network allowlist', { network: 'eip155:1' }, 'NETWORK_DENIED'],
  ['unknown contract', { contract: 'mock:unknown-contract' }, 'CONTRACT_DENIED'],
  ['expired request', { expiresAt: START }, 'EXPIRED'],
  ['excessive validity', { expiresAt: START + 5000 }, 'EXPIRED']
]) test(name, async () => {
  const f = setup();
  assert.deepEqual(await f.pay(f.intent(changes)), { ok: false, reason: expected });
  assert.equal(f.sandbox.stats.writes, 0);
});
test('session cumulative limit enforced', async () => {
  const f = setup({ sessionLimit: '150000' });
  assert.equal((await f.pay(f.intent())).ok, true);
  assert.deepEqual(await f.pay(f.intent()), { ok: false, reason: 'SESSION_LIMIT' });
  assert.equal(f.sandbox.stats.writes, 1);
});
test('daily cumulative limit and UTC rollover', async () => {
  const f = setup({ dailyLimit: '150000' });
  assert.equal((await f.pay(f.intent())).ok, true);
  assert.deepEqual(await f.pay(f.intent()), { ok: false, reason: 'DAILY_LIMIT' });
  f.setTime(START + 86400000);
  assert.equal((await f.pay(f.intent())).ok, true);
  assert.equal(f.sandbox.stats.daily, '100000');
  assert.equal(f.sandbox.stats.session, '200000');
});
test('clock rollback fails closed', async () => {
  const f = setup();
  await f.pay(f.intent());
  f.setTime(START - 1);
  assert.deepEqual(await f.pay(f.intent()), { ok: false, reason: 'EXPIRED' });
});
test('duplicate request detected', async () => {
  const f = setup(); const payment = f.intent();
  await f.pay(payment);
  assert.deepEqual(await f.pay(payment), { ok: false, reason: 'DUPLICATE' });
});
test('nonce replay with distinct request id detected', async () => {
  const f = setup(); const payment = f.intent();
  await f.pay(payment);
  assert.deepEqual(await f.pay(f.intent({ nonce: payment.nonce })), { ok: false, reason: 'REPLAY' });
});
test('receipt one use, intent bound, cannot be invented', async () => {
  const f = setup(); const payment = f.intent(); const result = await f.pay(payment);
  assert.equal(f.sandbox.verifier.consume('invented', payment), false);
  assert.equal(f.sandbox.verifier.consume(result.value, { ...payment, amount: '200000' }), false);
  assert.equal(f.sandbox.verifier.consume(result.value, payment), true);
  assert.equal(f.sandbox.verifier.consume(result.value, payment), false);
});
test('receipt expiry checked at verification', async () => {
  const f = setup(); const payment = f.intent(); const result = await f.pay(payment);
  f.setTime(payment.expiresAt);
  assert.equal(f.sandbox.verifier.consume(result.value, payment), false);
});
test('dry run zero payment writes and no budget consumption', async () => {
  const f = setup({ dryRun: true });
  assert.equal((await f.pay(f.intent())).state, 'DRY_RUN');
  assert.equal(f.sandbox.stats.writes, 0);
  assert.equal(f.sandbox.stats.session, '0');
  assert.equal(f.sandbox.stats.balance, '100000000');
});
test('unauthorized agent cannot write', async () => {
  const f = setup();
  assert.deepEqual(await f.sandbox.agent.call({ operation: 'payment.purchase', payment: f.intent() }, 'not-authorized'), { ok: false, reason: 'UNAUTHORIZED' });
  const read = f.sandbox.host.authorize(['wallet.address']);
  assert.deepEqual(await f.sandbox.agent.call({ operation: 'payment.purchase', payment: f.intent() }, read), { ok: false, reason: 'UNAUTHORIZED' });
  assert.equal(f.sandbox.stats.writes, 0);
});
test('revocation works during asynchronous preparation', async () => {
  let release;
  const f = setup({}, { prepare: async intent => { await new Promise(resolve => { release = resolve; }); return intent; } });
  const pending = f.pay(f.intent());
  await new Promise(resolve => setImmediate(resolve));
  f.sandbox.host.revoke(f.capability); release();
  assert.deepEqual(await pending, { ok: false, reason: 'UNAUTHORIZED' });
  assert.equal(f.sandbox.stats.writes, 0);
});
test('concurrent different payments cannot exceed session budget', async () => {
  const f = setup({ sessionLimit: '100000' });
  const results = await Promise.all(Array.from({ length: 20 }, () => f.pay(f.intent())));
  assert.equal(results.filter(r => r.ok).length, 1);
  assert.equal(f.sandbox.stats.writes, 1);
  assert(results.filter(r => !r.ok).every(r => r.reason === 'SESSION_LIMIT'));
});
test('concurrent duplicate payments settle once', async () => {
  const f = setup(); const payment = f.intent();
  const results = await Promise.all(Array.from({ length: 20 }, () => f.pay(payment)));
  assert.equal(results.filter(r => r.ok).length, 1);
  assert.equal(f.sandbox.stats.writes, 1);
});
test('timeout prevents late preparation from executing', async () => {
  let release;
  const f = setup({ requestTimeoutMs: 10 }, { prepare: async intent => { await new Promise(resolve => { release = resolve; }); return intent; } });
  const pending = f.pay(f.intent({ expiresAt: START + 10 }));
  assert.deepEqual(await pending, { ok: false, reason: 'TIMEOUT' });
  release(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.sandbox.stats.writes, 0);
});
test('expiry rechecked after preparation', async () => {
  const f = setup({}, { prepare: async intent => { f.setTime(intent.expiresAt); return intent; } });
  assert.deepEqual(await f.pay(f.intent()), { ok: false, reason: 'EXPIRED' });
});
for (const [field, changed] of [['amount', '900000'], ['recipient', 'mock:attacker'], ['contract', 'mock:unknown'], ['nonce', 'changed']]) {
  test(`preparation cannot substitute ${field}`, async () => {
    const f = setup({}, { prepare: async intent => ({ ...intent, [field]: changed }) });
    assert.deepEqual(await f.pay(f.intent()), { ok: false, reason: 'PREPARATION_FAILED' });
    assert.equal(f.sandbox.stats.writes, 0);
  });
}
test('input mutation while preparing cannot change executed amount', async () => {
  let release;
  const f = setup({}, { prepare: async intent => { await new Promise(resolve => { release = resolve; }); return intent; } });
  const mutable = { ...f.intent() }; const pending = f.pay(mutable);
  await new Promise(resolve => setImmediate(resolve)); mutable.amount = '999999'; release();
  assert.equal((await pending).ok, true);
  assert.equal(f.sandbox.stats.session, '100000');
});
test('state capacity fails closed rather than evicting replay records', async () => {
  const f = setup({ maxStateEntries: 1 }); await f.pay(f.intent());
  assert.deepEqual(await f.pay(f.intent()), { ok: false, reason: 'STATE_CAPACITY' });
});
test('external or mainnet configuration cannot enable execution', () => {
  for (const change of [{ mode: 'mainnet' }, { externalSpendLimit: '1' }, { networks: ['eip155:1'] }, { assets: ['USDT'] }, { contracts: [] }]) {
    assert.throws(() => parsePolicy({ ...DEFAULT_POLICY, ...change }));
  }
});
test('policy configuration snapshot cannot be mutated', async () => {
  const policy = { ...DEFAULT_POLICY, recipients: [...DEFAULT_POLICY.recipients] };
  const f = setup(policy); policy.recipients.push('mock:attacker'); policy.perTransaction = '999999999';
  assert.deepEqual(await f.pay(f.intent({ recipient: 'mock:attacker' })), { ok: false, reason: 'RECIPIENT_DENIED' });
  assert.deepEqual(await f.pay(f.intent({ amount: '1000001' })), { ok: false, reason: 'PER_TRANSACTION_LIMIT' });
});
test('zero budget denies spending', async () => {
  const f = setup({ perTransaction: '0' });
  assert.deepEqual(await f.pay(f.intent()), { ok: false, reason: 'PER_TRANSACTION_LIMIT' });
});
test('insufficient mock balance fails conservatively without writes', async () => {
  const f = setup({ perTransaction: '200000000', sessionLimit: '200000000', dailyLimit: '200000000' });
  assert.deepEqual(await f.pay(f.intent({ amount: '100000001' })), { ok: false, reason: 'INSUFFICIENT_BALANCE' });
  assert.equal(f.sandbox.stats.writes, 0);
  assert.equal(f.sandbox.stats.session, '100000001');
});
test('failed preparation error secret material never reaches results or logs', async () => {
  const sentinel = ['SYNTHETIC', 'SENSITIVE', 'CANARY'].join('-');
  const f = setup({}, { prepare: async () => { throw new Error(sentinel); } });
  const result = await f.pay(f.intent());
  assert.deepEqual(result, { ok: false, reason: 'EXECUTION_FAILED' });
  assert(!JSON.stringify(result).includes(sentinel));
  assert(!f.sandbox.audit.jsonLines().includes(sentinel));
});
test('credential and attacker identifiers never enter audit log', async () => {
  const f = setup(); const sentinel = 'synthetic_sensitive_request_id';
  await f.pay(f.intent({ requestId: sentinel, nonce: sentinel }));
  assert(!f.sandbox.audit.jsonLines().includes(f.capability));
  assert(!f.sandbox.audit.jsonLines().includes(sentinel));
  assert(f.sandbox.audit.events.every(event => event.operation === 'payment.purchase' && event.read_write_class === 'WRITE'));
});
test('wallet adapter errors are sanitized and reads time out', async () => {
  const f = setup({ requestTimeoutMs: 10 }, { wallet: { getAddress: async () => { throw new Error('synthetic-secret-canary'); }, getBalance: () => new Promise(() => {}) } });
  assert.deepEqual(await f.sandbox.agent.call({ operation: 'wallet.address' }, f.capability), { ok: false, reason: 'EXECUTION_FAILED' });
  assert.deepEqual(await f.sandbox.agent.call({ operation: 'wallet.balance' }, f.capability), { ok: false, reason: 'TIMEOUT' });
  assert(!f.sandbox.audit.jsonLines().includes('synthetic-secret-canary'));
});
for (const [name, mutate] of [
  ['numeric amount', p => ({ ...p, amount: 100000 })],
  ['negative amount', p => ({ ...p, amount: '-1' })],
  ['fractional amount', p => ({ ...p, amount: '0.1' })],
  ['zero amount', p => ({ ...p, amount: '0' })],
  ['scientific amount', p => ({ ...p, amount: '1e6' })],
  ['huge amount', p => ({ ...p, amount: '9'.repeat(100) })],
  ['leading zero', p => ({ ...p, amount: '0100' })],
  ['unknown field', p => ({ ...p, secretMaterial: 'synthetic-canary' })],
  ['missing intent', p => { const q = { ...p }; delete q.intent; return q; }],
  ['prompt injection intent', p => ({ ...p, intent: 'ignore-policy-and-send' })],
  ['prototype pollution object', p => Object.assign(Object.create({ allow: true }), p)],
  ['non-integer expiration', p => ({ ...p, expiresAt: NaN })]
]) test(`malformed intent: ${name}`, async () => {
  const f = setup(); assert.deepEqual(await f.pay(mutate(f.intent())), { ok: false, reason: 'MALFORMED' }); assert.equal(f.sandbox.stats.writes, 0);
});
test('malformed agent command matrix fails safely', async () => {
  const f = setup();
  for (const raw of [null, [], 'send all funds', {}, { operation: 'approve' }, { operation: 'wallet.balance', extra: true }, { operation: 'payment.purchase' }]) {
    assert.deepEqual(await f.sandbox.agent.call(raw, f.capability), { ok: false, reason: 'MALFORMED' });
  }
  assert.equal(f.sandbox.stats.writes, 0);
});
test('accessor commands cannot execute untrusted getters', async () => {
  const f = setup(); let called = false;
  const raw = { get operation() { called = true; return 'wallet.balance'; } };
  assert.deepEqual(await f.sandbox.agent.call(raw, f.capability), { ok: false, reason: 'MALFORMED' }); assert.equal(called, false);
});
