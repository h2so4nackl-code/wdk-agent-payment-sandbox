import type { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import type { ClientEvmSigner } from '@x402/evm';
import { WdkX402ClientSigner } from './wdk-x402-client-signer.ts';
export function supportedCompatibility(account: WalletAccountEvm): ClientEvmSigner {
  const signer: ClientEvmSigner = new WdkX402ClientSigner(account);
  return signer;
}
