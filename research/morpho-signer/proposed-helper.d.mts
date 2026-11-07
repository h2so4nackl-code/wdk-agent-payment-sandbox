// Public projection from tetherto/wdk-wallet-evm PR #133 at 9b150d3.
// Relative SigningAccount import rewritten to the installed WDK package.
import type { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
export function createX402Signer(account: SigningAccount): Promise<ClientSignerProjection>;
export type Hex = `0x${string}`;
export type SigningAccount = Pick<WalletAccountEvm, 'getAddress' | 'signTypedData'>;
export type ClientSigningInput = {
  domain: Record<string, unknown>;
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
};
export type ClientSignerProjection = {
  address: Hex;
  signTypedData: (input: ClientSigningInput) => Promise<Hex>;
};
