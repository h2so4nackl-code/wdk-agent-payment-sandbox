import test from 'node:test';
import assert from 'node:assert/strict';
import { Wallet, Signature, verifyTypedData, TypedDataEncoder } from 'ethers';
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import { toClientEvmSigner } from '@x402/evm';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { signL1Action, createL1ActionHash } from '@nktkas/hyperliquid/signing';
import { mainnet } from 'viem/chains';
import { encodeBlueSignatureAuthorization, encodeErc20Permit2SignatureTransfer } from '@morpho-org/morpho-sdk';
import { getChainAddress } from '@morpho-org/morpho-ts';
import { getChainAddresses } from '@morpho-org/blue-sdk';
import { createEip712Signer } from './core.mts';
import { signingClient } from './viem-client.mts';
// Public deterministic unfunded keys. Restricted backend exercises only this path.
const key1 = new Wallet('0x'+'01'.repeat(32)), key2 = new Wallet('0x'+'02'.repeat(32));
const token = '0x1111111111111111111111111111111111111111';
const fields = [{name:'amount',type:'uint256'}];
function data(): any { return {domain:{name:'Fixture',version:'1',chainId:1,verifyingContract:token},types:{Payment:fields.map(f=>({...f}))},primaryType:'Payment',message:{amount:1n}}; }
const domainFields = [{name:'name',type:'string'},{name:'version',type:'string'},{name:'chainId',type:'uint256'},{name:'verifyingContract',type:'address'}];
async function fixture() {
  const state: any = {key:key1,calls:0};
  const backend = {
    async getAddress() { assert.equal(this,backend); await Promise.resolve(); if(state.addressError) throw state.addressError; return state.key.address; },
    async signTypedData(input: any) { assert.equal(this,backend); state.calls++; if(state.signError) throw state.signError; state.input=input; if(state.rotateDuringSign) state.key=key2; return state.key.signTypedData(input.domain,input.types,input.message); },
  };
  const account = new WalletAccountEvm(backend as any);
  assert.equal(account.address,undefined);
  const signer = await createEip712Signer(account);
  return {state,backend,account,signer};
}
function verify(input: any, signature: string) { return verifyTypedData(input.domain,input.types,input.message,signature); }

