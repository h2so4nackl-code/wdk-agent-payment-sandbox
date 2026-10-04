import test from 'node:test';
import assert from 'node:assert/strict';
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { WdkX402ClientSigner, isHexEvmAddress, isEoaSignature } from './wdk-x402-client-signer.ts';
import { testWallet } from './test-wallet.mjs';
import { localFacilitator } from './local-facilitator.mjs';
import { createWdkTestMode, testRequirement, TEST_RECIPIENT } from './official.mjs';

const RESOURCE = 'http://127.0.0.1:4021/resource';
const PAYER = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const NOW = 1800000000000;
const SIGNATURE = `0x${'ab'.repeat(64)}1b`;
function input() {
  return { domain: { name: 'SandboxToken', version: '1', chainId: 31337, verifyingContract: '0x1111111111111111111111111111111111111111' },
    types: { TransferWithAuthorization: [ { name: 'from', type: 'address' }, { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }, { name: 'validAfter', type: 'uint256' }, { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' } ] },
    primaryType: 'TransferWithAuthorization', message: { from: PAYER, to: TEST_RECIPIENT, value: 100000n,
      validAfter: 0n, validBefore: BigInt(NOW / 1000 + 30), nonce: `0x${'01'.repeat(32)}` } };
}
function fixture({ address = PAYER, signature = SIGNATURE, authorize = async () => {}, clock = () => NOW } = {}) {
  let writes = 0; let received;
  const account = { async getAddress() { return address; }, async signTypedData(data) { writes++; received = data; return signature; } };
  return { signer: new WdkX402ClientSigner(account, authorize, clock), writes: () => writes, received: () => received };
}
for (const [name, value, valid] of [
  ['lowercase', PAYER, true], ['mixed/checksum format', '0xAbCdEfabcdefABCDefabcdefABCDEFabcdefabcd', true],
  ['no prefix', PAYER.slice(2), false], ['short length', '0x1234', false], ['long length', `${PAYER}00`, false],
  ['non-hex', `0x${'z'.repeat(40)}`, false], ['empty', '', false]
]) test(`Adapter address guard: ${name}`, async () => {
  assert.equal(isHexEvmAddress(value), valid);
  const f = fixture({ address: value });
  if (valid) assert.equal((await f.signer.initialize()).address, value);
  else await assert.rejects(f.signer.initialize(), { message: 'PREPARATION_FAILED' });
  assert.equal(f.writes(), 0);
});
test('Adapter constructor contract requires initialization and defaults to denied signing', async () => {
  const f = fixture();
  assert.throws(() => f.signer.address, { message: 'PREPARATION_FAILED' });
  const denied = await new WdkX402ClientSigner({ getAddress: async () => PAYER, signTypedData: async () => { throw new Error('must not sign'); } }, undefined, () => NOW).initialize();
  await assert.rejects(denied.signTypedData(input()), { message: 'UNAUTHORIZED' });
  for (const name of ['signTransaction', 'sendTransaction', 'readContract', 'getTransactionCount', 'estimateFeesPerGas', 'account']) assert.equal(name in denied, false);
});
test('Adapter explicit conversion preserves semantics and strips primaryType only for WDK', async () => {
  let authorized;
  const f = fixture({ authorize: async data => { authorized = data; assert.equal(Object.isFrozen(data.message), true); assert.equal(Object.isFrozen(data.types.TransferWithAuthorization), true); } });
  await f.signer.initialize();
  assert.equal(await f.signer.signTypedData(input()), SIGNATURE);
  assert.equal(f.writes(), 1);
  assert.deepEqual(f.received(), { domain: authorized.domain, types: authorized.types, message: authorized.message });
  assert.equal(Object.hasOwn(f.received(), 'primaryType'), false);
  assert.equal(isEoaSignature(SIGNATURE), true);
});
for (const [name, mutate] of [
  ['mainnet', d => { d.domain.chainId = 1; }], ['asset substitution', d => { d.domain.verifyingContract = PAYER; }],
  ['recipient substitution', d => { d.message.to = PAYER; }], ['payer substitution', d => { d.message.from = TEST_RECIPIENT; }],
  ['primary type', d => { d.primaryType = 'Permit'; }], ['field schema', d => { d.types.TransferWithAuthorization[2].type = 'string'; }],
  ['string amount', d => { d.message.value = '100000'; }], ['uint256 overflow', d => { d.message.value = 2n ** 256n; }],
  ['negative amount', d => { d.message.value = -1n; }], ['expired authorization', d => { d.message.validBefore = 1n; }],
  ['unbounded expiration', d => { d.message.validBefore += 1n; }], ['invalid nonce', d => { d.message.nonce = '0x00'; }],
  ['accessor field', d => { Object.defineProperty(d.message, 'to', { get() { throw new Error('never invoked'); } }); }],
  ['accessor schema', d => { Object.defineProperty(d.types.TransferWithAuthorization, '0', { get() { throw new Error('never invoked'); } }); }],
  ['unexpected data', d => { d.message.extra = true; }]
]) test(`Adapter fail closed before policy/signing: ${name}`, async () => {
  let gates = 0; const f = fixture({ authorize: async () => { gates++; } }); await f.signer.initialize();
  const data = input(); mutate(data);
  await assert.rejects(f.signer.signTypedData(data)); assert.equal(gates, 0); assert.equal(f.writes(), 0);
});
for (const [name, signature] of [ ['missing prefix', SIGNATURE.slice(2)], ['invalid hex', `0x${'zz'.repeat(65)}`],
  ['short signature', '0x12'], ['compact signature', `0x${'ab'.repeat(64)}`], ['invalid recovery byte', `0x${'ab'.repeat(64)}ff`] ]) {
  test(`Adapter rejects malformed WDK signature: ${name}`, async () => {
    const f = fixture({ signature }); await f.signer.initialize();
    await assert.rejects(f.signer.signTypedData(input()), { message: 'PREPARATION_FAILED' });
    assert.equal(f.writes(), 1); assert.equal(isEoaSignature(signature), false);
    await assert.rejects(f.signer.signTypedData(input()), { message: 'REPLAY' }); assert.equal(f.writes(), 1);
  });
}
test('Adapter rejects concurrent invocation, replay and expiry after asynchronous authorization', async () => {
  let release; const pending = new Promise(resolve => { release = resolve; });
  const f = fixture({ authorize: async () => pending }); await f.signer.initialize();
  const first = f.signer.signTypedData(input());
  await assert.rejects(f.signer.signTypedData(input()), { message: 'DUPLICATE' }); release(); await first;
  await assert.rejects(f.signer.signTypedData(input()), { message: 'REPLAY' }); assert.equal(f.writes(), 1);
  let time = NOW;
  const late = fixture({ clock: () => time, authorize: async () => { time += 31000; } }); await late.signer.initialize();
  await assert.rejects(late.signer.signTypedData(input()), { message: 'EXPIRED' }); assert.equal(late.writes(), 0);
});
test('Adapter sanitizes secret-bearing address, authorization and WDK exceptions', async () => {
  // Synthetic marker is generated, never a real credential or a printed exception.
  const marker = Buffer.from('synthetic adapter exception fixture').toString('hex');
  for (const operation of ['address', 'policy', 'sign']) {
    const account = { async getAddress() { if (operation === 'address') throw new Error(marker); return PAYER; },
      async signTypedData() { throw new Error(marker); } };
    const signer = new WdkX402ClientSigner(account, async () => { if (operation === 'policy') throw new Error(marker); }, () => NOW);
    let caught;
    try { await signer.initialize(); await signer.signTypedData(input()); } catch (error) { caught = error; }
    assert.ok(caught instanceof Error); assert.equal(String(caught).includes(marker), false); assert.equal(caught.stack.includes(marker), false);
  }
});
test('Explicit adapter with actual WDK account signs official EIP-3009 and passes cryptographic verification', async () => {
  const wallet = await testWallet(); let gates = 0;
  try {
    const signer = await new WdkX402ClientSigner(wallet.account, async () => { gates++; }).initialize();
    const requirement = testRequirement(RESOURCE);
    const partial = await new ExactEvmScheme(signer).createPaymentPayload(2, requirement.accepts[0]);
    assert.equal((await localFacilitator(requirement).verify({ ...partial, accepted: requirement.accepts[0] })).isValid, true);
    assert.equal(gates, 1); assert.equal(wallet.stats().broadcasts, 0); assert.equal(wallet.stats().deniedRpcWrites, 0);
  } finally { await wallet.dispose(); }
});
for (const operation of ['address', 'signature']) test(`Agent policy facade fails closed for malformed WDK ${operation}`, async () => {
  const method = operation === 'address' ? 'getAddress' : 'signTypedData';
  const original = WalletAccountEvm.prototype[method];
  WalletAccountEvm.prototype[method] = async () => 'invalid';
  let fixture;
  try {
    fixture = await createWdkTestMode({ mode: 'wdk-test', resource: RESOURCE });
    const result = await fixture.agent.call({ operation: 'payment.purchase', payment: testRequirement(RESOURCE) }, fixture.host.authorize());
    assert.equal(result.ok, false); assert.equal(fixture.stats.testAuthorizations, 0); assert.equal(fixture.stats.broadcasts, 0);
  } finally { WalletAccountEvm.prototype[method] = original; await fixture?.dispose(); }
});
