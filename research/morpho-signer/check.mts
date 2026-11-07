import assert from 'node:assert/strict';
import { Wallet, verifyTypedData as ethersVerify } from 'ethers';
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import { createWalletClient, custom, verifyTypedData } from 'viem';
import { mainnet, base } from 'viem/chains';
import { encodeBlueSignatureAuthorization, encodeErc20Permit2SignatureTransfer } from '@morpho-org/morpho-sdk';
import { getChainAddress } from '@morpho-org/morpho-ts';
import { getChainAddresses } from '@morpho-org/blue-sdk';
import { createX402Signer } from './proposed-helper.mjs';
import { signingClient } from './adapter.mts';

// Public deterministic, unfunded test key. No private user data, provider or broadcast.
const key = new Wallet('0x' + '01'.repeat(32));
let signingCalls = 0;
let captured: any;
const backend = {
  async getAddress() { await Promise.resolve(); return key.address; },
  async signTypedData({domain, types, message}: any) {
    assert.equal(this, backend);
    signingCalls++;
    captured = {domain, types, message};
    return key.signTypedData(domain, types, message);
  },
};
// JS runtime fixture: only getAddress/signTypedData are used. Not a complete ISignerEvm.
// @ts-expect-error Deliberately restricted async backend, not a production signer.
const wdk = new WalletAccountEvm(backend);
assert.equal(wdk.address, undefined);
const p = await createX402Signer(wdk);
const client = signingClient(p, mainnet);
const rawClient = signingClient(p, mainnet, false);
const owner = p.address;
const other = '0x2222222222222222222222222222222222222222' as const;
const now = 1_800_000_000n;
const auth = await encodeBlueSignatureAuthorization(client, {
  owner, authorized: getChainAddress(1, 'bundles.blueBundlesV1'), chainId: 1,
  nonce: 0n, now, deadline: now + 3600n,
});
const permit = encodeErc20Permit2SignatureTransfer({
  token: getChainAddresses(1).usdc, spender: getChainAddress(1, 'bundles.vaultBundlesV1'),
  amount: 1_000_000n, chainId: 1, nonce: 42n, now, deadline: now + 3600n,
});
let groups = 0;
const pass = (name: string) => { groups++; console.log(`PASS ${groups}: ${name}`); };

// Demonstrate that the x402 projection is not itself a Morpho WalletClient.
// @ts-expect-error Intentional negative runtime boundary.
await assert.rejects(() => auth.sign(p, owner), {name:'MissingClientPropertyError'});
pass('bare projection is not a WalletClient; Morpho rejects its missing account');
await assert.rejects(() => auth.sign(rawClient, owner), /ambiguous primary types/);
assert.equal(signingCalls, 0);
pass('original helper inside viem fails on injected EIP712Domain before backend signing');

for (const [name, requirement] of [['Morpho Blue Authorization', auth], ['Permit2 SignatureTransfer', permit]] as const) {
  const signed = await requirement.sign(client, owner);
  const td = requirement.action.typedData!;
  assert.equal(await verifyTypedData({...td, address:owner, signature:signed.args.signature}), true);
  assert.equal(ethersVerify(captured.domain, captured.types, captured.message, signed.args.signature), key.address);
  assert.equal(captured.types.EIP712Domain, undefined);
  assert(Object.isFrozen(signed));
  pass(`${name}: real SDK requirement.sign -> viem -> projection -> WDK -> verified signature`);
}
const permitSigned = await permit.sign(client, owner);
const permitTd = permit.action.typedData!;
const changed = structuredClone(permitTd);
// Fixture uses PermitTransferFrom with nested permitted.amount.
(changed.message as any).permitted.amount = 1_000_001n;
assert.equal(await verifyTypedData({...changed, address:owner, signature:permitSigned.args.signature}), false);
pass('changing Permit2 amount invalidates the signature');
const callsBeforeGuard = signingCalls;
await assert.rejects(() => auth.sign(client, other), {name:'AddressMismatchError'});
await assert.rejects(() => permit.sign(client, other), {name:'AddressMismatchError'});
assert.equal(signingCalls, callsBeforeGuard);
pass('wrong owner/account rejected before backend signing');
await assert.rejects(() => auth.sign(signingClient(p, base), owner), {name:'ChainIdMismatchError'});
assert.equal(signingCalls, callsBeforeGuard);
pass('wrong declared chain rejected before backend signing');
const bad = signingClient({ ...p, async signTypedData(input) {
  const signature = await new Wallet('0x'+'02'.repeat(32)).signTypedData(input.domain, input.types as any, input.message);
  return signature as `0x${string}`;
}}, mainnet);
await assert.rejects(() => auth.sign(bad, owner), {name:'InvalidSignatureError'});
pass('signature from another key rejected by Morpho verification');
const noAccount = createWalletClient({chain:mainnet,transport:custom({async request(){throw Error('RPC disabled');}})});
await assert.rejects(() => auth.sign(noAccount, owner), {name:'MissingClientPropertyError'});
pass('missing client account rejected');
await assert.rejects(() => client.signMessage({message:'fixture'}), /outside this fixture/);
await assert.rejects(() => client.account.signTransaction({to:other,value:0n}), /outside this fixture/);
pass('message and transaction signing stay disabled');
assert.equal(groups, 10);
console.log('RESULT: PASS; 10 offline runtime groups; no RPC, deployment, broadcast or real funds.');
wdk.dispose();
