export const FIXTURE_ADDRESS = '0x1111111111111111111111111111111111111111';
export const FIXTURE_BALANCE = 1234567n;

export function readOnlyFixtureProvider() {
  const calls = [];
  return Object.freeze({
    calls,
    provider: Object.freeze({
      async request({ method }) {
        calls.push(method);
        if (method === 'eth_chainId') return '0x7a69';
        if (method === 'eth_getBalance') return `0x${FIXTURE_BALANCE.toString(16)}`;
        throw new Error('Unsupported fixture RPC method');
      }
    })
  });
}

// Accept only the upstream read-only constructor. No seed/private key input, signer, URL, or env loader.
export function adaptReadOnlyAccount(ReadOnlyAccount) {
  const fixture = readOnlyFixtureProvider();
  const account = new ReadOnlyAccount(FIXTURE_ADDRESS, { provider: fixture.provider });
  if (typeof account.getAddress !== 'function' || typeof account.getBalance !== 'function') throw new Error('WDK read contract mismatch');
  const wallet = Object.freeze({
    getAddress: () => account.getAddress(),
    getBalance: () => account.getBalance()
  });
  return Object.freeze({ wallet, calls: fixture.calls });
}

export async function loadOfficialReadAdapter() {
  const module = await import('@tetherto/wdk-wallet-evm');
  if (typeof module.WalletAccountReadOnlyEvm !== 'function') throw new Error('WDK read export missing');
  return adaptReadOnlyAccount(module.WalletAccountReadOnlyEvm);
}
