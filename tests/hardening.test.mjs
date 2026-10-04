import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox } from '../src/sandbox.ts';
import { makeIntent, PaymentClient } from '../src/x402.ts';
import { AuditLog } from '../src/audit.ts';
import { startResourceServer } from '../src/server.mjs';

test('caller abort before preparation denies zero writes', async () => {
  const sandbox = createSandbox(); const cap = sandbox.host.authorize(); const controller = new AbortController(); controller.abort();
  assert.deepEqual(await sandbox.agent.call({ operation: 'payment.purchase', payment: makeIntent('http://127.0.0.1:1/resource') }, cap, controller.signal), { ok: false, reason: 'TIMEOUT' });
  assert.equal(sandbox.stats.writes, 0);
});
test('HTTP cancellation propagates during preparation and cannot later settle', async () => {
  let release;
  const sandbox = createSandbox({ prepare: async intent => { await new Promise(resolve => { release = resolve; }); return intent; } });
  const cap = sandbox.host.authorize(); const server = await startResourceServer(sandbox);
  try {
    const result = await new PaymentClient(sandbox.agent, cap, server.resource, 100).purchase();
    assert.deepEqual(result, { ok: false, reason: 'TIMEOUT' });
    assert.equal(typeof release, 'function'); release(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(sandbox.stats.writes, 0);
  } finally { await server.close(); }
});
test('audit projection discards unexpected fields and masks secret-like identifiers', () => {
  const log = new AuditLog(); const canary = 'SYNTHETIC_SECRET_LOG_CANARY';
  const event = { timestamp: '2026-10-03T12:00:00.000Z', request_id: crypto.randomUUID(), operation: 'payment.purchase', read_write_class: 'WRITE',
    network: canary, asset: canary, amount: '100', recipient: canary, policy_result: 'DENY', policy_reason: 'MALFORMED', payment_state: 'REJECTED', verification_state: 'FAILED',
    privateKey: canary, seedPhrase: canary, rawError: canary };
  log.append(event);
  assert(!log.jsonLines().includes(canary));
  assert(!log.jsonLines().includes('privateKey'));
  assert.equal(log.events[0].amount, '100');
  assert.equal(log.events[0].policy_reason, 'MALFORMED');
  assert.throws(() => log.append({ ...event, policy_reason: canary }));
  assert.throws(() => log.append({ ...event, amount: canary }));
  assert.throws(() => log.append({ ...event, request_id: canary }));
});
test('audit ring bounded and observer snapshot cannot mutate stored evidence', () => {
  const log = new AuditLog(1);
  const event = { timestamp: '2026-10-03T12:00:00.000Z', request_id: crypto.randomUUID(), operation: 'wallet.balance', read_write_class: 'READ',
    network: 'untrusted', asset: 'untrusted', amount: '0', recipient: 'untrusted', policy_result: 'ALLOW', policy_reason: 'ALLOWED', payment_state: 'READ', verification_state: 'NOT_REQUESTED' };
  log.append(event); log.append({ ...event, request_id: crypto.randomUUID() });
  assert.equal(log.events.length, 1); const snapshot = log.events; snapshot[0].amount = '900'; assert.equal(log.events[0].amount, '0');
});
