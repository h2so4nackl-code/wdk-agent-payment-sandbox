import assert from 'node:assert/strict';
import { createWalletClient, custom, getTypesForEIP712Domain } from 'viem';
import type { Chain } from 'viem';
import { toAccount } from 'viem/accounts';
import type { ClientSignerProjection } from './proposed-helper.mjs';

/** Fixture-only signing client. No message/transaction signing or RPC capability. */
export function signingClient(projection: ClientSignerProjection, chain: Chain, normalize = true) {
  const local = toAccount({
    address: projection.address,
    async signTypedData(input) {
      const domain = input.domain ?? {};
      const types = Object.fromEntries(Object.entries(input.types ?? {}));
      const { EIP712Domain, ...messageTypes } = types;
      const message: unknown = input.message;
      if (typeof input.primaryType !== 'string' || message === null ||
          typeof message !== 'object' || Array.isArray(message)) {
        throw new TypeError('Expected a named message struct');
      }
      if (normalize && EIP712Domain !== undefined) {
        assert.deepEqual(EIP712Domain, getTypesForEIP712Domain({ domain }));
      }
      return projection.signTypedData({
        domain,
        types: normalize ? messageTypes : types,
        primaryType: input.primaryType,
        message: Object.fromEntries(Object.entries(message)),
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
