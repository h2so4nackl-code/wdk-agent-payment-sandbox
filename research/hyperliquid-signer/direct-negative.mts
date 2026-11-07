import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import type { AbstractViemLocalAccount } from '@nktkas/hyperliquid/signing';
export function direct(account: WalletAccountEvm): AbstractViemLocalAccount {
  return account;
}
