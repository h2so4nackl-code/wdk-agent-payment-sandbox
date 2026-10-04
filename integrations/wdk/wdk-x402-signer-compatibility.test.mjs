import test from 'node:test';
import assert from 'node:assert/strict';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { localFacilitator } from './local-facilitator.mjs';
import { testRequirement } from './official.mjs';
import { testWallet } from './test-wallet.mjs';
test('WalletAccountEvm direct runtime ClientEvmSigner: official payment preparation and ECDSA verification', async () => {
  const fixture = await testWallet();
  try {
    const requirement = testRequirement('http://127.0.0.1:4021/resource');
    const partial = await new ExactEvmScheme(fixture.account).createPaymentPayload(2, requirement.accepts[0]);
    const payload = { ...partial, accepted: requirement.accepts[0] };
    const verification = await localFacilitator(requirement).verify(payload);
    assert.equal(verification.isValid, true);
    assert.equal(partial.payload.authorization.from, fixture.account.address);
    assert.equal(partial.payload.authorization.value, '100000');
    assert.equal(fixture.stats().broadcasts, 0);
    assert.equal(fixture.stats().deniedRpcWrites, 0);
  } finally { await fixture.dispose(); }
});
