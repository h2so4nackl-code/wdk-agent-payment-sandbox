import assert from 'node:assert/strict';
import { Wallet, Signature, verifyTypedData } from 'ethers';
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import { getWalletAddress, signUserSignedAction, signL1Action } from '@nktkas/hyperliquid/signing';
import { createX402Signer } from './proposed-helper.mjs';

// Public deterministic fixture, no RPC or broadcast.
const key = new Wallet('0x' + '01'.repeat(32));
let captured;
const backend = {
  async getAddress() { await Promise.resolve(); return key.address; },
  async signTypedData({ domain, types, message }) {
    assert.equal(this, backend);
    captured = { domain, types, message };
    return key.signTypedData(domain, types, message);
  },
};
const account = new WalletAccountEvm(backend);
assert.equal(account.address, undefined);
const data = {
  domain: { name: 'HyperliquidSignTransaction', version: '1', chainId: 1337, verifyingContract: '0x' + '00'.repeat(20) },
  types: { Agent: [{ name: 'source', type: 'string' }, { name: 'connectionId', type: 'bytes32' }] },
  primaryType: 'Agent',
  message: { source: 'b', connectionId: '0x' + '11'.repeat(32) },
};
await assert.rejects(() => getWalletAddress(account), /unknown wallet type/);
console.log('PASS: direct async WDK account rejected by Hyperliquid wallet dispatcher');
const original = await createX402Signer(account);
assert.equal(await getWalletAddress(original), key.address.toLowerCase());
const sign = wallet => signUserSignedAction({ wallet, action: { ...data.message, signatureChainId: '0x539' }, types: data.types });
await assert.rejects(() => sign(original), e => {
  return /ambiguous primary types/.test(String(e.cause));
});
console.log('PASS: original helper gets address but fails signing when Hyperliquid adds EIP712Domain');

// Experimental boundary adaptation only; does not modify the PR or installed SDK.
const normalized = {
  address: original.address,
  async signTypedData(input) {
    const { EIP712Domain, ...types } = input.types;
    // Fixture-only normalization of the exact domain injected by this SDK.
    // A production generic helper needs reviewed normalization rules.
    assert.deepEqual(EIP712Domain, [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ]);
    return original.signTypedData({ ...input, types });
  },
};
const parts = await sign(normalized);
const signature = Signature.from(parts).serialized;
assert.equal(verifyTypedData(data.domain, data.types, data.message, signature), key.address);
assert.notEqual(verifyTypedData(data.domain, data.types, { ...data.message, source: 'a' }, signature), key.address);
assert.equal(captured.types.EIP712Domain, undefined);
console.log('PASS: adapted helper signs a synthetic EIP-712 fixture via real WDK account; recovered address matches');
console.log('PASS: changing the signed message fails signer verification');
const l1 = await signL1Action({ wallet: normalized, action: { type: 'cancel', cancels: [{ a: 0, o: 12345 }] }, nonce: 1_800_000_000_000, isTestnet: true });
assert.equal(verifyTypedData(captured.domain, captured.types, captured.message, Signature.from(l1).serialized), key.address);
assert.equal(captured.message.source, 'b');
console.log('PASS: standard Hyperliquid testnet L1 cancel action signs and verifies offline');
console.log('All five offline checks passed; no network calls, transaction broadcasts, or real funds.');
account.dispose();
