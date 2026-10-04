// Official EVM verification over a simulated local contract. No RPC transport or real settlement.
import { ExactEvmScheme } from '@x402/evm/exact/facilitator';
import { Interface } from 'ethers';
import { decodePaymentSignatureHeader, encodePaymentRequiredHeader, encodePaymentResponseHeader } from '@x402/core/http';
import { TEST_ASSET, TEST_NETWORK } from './official.mjs';
export function localFacilitator(requirement, options = {}) {
  let simulations = 0; let settlements = 0; let verified = 0; let lastTransfer;
  const used = new Set();
  const abi = new Interface(['event Transfer(address indexed from,address indexed to,uint256 value)']);
  const signer = {
    getAddresses: () => ['0x3333333333333333333333333333333333333333'],
    getCode: async ({ address }) => address.toLowerCase() === TEST_ASSET ? '0x6000' : '0x',
    async readContract({ address, functionName, args }) {
      if (address.toLowerCase() !== TEST_ASSET || functionName !== 'transferWithAuthorization') throw new Error('TEST_CONTRACT_DENIED');
      simulations++;
      if (options.failSimulation || used.has(args[5])) throw new Error('TEST_SIMULATION_FAILED');
      return undefined;
    },
    async writeContract({ address, functionName, args }) {
      if (address.toLowerCase() !== TEST_ASSET || functionName !== 'transferWithAuthorization' || used.has(args[5])) throw new Error('TEST_SETTLEMENT_DENIED');
      used.add(args[5]); settlements++; lastTransfer = args;
      return `0x${'a'.repeat(64)}`;
    },
    async waitForTransactionReceipt() {
      const event = abi.encodeEventLog(abi.getEvent('Transfer'), lastTransfer.slice(0, 3));
      return { status: 'success', logs: [{ address: TEST_ASSET, topics: event.topics, data: event.data }] };
    },
    sendTransaction: async () => { throw new Error('TEST_BROADCAST_DENIED'); }
  };
  const scheme = new ExactEvmScheme(signer);
  async function verify(payload) {
    if (options.rejectVerification) return { isValid: false, invalidReason: 'TEST_VERIFICATION_REJECTED' };
    const result = await scheme.verify(payload, requirement.accepts[0]);
    if (result.isValid) verified++;
    return result;
  }
  return {
    verify,
    settle: payload => scheme.settle(payload, requirement.accepts[0]),
    async transport(request) {
      const header = request.headers.get('payment-signature');
      if (!header) return new Response('{}', { status: 402, headers: { 'payment-required': encodePaymentRequiredHeader(requirement) } });
      try {
        const payload = decodePaymentSignatureHeader(header);
        const valid = await verify(payload);
        if (!valid.isValid) return new Response('{}', { status: 403 });
        const result = await scheme.settle(payload, requirement.accepts[0]);
        if (!result.success) return new Response('{}', { status: 403 });
        return new Response(JSON.stringify({ data: 'official local conformance resource' }), {
          status: 200, headers: { 'payment-response': encodePaymentResponseHeader(result) }
        });
      } catch { return new Response('{}', { status: 400 }); }
    },
    get stats() { return { simulations, settlements, verified, broadcasts: 0, network: TEST_NETWORK }; }
  };
}
