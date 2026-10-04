// Deliberately no cast: measures the published declarations against the official signer contract.
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import type { ClientEvmSigner } from '@x402/evm';
export function directCompatibility(account: WalletAccountEvm): ClientEvmSigner {
  return account;
}
