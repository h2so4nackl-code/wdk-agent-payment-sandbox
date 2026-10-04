import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptReadOnlyAccount, FIXTURE_ADDRESS, FIXTURE_BALANCE } from '../integrations/wdk/adapter.mjs';
import { createSandbox } from '../src/sandbox.ts';

// This checks our adapter contract, not the absent installed upstream package. Separate test:wdk must verify that.
class ContractFixtureReadAccount {
  constructor(address, config) { this.address = address; this.provider = config.provider; }
  async getAddress() { return this.address; }
  async getBalance() { return BigInt(await this.provider.request({ method: 'eth_getBalance' })); }
}
test('WDK-shaped read adapter contract fixture, no signer exposed', async () => {
  const adapter = adaptReadOnlyAccount(ContractFixtureReadAccount);
  const sandbox = createSandbox({ wallet: adapter.wallet }); const cap = sandbox.host.authorize(['wallet.address', 'wallet.balance']);
  assert.equal((await sandbox.agent.call({ operation: 'wallet.address' }, cap)).value, FIXTURE_ADDRESS);
  assert.equal((await sandbox.agent.call({ operation: 'wallet.balance' }, cap)).value, FIXTURE_BALANCE.toString());
  assert.deepEqual(Object.keys(adapter.wallet), ['getAddress', 'getBalance']);
  assert.deepEqual(adapter.calls, ['eth_getBalance']); assert.equal(sandbox.stats.writes, 0);
});
test('WDK adapter rejects incompatible account API', () => {
  assert.throws(() => adaptReadOnlyAccount(class {}), /contract mismatch/);
});