test('async WDK source yields frozen two-field projection',async()=>{
 const f=await fixture(); assert(Object.isFrozen(f.signer)); assert.deepEqual(Object.keys(f.signer).sort(),['address','signTypedData']); assert.equal(f.signer.address,key1.address); f.account.dispose();
});
test('absent and canonical EIP712Domain yield the same digest and signature',async()=>{
 const f=await fixture(), a=data(), b=data(); b.types.EIP712Domain=domainFields;
 const s1=await f.signer.signTypedData(a),s2=await f.signer.signTypedData(b);
 assert.equal(s1,s2);assert.equal(verify(a,s1),key1.address);assert.equal(f.state.input.types.EIP712Domain,undefined);f.account.dispose();
});
test('optional domain omissions and salt are normalized without dropping signed fields',async()=>{
 const f=await fixture(), d=data();d.domain={chainId:1,verifyingContract:token,salt:'0x'+'33'.repeat(32)};
 d.types.EIP712Domain=[{name:'chainId',type:'uint256'},{name:'verifyingContract',type:'address'},{name:'salt',type:'bytes32'}];
 const sig=await f.signer.signTypedData(d); assert.equal(verify(f.state.input,sig),key1.address); f.account.dispose();
});
const invalid = [
 ['conflicting primaryType',(d:any)=>{d.primaryType='Other';}],
 ['incorrect EIP712Domain layout',(d:any)=>{d.types.EIP712Domain=[{name:'chainId',type:'string'}];}],
 ['unknown domain key',(d:any)=>{d.domain.extra='bad';}],
 ['unsafe numeric chainId',(d:any)=>{d.domain.chainId=Number.MAX_SAFE_INTEGER+1;}],
 ['negative chainId',(d:any)=>{d.domain.chainId=-1;}],
 ['oversized chainId',(d:any)=>{d.domain.chainId=2n**256n;}],
 ['invalid salt',(d:any)=>{d.domain.salt='0x12';}],
 ['malformed type field',(d:any)=>{d.types.Payment=[{name:'amount',type:42}];}],
 ['non-struct message',(d:any)=>{d.message=[];}],
] as const;
for(const [name,mutate] of invalid) test(`reject ${name} before backend signing`,async()=>{const f=await fixture(),d=data();mutate(d);await assert.rejects(()=>f.signer.signTypedData(d));assert.equal(f.state.calls,0);f.account.dispose();});
test('detaches nested message and readonly types before async calls',async()=>{
 const f=await fixture(),d=data();d.types={Payment:[{name:'value',type:'Nested'}],Nested:[{name:'amount',type:'uint256'}]};d.message={value:{amount:1n}};
 const expected=structuredClone(d);Object.freeze(d.types.Payment[0]);Object.freeze(d.types.Payment);Object.freeze(d.types);
 const pending=f.signer.signTypedData(d);d.message.value.amount=2n;
 const sig=await pending;assert.equal(f.state.input.message.value.amount,1n);assert.equal(verify(expected,sig),key1.address);assert.notEqual(verify(d,sig),key1.address);f.account.dispose();
});
test('rotation before signing rejects and a fresh projection uses the new account',async()=>{
 const f=await fixture();f.state.key=key2;await assert.rejects(()=>f.signer.signTypedData(data()),/Account changed/);assert.equal(f.state.calls,0);
 const fresh=await createEip712Signer(f.account),d=data();assert.equal(verify(d,await fresh.signTypedData(d)),key2.address);f.account.dispose();
});
test('rotation during signing prevents returning a signature under the old snapshot',async()=>{
 const f=await fixture();f.state.rotateDuringSign=true;await assert.rejects(()=>f.signer.signTypedData(data()),/Account changed/);assert.equal(f.state.calls,1);f.account.dispose();
});
test('address lookup and signing errors preserve original error identity',async()=>{
 const error=new Error('fixture rejection');await assert.rejects(()=>createEip712Signer({async getAddress(){throw error;},async signTypedData(){throw error;}}),e=>e===error);
 const f=await fixture();f.state.addressError=error;await assert.rejects(()=>f.signer.signTypedData(data()),e=>e===error);delete f.state.addressError;
 f.state.signError=error;await assert.rejects(()=>f.signer.signTypedData(data()),e=>e===error);f.account.dispose();
});
test('malformed address and non-byte-hex signature are rejected',async()=>{
 await assert.rejects(()=>createEip712Signer({async getAddress(){return '0x12';},async signTypedData(){return '0x12';}}),/Invalid EVM address/);
 const p=await createEip712Signer({async getAddress(){return key1.address;},async signTypedData(){return '0xabc';}});await assert.rejects(()=>p.signTypedData(data()),/Invalid hex signature/);
});
test('official x402 exact client builds an EIP-3009 payload through the common core',async()=>{
 const f=await fixture();const scheme=new ExactEvmScheme(toClientEvmSigner(f.signer));
 const payload=await scheme.createPaymentPayload(2,{scheme:'exact',network:'eip155:31337',asset:token,amount:'1000000',payTo:key2.address,maxTimeoutSeconds:60,extra:{name:'FixtureToken',version:'1'}});
 const wire:any=payload.payload;assert.equal(verify(f.state.input,wire.signature),key1.address);
 assert.equal(wire.authorization.from.toLowerCase(),key1.address.toLowerCase());assert.equal(wire.authorization.value,'1000000');f.account.dispose();
});
test('community Hyperliquid SDK signs a standard testnet L1 action through the same core',async()=>{
 const f=await fixture();const action={type:'cancel',cancels:[{a:0,o:12345}]},nonce=1_800_000_000_000;
 const sig=await signL1Action({wallet:f.signer,action,nonce,isTestnet:true});
 assert.equal(verify(f.state.input,Signature.from(sig).serialized),key1.address);
 assert.equal(f.state.input.message.source,'b');assert.equal(f.state.input.message.connectionId,createL1ActionHash({action,nonce}));f.account.dispose();
});
test('Morpho Blue authorization and Permit2 requirement signing share the core via viem',async()=>{
 const f=await fixture(),client=signingClient(f.signer,mainnet),now=1_800_000_000n;
 const auth=await encodeBlueSignatureAuthorization(client,{owner:f.signer.address,authorized:getChainAddress(1,'bundles.blueBundlesV1'),chainId:1,nonce:0n,deadline:now+3600n,now});
 const permit=encodeErc20Permit2SignatureTransfer({token:getChainAddresses(1).usdc,spender:getChainAddress(1,'bundles.vaultBundlesV1'),amount:1_000_000n,chainId:1,nonce:42n,deadline:now+3600n,now});
 for(const req of [auth,permit]) {const signed=await req.sign(client,f.signer.address);assert.equal(verify(f.state.input,signed.args.signature),key1.address);}
 await assert.rejects(()=>client.account.signTransaction({to:key2.address,value:0n}),/outside this fixture/);f.account.dispose();
});
