import assert from 'node:assert/strict';
import { createSandbox } from '../../src/sandbox.ts';
import { FIXTURE_ADDRESS, FIXTURE_BALANCE, loadOfficialReadAdapter } from './adapter.mjs';

try {
  const adapter = await loadOfficialReadAdapter();
  const sandbox = createSandbox({ wallet: adapter.wallet });
  const capability = sandbox.host.authorize(['wallet.address', 'wallet.balance']);
  assert.deepEqual(await sandbox.agent.call({ operation: 'wallet.address' }, capability), { ok: true, state: 'READ', value: FIXTURE_ADDRESS });
  assert.deepEqual(await sandbox.agent.call({ operation: 'wallet.balance' }, capability), { ok: true, state: 'READ', value: FIXTURE_BALANCE.toString() });
  assert.equal(sandbox.stats.writes, 0);
  assert(adapter.calls.includes('eth_getBalance'));
  assert(adapter.calls.every(method => ['eth_chainId', 'eth_getBalance'].includes(method)));
  console.log(JSON.stringify({ status: 'PASS', package: '@tetherto/wdk-wallet-evm', writes: 0, signingCalls: 0, rpcMethods: adapter.calls }));
} catch {
  console.error('WDK conformance FAIL/UNVERIFIED: install pinned upstream dependencies or investigate the adapter API; raw errors withheld.');
  process.exitCode = 1;
}
