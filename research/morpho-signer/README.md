# WDK -> viem -> Morpho: offline signer interoperability evidence

This fixture exercises the published Morpho SDK's real `Requirement.sign(client, userAddress)` API with a real WDK `WalletAccountEvm` backed by an asynchronous ethers test signer. It is an independent use case for the core address + EIP-712 signing projection discussed in [Tether WDK PR #133](https://github.com/tetherto/wdk-wallet-evm/pull/133#issuecomment-6709461267).

It is not a Morpho bug report, a production adapter, or proof that an upstream wallet helper is required. The WDK Morpho module already documents signing through a viem WalletClient and an EIP-1193 provider. This fixture investigates an alternative local signing client backed by the WDK account itself, without such a provider or key export from WDK.

## Reproduce

Use Node 24; executed on Node 24.22.1, Linux x86_64:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

Installation downloads packages. The test itself uses a transport that rejects RPC requests. Nothing is deployed or broadcast, and no real funds or private user keys are used. Public deterministic test keys must never be funded.

Direct dependencies are pinned in `package.json` and the complete dependency graph is retained in `package-lock.json`: WDK EVM 1.0.0-beta.25, Morpho SDK 9.3.0, viem 2.55.10, ethers 6.15.0, TypeScript 5.9.3.

## Executed compiler checks

- `consumer.mts`, including `adapter.mts`, compiles under `--strict --skipLibCheck`, NodeNext, ES2023. The signing-client adapter has no type casts. This does not claim all JavaScript in WDK is strict-clean.
- The separately compiled negative fixture must produce TS2740 for account-as-WalletClient and TS2345 for projection-as-viem-AccountSource. The original two-field projection lacks viem's required `signMessage` and `signTransaction` source methods; it is not a complete WalletClient.
- The original projection declaration is transcribed in `proposed-helper.d.mts` with its relative WDK import rewritten to the installed package. Declaration generation was not rerun.

## Ten executed runtime groups

1. A bare projection is rejected by Morpho because it has no `client.account`.
2. Wrapping the original helper in viem without normalization fails on injected `EIP712Domain`, before the async WDK backend signs.
3. A real `encodeBlueSignatureAuthorization(...).sign(...)` succeeds through the normalized client. Morpho's verifier, viem and an independent ethers recovery agree on the signer.
4. A real `encodeErc20Permit2SignatureTransfer(...).sign(...)` succeeds through the same client, with the same verification checks.
5. Changing the Permit2 amount invalidates the produced signature.
6. Wrong expected owner/account is rejected before backend signing.
7. A declared chain mismatch is rejected before backend signing.
8. A signature produced by another key is rejected by Morpho's verifier.
9. A missing client account is rejected.
10. Message signing and transaction signing remain disabled in this restricted fixture.

The runner preserves its executed output in `RESULTS.log` and input hashes in `SHA256SUMS.json`. A negative compile is an expected reproduction, not a passing direct integration.

## What is reused, and what is additional

`proposed-helper.mjs` preserves the original PR #133 runtime helper. Its core async address resolution, bound signing, readonly-field conversion, primary-type checks and hex result validation are reused. It cannot be passed directly to Morpho or reused inside viem unchanged.

`adapter.mts` adds viem `toAccount` / `createWalletClient` framing. It checks that the injected EIP712Domain fields equal viem's derivation from the payload domain, removes that declaration before ethers primary-type inference, and keeps the original primary-type validation. It rejects unsupported message/transaction signing and all RPC requests. This is a scoped interoperability fixture, not a reviewed generic EIP-712 normalization design.

The test backend intentionally implements only the async address/signTypedData methods this path uses. It is not a complete production ISignerEvm or a hardware wallet. Test-only `any` and expected-error annotations in `check.mts` do not occur in the cast-free adapter/consumer check.

## Primary sources

- [WDK Morpho module quick start](https://github.com/morpho-org/sdks/blob/4be8c002c8beb99d18f37fe2c9f3d361cf0b76d0/packages/wdk-protocol-lending-morpho-evm/README.md): requirement signing through a WalletClient.
- [Morpho sign-and-verify helper](https://github.com/morpho-org/sdks/blob/4be8c002c8beb99d18f37fe2c9f3d361cf0b76d0/packages/morpho-sdk/src/helpers/signAndVerifyTypedData.ts).
- [Blue signature authorization](https://github.com/morpho-org/sdks/blob/4be8c002c8beb99d18f37fe2c9f3d361cf0b76d0/packages/morpho-sdk/src/actions/requirements/encode/encodeBlueSignatureAuthorization.ts).
- [Permit2 SignatureTransfer requirement](https://github.com/morpho-org/sdks/blob/4be8c002c8beb99d18f37fe2c9f3d361cf0b76d0/packages/morpho-sdk/src/actions/requirements/encode/encodeErc20Permit2SignatureTransfer.ts).
- [Original WDK PR helper](https://github.com/h2so4nackl-code/wdk-wallet-evm/blob/9b150d3d2de13f6e9127f65c2e00bee547d393db/src/x402-signer.js): copied with its Apache-2.0 copyright notice intact. It is not a released WDK export.

## Scope limits

Only the signing requirement path is qualified here. The chain-1 deployment addresses come from the pinned SDK registry, not a live deployment check; nonces, deadline and amounts are deterministic fixtures. No token approvals, nonce availability, allowance state, provider chain, fork, token balances, market positions, hardware, account rotation, ERC-1271/4337 semantics, supply/borrow/repay submission or transaction acceptance were validated.

No independent public user request for this helper is established, and no maintainer endorsement or full protocol compatibility is implied. Morpho is a second concrete consumer of the projection's core functionality, with a viem-specific wrapper still required.
