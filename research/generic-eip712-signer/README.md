# Experimental shared WDK EIP-712 signer projection

One async `createEip712Signer(account)` core is exercised by the real published x402, community Hyperliquid, and Morpho SDKs. This is a reviewable sandbox experiment, not a replacement PR, released wallet export, audited signing module or maintainer-approved API.

## Reproduce

Executed with Node 24.22.1 on Linux x86_64:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

The runner compiles the core, viem wrapper and all three consumer interfaces under strict TypeScript, then executes 20 Node tests. `RESULTS.log` retains output and `SHA256SUMS.json` identifies tested inputs. Installation downloads dependencies; the runtime tests use deterministic public unfunded keys, no RPC provider or blockchain broadcasts.

Pinned direct dependencies: WDK EVM beta.25, x402 EVM 2.28.0, community Hyperliquid SDK 0.33.3, Morpho SDK 9.3.0, viem 2.55.10, ethers 6.15.0 and TypeScript 5.9.3. The lockfile pins transitive dependencies.

## Interface and paths

```ts
const signer = await createEip712Signer(wdkAccount);
// signer.address: resolved address snapshot
// signer.signTypedData({ domain, types, primaryType, message })
```

| Consumer | Exercised path |
| --- | --- |
| x402 | `toClientEvmSigner` -> official `ExactEvmScheme.createPaymentPayload` -> EIP-3009 signature, recovered with ethers |
| Community Hyperliquid SDK | `signL1Action` -> standard testnet cancel action -> hash and signature verification, never submitted |
| Morpho via viem | `requirement.sign` for Blue authorization and Permit2 SignatureTransfer -> local viem signing client -> common core -> WDK -> SDK verification and ethers recovery |

`viem-client.mts` adds `toAccount` and `createWalletClient`; it contains no separate domain normalization. Message signing, transaction signing and RPC are disabled. It is a restricted signing client, not a general wallet or RPC provider.

## Behavior covered by the 20 tests

- Async address resolution through a real WDK WalletAccountEvm backed by an async test backend; the method receiver is preserved.
- A frozen two-field projection, with the address snapshotted at creation.
- Identical digest/signature for absent versus canonical explicit EIP712Domain, including domain subsets and salt.
- Explicit rejection of conflicting primaryType, mismatched domain declaration, unknown domain fields, unsafe/negative/oversized chain IDs, invalid salt, malformed typed fields and non-struct messages, before signing.
- A detached nested message and copied readonly types before any await, so caller mutation cannot change the request while the address resolves.
- Address changes detected before and after signing; a fresh projection works after rotation. A post-sign check cannot undo an operation already performed by the backend; it prevents returning that signature under the old snapshot.
- Address lookup and signing rejection preserve the original error object; malformed address/signature formatting is rejected.
- Actual SDK consumer signing paths listed above.

Test-only backends implement only the address and typed-signing methods used here. Test-only casts do not establish full ISignerEvm or hardware support. `consumer.mts` connects a typed WDK account to the real SDK interfaces without consumer casts. Compilation uses `--skipLibCheck`; it does not qualify every dependency's source or declaration.

## Normalization contract

The core accepts the standard name, version, chainId, verifyingContract and salt domain fields. Addresses are validated with ethers; chain IDs must fit uint256 and numeric values must be safe integers. It copies typed fields, validates an explicit EIP712Domain against the canonical populated domain field list, removes only that validated declaration for ethers root-type inference, and checks the supplied primaryType against ethers' result.

This intentionally supports one strict, canonical EIP-712 domain representation. It does not promise every wallet's custom extension, noncanonical ordering or EIP712Domain-as-primaryType support. Signature output validation checks byte-hex formatting, not authorization, cryptographic validity or snapshot ownership; the integration tests verify their resulting EOA signatures separately. Address-before/after checks cannot detect a dishonest signer that reports one address but uses another key, nor an ABA rotation between checks.

This experiment changes rotation behavior relative to the original PR's documented snapshot: it rejects a detected address change and requires recreation. Whether that belongs in a wallet helper is an API design question for maintainers. Repeated getAddress calls and structuredClone may have runtime/backend compatibility costs; Bare, browsers, Windows and hardware are not qualified here.

## Evidence and scope

- [Original closed WDK PR #133](https://github.com/tetherto/wdk-wallet-evm/pull/133).
- [Separate Hyperliquid reproduction, including failure of the original helper unchanged](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/tree/7af109ea988ef2220743ebc2a44896a9bc7c73ff/research/hyperliquid-signer).
- [Separate Morpho reproduction, including original-helper and interface negative controls](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/tree/0fe2dc16be9d2398fd6e6fdb06426e5601af8a2b/research/morpho-signer).

The code is derived in part from the PR's Apache-2.0 helper; its copyright/license notice is retained in core.mts. It does not modify the PR branch, WDK, viem or any consumer SDK.

No existing public user request for this common helper is established. No live payment, token approval, nonce/allowance check, lending transaction, deployed contract acceptance, smart-account/1271/4337 behavior or full protocol qualification is claimed. Morpho already documents a WalletClient plus EIP-1193-provider signing route; this is an alternative local signing bridge, not a claim that Morpho is broken without this helper.
