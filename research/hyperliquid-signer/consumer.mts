import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import type { AbstractViemLocalAccount } from '@nktkas/hyperliquid/signing';
import { createX402Signer } from './proposed-helper.mjs';
// No casts; the adjacent declaration reproduces the PR's public projection.
export async function projected(account: WalletAccountEvm): Promise<AbstractViemLocalAccount> {
  return await createX402Signer(account);
}
