import type { WalletClient } from 'viem';
import { mainnet } from 'viem/chains';
import type { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import { encodeBlueSignatureAuthorization } from '@morpho-org/morpho-sdk';
import { getChainAddress } from '@morpho-org/morpho-ts';
import { createX402Signer } from './proposed-helper.mjs';
import { signingClient } from './adapter.mts';
export async function integrate(account: WalletAccountEvm) {
  const projection = await createX402Signer(account);
  const client: WalletClient = signingClient(projection, mainnet);
  const now = 1_800_000_000n;
  const requirement = await encodeBlueSignatureAuthorization(client, {
    owner: projection.address, authorized: getChainAddress(1, 'bundles.blueBundlesV1'),
    chainId: 1, nonce: 0n, now, deadline: now + 3600n,
  });
  return requirement.sign(client, projection.address);
}
