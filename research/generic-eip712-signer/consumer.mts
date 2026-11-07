import type { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import { toClientEvmSigner } from '@x402/evm';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import type { AbstractViemLocalAccount } from '@nktkas/hyperliquid/signing';
import type { WalletClient } from 'viem';
import { mainnet } from 'viem/chains';
import { encodeBlueSignatureAuthorization } from '@morpho-org/morpho-sdk';
import { getChainAddress } from '@morpho-org/morpho-ts';
import { createEip712Signer } from './core.mts';
import { signingClient } from './viem-client.mts';
export async function integrations(account: WalletAccountEvm) {
  const signer = await createEip712Signer(account);
  const x402 = new ExactEvmScheme(toClientEvmSigner(signer));
  const hyperliquid: AbstractViemLocalAccount = signer;
  const viemClient: WalletClient = signingClient(signer, mainnet);
  const now = 1_800_000_000n;
  const requirement = await encodeBlueSignatureAuthorization(viemClient, {owner:signer.address,authorized:getChainAddress(1,'bundles.blueBundlesV1'),chainId:1,nonce:0n,now,deadline:now+3600n});
  return {x402,hyperliquid,viemClient,requirement};
}
