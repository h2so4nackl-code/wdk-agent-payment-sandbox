import { createWalletClient, custom } from 'viem';
import type { Chain } from 'viem';
import { toAccount } from 'viem/accounts';
import type { Eip712Signer } from './core.mts';

/** Fixture-only signing client. No message/transaction signing or RPC capability. */
export function signingClient(projection: Eip712Signer, chain: Chain) {
  const local = toAccount({
    address: projection.address,
    async signTypedData(input) {
      const message: unknown = input.message;
      if (typeof input.primaryType !== 'string' || message === null ||
          typeof message !== 'object' || Array.isArray(message)) throw new TypeError('Expected a named message struct');
      return projection.signTypedData({
        domain: input.domain ?? {}, types: Object.fromEntries(Object.entries(input.types ?? {})),
        primaryType: input.primaryType, message: Object.fromEntries(Object.entries(message)),
      });
    },
    async signMessage() { throw new Error('Message signing is outside this fixture'); },
    async signTransaction() { throw new Error('Transaction signing is outside this fixture'); },
  });
  return createWalletClient({
    account: local,
    chain,
    transport: custom({ async request() { throw new Error('RPC is disabled in this offline fixture'); } }),
  });
}
