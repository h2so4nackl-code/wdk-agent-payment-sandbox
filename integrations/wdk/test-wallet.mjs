// Test-only factory. Never use this generated public fixture material for funds.
import { createHash } from 'node:crypto';
import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
export async function testWallet() {
  let deniedRpcWrites = 0;
  const provider = Object.freeze({ async request({ method }) {
    if (method === 'eth_chainId') return '0x7a69';
    if (method === 'eth_getBalance') return '0x12d687';
    deniedRpcWrites++;
    throw new Error('TEST_RPC_METHOD_DENIED');
  } });
  const material = new Uint8Array(createHash('sha512').update('WDK sandbox public deterministic test fixture v1').digest());
  try {
    const wdk = new WDK(material).registerWallet('local-test', WalletManagerEvm, { provider, chainId: 31337 });
    const account = await wdk.getAccount('local-test');
    return { account, dispose: async () => { try { await wdk.dispose(); } finally { material.fill(0); } }, stats: () => ({ deniedRpcWrites, broadcasts: 0 }) };
  } catch { material.fill(0); throw new Error('WDK_TEST_INITIALIZATION_FAILED'); }
}
