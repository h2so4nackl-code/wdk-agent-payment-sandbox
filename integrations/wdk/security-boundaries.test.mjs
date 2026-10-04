import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createWdkTestMode, testRequirement, validateRequirement } from './official.mjs';
import { localFacilitator } from './local-facilitator.mjs';
import { DEFAULT_POLICY } from '../../src/policy.ts';
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import { HDNodeWallet } from 'ethers';
const resource = 'http://127.0.0.1:4021/resource';
async function fixture(changes = {}, policy = {}) {
  const w = await createWdkTestMode({ mode: 'wdk-test', resource, policy: { ...DEFAULT_POLICY, ...policy } });
  return { w, cap: w.host.authorize(), requirement: testRequirement(resource, changes) };
}
test('Official WDK core and wallet address/balance reads via agent gateway', async () => {
  const f = await fixture();
  try {
    assert.match((await f.w.agent.call({ operation: 'wallet.address' }, f.cap)).value, /^0x[0-9a-fA-F]{40}$/);
    assert.equal((await f.w.agent.call({ operation: 'wallet.balance' }, f.cap)).value, '1234567');
    assert.equal(f.w.stats.testAuthorizations, 0);
  } finally { await f.w.dispose(); }
});
test('Official fetch/core/EVM HTTP 402, payload, verification, simulated settlement and resource release', async () => {
  const f = await fixture(); const server = localFacilitator(f.requirement);
  try {
    const result = await f.w.agent.purchase(f.cap, server.transport);
    assert.equal(result.ok, true);
    assert.deepEqual(await result.value.json(), { data: 'official local conformance resource' });
    assert.equal(f.w.stats.testAuthorizations, 1); assert.equal(server.stats.settlements, 1);
    assert.equal(server.stats.broadcasts, 0); assert.equal(f.w.stats.deniedRpcWrites, 0);
  } finally { await f.w.dispose(); }
});
for (const [label, changes, expected] of [
  ['transaction cap', { amount: '1000001' }, 'PER_TRANSACTION_LIMIT'],
  ['recipient outside allowlist', { payTo: '0x4444444444444444444444444444444444444444' }, 'RECIPIENT_DENIED'],
  ['unsupported network including mainnet', { network: 'eip155:1' }, 'NETWORK_DENIED'],
  ['unsupported token', { asset: '0x4444444444444444444444444444444444444444' }, 'ASSET_DENIED'],
  ['malformed amount', { amount: '-1' }, 'MALFORMED'],
  ['unknown contract domain', { extra: { name: 'InjectedToken', version: '1', assetTransferMethod: 'eip3009' } }, 'CONTRACT_DENIED'],
  ['Permit2 cannot trigger approval or transaction signing', { extra: { name: 'SandboxToken', version: '1', assetTransferMethod: 'permit2' } }, 'CONTRACT_DENIED']
]) test(`Official integration denies ${label} before signing`, async () => {
  const f = await fixture(changes); const server = localFacilitator(f.requirement);
  try {
    assert.equal((await f.w.agent.purchase(f.cap, server.transport)).reason, expected);
    assert.equal(f.w.stats.testAuthorizations, 0); assert.equal(f.w.stats.deniedRpcWrites, 0); assert.equal(server.stats.settlements, 0);
  } finally { await f.w.dispose(); }
});
test('Unauthorized direct write and raw WDK methods cannot bypass agent policy', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.w.agent.call({ operation: 'payment.purchase', payment: f.requirement }, 'invalid')).reason, 'UNAUTHORIZED');
    for (const operation of ['transfer', 'approve', 'sendTransaction', 'signTypedData', 'signTransaction']) {
      assert.equal((await f.w.agent.call({ operation }, f.cap)).ok, false);
      assert.equal(Object.hasOwn(f.w, operation), false);
    }
    assert.equal(f.w.stats.testAuthorizations, 0);
  } finally { await f.w.dispose(); }
});
test('Duplicate library retry denied without second signature or settlement', async () => {
  const f = await fixture(); const server = localFacilitator(f.requirement);
  try {
    assert.equal((await f.w.agent.purchase(f.cap, server.transport)).ok, true);
    assert.equal((await f.w.agent.purchase(f.cap, server.transport)).reason, 'DUPLICATE');
    assert.equal(f.w.stats.testAuthorizations, 1); assert.equal(server.stats.settlements, 1);
  } finally { await f.w.dispose(); }
});
test('Dry-run produces zero test signatures, RPC writes or simulated settlement', async () => {
  const f = await fixture({}, { dryRun: true }); const server = localFacilitator(f.requirement);
  try {
    assert.equal((await f.w.agent.purchase(f.cap, server.transport)).reason, 'DRY_RUN');
    assert.equal(f.w.stats.testAuthorizations, 0); assert.equal(f.w.stats.writes, 0); assert.equal(server.stats.settlements, 0);
  } finally { await f.w.dispose(); }
});
test('Explicit test mode required and no external URL accepted', async () => {
  for (const options of [{ resource }, { mode: 'mainnet', resource }, { mode: 'wdk-test', resource: 'https://example.com/resource' }]) {
    await assert.rejects(createWdkTestMode(options));
  }
});
test('Malformed requirements and getters rejected before library use', () => {
  for (const q of [null, {}, { ...testRequirement(resource), x402Version: 1 }, { ...testRequirement(resource), accepts: [] }, { ...testRequirement(resource), extensions: {} }]) {
    assert.throws(() => validateRequirement(q, resource));
  }
  let called = false;
  const q = testRequirement(resource); Object.defineProperty(q, 'accepts', { enumerable: true, get() { called = true; return []; } });
  assert.throws(() => validateRequirement(q, resource)); assert.equal(called, false);
});
test('Expired authorization rejected by official verifier', async () => {
  const f = await fixture();
  try {
    const prepared = await f.w.agent.call({ operation: 'payment.purchase', payment: f.requirement }, f.cap);
    assert.equal(prepared.ok, true);
    const payload = JSON.parse(prepared.value); payload.payload.authorization.validBefore = '1';
    assert.equal((await localFacilitator(f.requirement).verify(payload)).isValid, false);
  } finally { await f.w.dispose(); }
});
test('Verification failure cannot release resource or settle', async () => {
  const f = await fixture(); const server = localFacilitator(f.requirement, { rejectVerification: true });
  try {
    assert.equal((await f.w.agent.purchase(f.cap, server.transport)).reason, 'VERIFICATION_FAILED');
    assert.equal(server.stats.settlements, 0);
  } finally { await f.w.dispose(); }
});
test('Simulation failure cannot settle or release resource', async () => {
  const f = await fixture(); const server = localFacilitator(f.requirement, { failSimulation: true });
  try {
    assert.equal((await f.w.agent.purchase(f.cap, server.transport)).ok, false);
    assert.equal(server.stats.settlements, 0);
  } finally { await f.w.dispose(); }
});
test('Revocation and abort before official signing cause zero signatures', async () => {
  const f = await fixture(); const server = localFacilitator(f.requirement);
  try {
    f.w.host.revoke(f.cap);
    assert.equal((await f.w.agent.purchase(f.cap, server.transport)).reason, 'UNAUTHORIZED');
    assert.equal((await f.w.agent.call({ operation: 'payment.purchase', payment: f.requirement }, f.w.host.authorize(), AbortSignal.abort())).ok, false);
    assert.equal(f.w.stats.testAuthorizations, 0);
  } finally { await f.w.dispose(); }
});
test('Generated test wallet material absent from results, audit, errors and snapshots', async () => {
  const f = await fixture();
  try {
    const result = await f.w.agent.call({ operation: 'payment.purchase', payment: {} }, f.cap);
    const text = JSON.stringify({ result, audit: f.w.audit.events, stats: f.w.stats });
    const generated = createHash('sha512').update('WDK sandbox public deterministic test fixture v1').digest('hex');
    const derived = HDNodeWallet.fromSeed(`0x${generated}`).derivePath("m/44'/60'/0'/0/0");
    const address = await f.w.agent.call({ operation: 'wallet.address' }, f.cap);
    assert.equal(address.value, derived.address);
    assert.equal(text.includes(derived.privateKey), false);
    assert.equal(text.includes(generated), false);
    assert.equal(/privateKey|seedPhrase|mnemonic|_signer|_seed/.test(text), false);
    assert.equal(Object.hasOwn(f.w, 'account'), false);
  } finally { await f.w.dispose(); }
});
test('Upstream signing exception containing generated test material is sanitized from results and logs', async () => {
  const f = await fixture();
  const original = WalletAccountEvm.prototype.signTypedData;
  const generated = createHash('sha512').update('WDK sandbox public deterministic test fixture v1').digest('hex');
  const derived = HDNodeWallet.fromSeed(`0x${generated}`).derivePath("m/44'/60'/0'/0/0");
  const captured = []; const originalError = console.error; const originalLog = console.log;
  try {
    console.error = (...args) => captured.push(args.join(' ')); console.log = (...args) => captured.push(args.join(' '));
    WalletAccountEvm.prototype.signTypedData = async () => { throw new Error(`${generated}:${derived.privateKey}`); };
    const result = await f.w.agent.call({ operation: 'payment.purchase', payment: f.requirement }, f.cap);
    const text = JSON.stringify({ result, audit: f.w.audit.events, captured });
    assert.equal(result.ok, false); assert.equal(text.includes(generated), false);
    assert.equal(text.includes(derived.privateKey), false);
    assert.equal(f.w.stats.testAuthorizations, 0);
  } finally { WalletAccountEvm.prototype.signTypedData = original; console.error = originalError; console.log = originalLog; await f.w.dispose(); }
});
for (const [label, policy, reason] of [
  ['session', { sessionLimit: '250000' }, 'SESSION_LIMIT'],
  ['daily', { dailyLimit: '250000' }, 'DAILY_LIMIT']
]) test(`Official signer obeys cumulative ${label} budget`, async () => {
  const f = await fixture({}, policy);
  try {
    assert.equal((await f.w.agent.call({ operation: 'payment.purchase', payment: f.requirement }, f.cap)).ok, true);
    assert.equal((await f.w.agent.call({ operation: 'payment.purchase', payment: testRequirement(resource, { amount: '200000' }) }, f.cap)).reason, reason);
    assert.equal(f.w.stats.testAuthorizations, 1);
  } finally { await f.w.dispose(); }
});
test('Unpaid 200 response cannot masquerade as verified protected resource', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.w.agent.purchase(f.cap, async () => new Response('{}', { status: 200 }))).reason, 'VERIFICATION_FAILED');
    assert.equal(f.w.stats.testAuthorizations, 0);
  } finally { await f.w.dispose(); }
});
