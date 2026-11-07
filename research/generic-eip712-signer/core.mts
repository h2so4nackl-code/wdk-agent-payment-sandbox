// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { getAddress, TypedDataEncoder } from 'ethers';
import type { TypedDataDomain, TypedDataField } from 'ethers';

export type Hex = `0x${string}`;
export interface SigningAccount {
  getAddress(): Promise<string>;
  signTypedData(input: { domain: TypedDataDomain; types: Record<string, TypedDataField[]>; message: Record<string, unknown> }): Promise<string>;
}
export interface SigningInput {
  domain: Record<string, unknown>;
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
}
export interface Eip712Signer {
  readonly address: Hex;
  signTypedData(input: SigningInput): Promise<Hex>;
}
function address(value: unknown): Hex {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(value)) throw new TypeError('Invalid EVM address');
  return getAddress(value) as Hex;
}
function normalize(input: SigningInput) {
  const domain: TypedDataDomain = {};
  for (const [key, value] of Object.entries(input.domain)) {
    if (value == null) continue;
    switch (key) {
      case 'name': case 'version':
        if (typeof value !== 'string') throw new TypeError('Invalid domain string');
        domain[key] = value;
        break;
      case 'verifyingContract': domain.verifyingContract = address(value); break;
      case 'chainId': {
        if (!['string', 'number', 'bigint'].includes(typeof value)) throw new TypeError('Invalid chainId');
        if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new TypeError('Unsafe chainId');
        if (typeof value === 'string' && !/^(?:[0-9]+|0x[0-9a-fA-F]+)$/.test(value)) throw new TypeError('Invalid chainId');
        const id = BigInt(value as string | number | bigint);
        if (id < 0n || id >= 2n ** 256n) throw new TypeError('Invalid chainId range');
        domain.chainId = id;
        break;
      }
      case 'salt':
        if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value)) throw new TypeError('Invalid salt');
        domain.salt = value;
        break;
      default: throw new TypeError('Unsupported domain field');
    }
  }
  const types: Record<string, TypedDataField[]> = Object.create(null);
  for (const [name, value] of Object.entries(input.types)) {
    if (!Array.isArray(value)) throw new TypeError('Invalid type fields');
    types[name] = value.map((field: unknown) => {
      if (field === null || typeof field !== 'object' || !('name' in field) || !('type' in field) ||
          typeof field.name !== 'string' || typeof field.type !== 'string') throw new TypeError('Invalid typed-data field');
      return { name: field.name, type: field.type };
    });
  }
  const declaredDomain = types.EIP712Domain;
  if (declaredDomain !== undefined) {
    const definitions = [['name', 'string'], ['version', 'string'], ['chainId', 'uint256'], ['verifyingContract', 'address'], ['salt', 'bytes32']];
    const expected = definitions.filter(([name]) => domain[name as keyof TypedDataDomain] != null).map(([name,type]) => ({name,type}));
    if (JSON.stringify(declaredDomain) !== JSON.stringify(expected)) throw new TypeError('EIP712Domain declaration mismatch');
    delete types.EIP712Domain;
  }
  TypedDataEncoder.hashDomain(domain);
  if (TypedDataEncoder.getPrimaryType(types) !== input.primaryType) throw new TypeError('Typed data primaryType mismatch');
  if (input.message === null || typeof input.message !== 'object' || Array.isArray(input.message)) throw new TypeError('Expected message struct');
  // Detach the message before any await: caller mutation must not change what is signed.
  return { domain, types, message: structuredClone(input.message) };
}
/** Experimental, Node-tested EIP-712 projection. Recreate it after account rotation. */
export async function createEip712Signer(account: SigningAccount): Promise<Eip712Signer> {
  const snapshot = address(await account.getAddress());
  async function checkAccount() {
    if (address(await account.getAddress()).toLowerCase() !== snapshot.toLowerCase()) throw new Error('Account changed; recreate signer projection');
  }
  return Object.freeze({
    address: snapshot,
    async signTypedData(input: SigningInput): Promise<Hex> {
      const mapped = normalize(input);
      await checkAccount();
      const signature = await account.signTypedData(mapped);
      await checkAccount();
      if (typeof signature !== 'string' || !/^0x(?:[0-9a-fA-F]{2})+$/.test(signature)) throw new TypeError('Invalid hex signature');
      return signature as Hex;
    },
  });
}
