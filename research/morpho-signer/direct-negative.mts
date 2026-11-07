import type { WalletClient } from 'viem';
import { toAccount } from 'viem/accounts';
import type { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import type { ClientSignerProjection } from './proposed-helper.mjs';
export function direct(account: WalletAccountEvm): WalletClient {
  return account;
}
export function projectionOnly(projection: ClientSignerProjection) {
  return toAccount(projection);
}
