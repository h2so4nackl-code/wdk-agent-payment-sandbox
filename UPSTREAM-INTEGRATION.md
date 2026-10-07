# Upstream integration — verified 2026-10-04

Public registry metadata fetched this run through PowerShell HTTPS; Node/npm outbound TLS reports EACCES. No system networking or execution-policy changes. Exact public metadata, signing keys, repository activity, release/tag objects and archive integrity inventory are preserved in evidence/integration/. All six installed versions match the table below, verified from package manifests and the preserved lock; 59 local runtime conformance tests pass. [Installed inventory](evidence/public/installed-inventory.json), [final command evidence](evidence/public/technical-summary.json).

## Official package provenance

| Package | Resolved registry version | Repository | License | Runtime declaration | Source |
|---|---|---|---|---|---|
| @tetherto/wdk | 1.0.0-beta.18 (beta) | tetherto/wdk | Apache-2.0 | No engines field | [npm metadata](https://registry.npmjs.org/@tetherto%2fwdk/latest) |
| @tetherto/wdk-wallet-evm | 1.0.0-beta.20 (beta) | tetherto/wdk-wallet-evm | Apache-2.0 | devEngines Node >=22.13.0; not a published engines field | [npm metadata](https://registry.npmjs.org/@tetherto%2fwdk-wallet-evm/latest) |
| @x402/core | 2.28.0 | x402-foundation/x402 | Apache-2.0 | No engines field | [npm metadata](https://registry.npmjs.org/@x402%2fcore/latest) |
| @x402/evm | 2.28.0 | x402-foundation/x402 | Apache-2.0 | No engines field | [npm metadata](https://registry.npmjs.org/@x402%2fevm/latest) |
| @x402/fetch | 2.28.0 | x402-foundation/x402 | Apache-2.0 | No engines field | [npm metadata](https://registry.npmjs.org/@x402%2ffetch/latest) |
| @x402/express | 2.28.0 | x402-foundation/x402 | Apache-2.0 | No engines field; Express peer dependency | [npm metadata](https://registry.npmjs.org/@x402%2fexpress/latest) |

Missing engines does not establish support for every Node version. This project measures Node 24.16.0 only. The registry x402 manifests contain numeric versions without prerelease suffixes; this is not evidence of Tether production endorsement. [Package metadata ](evidence/public/registry/) and [Tether's x402 guide](https://docs.wdk.tether.io/ai/x402/).

WDK core release v1.0.0-beta.18: 2026-09-14T08:09:38Z, commit a112c38a9a2bdcf4525961812a712591d1470118. EVM release v1.0.0-beta.20: 2026-09-30T14:17:51Z, commit 078babc46a22726a1fb1236e8c6a665ff48acaed. Both tag references resolve directly to commits. [Core release](https://github.com/tetherto/wdk/releases/tag/v1.0.0-beta.18), [EVM release](https://github.com/tetherto/wdk-wallet-evm/releases/tag/v1.0.0-beta.20), [recorded API evidence](evidence/public/releases.json). GitHub latest-release endpoint for x402 returns 404; latest release tag is UNVERIFIED rather than inferred from npm versions.

All six package repository identities and registry ECDSA signatures verify against public registry keys; SHA512 archive integrity is checked before caching. Attestation URLs are advertised, but SLSA provenance chains were not independently verified. No install/preinstall/postinstall scripts exist in these six recorded manifests. Transitive/native hooks are handled separately with all lifecycle execution disabled. [Supply-chain results](evidence/public/supply-chain.json), [public key source](https://registry.npmjs.org/-/npm/v1/keys), [acquisition code](scripts/acquire-upstream.mjs).

## API ownership and boundary

Tether official code: WDK constructor/registerWallet/getAccount/dispose; WalletManagerEvm, WalletAccountEvm address/getAddress/getBalance/signTypedData; BrowserProvider-compatible EIP-1193 fixture. [Pinned core source](https://github.com/tetherto/wdk/tree/a112c38a9a2bdcf4525961812a712591d1470118), [pinned EVM source](https://github.com/tetherto/wdk-wallet-evm/tree/078babc46a22726a1fb1236e8c6a665ff48acaed).

x402 Foundation reference code: x402Client, wrapFetchWithPayment, registerExactEvmScheme, official HTTP codecs and ExactEvmScheme facilitator verification/settlement abstraction. Sources are the exact installed 2.28.0 archives and [official repository](https://github.com/x402-foundation/x402), not a community wallet/facilitator wrapper.

Our code: explicit test mode, fixed local-chain fixture, secret-free agent facade, strict requirement/domain/type validation, existing PolicyEngine budget/replay/capability gate, audit projection, simulated contract/settlement and adversarial tests. [Implementation](integrations/wdk/official.mjs), [test provider](integrations/wdk/test-wallet.mjs), [simulation](integrations/wdk/local-facilitator.mjs).

The upstream WDK core already contains registerPolicy/governed account support; the project does not claim a novel general wallet policy framework. Its contribution is the bounded security conformance harness and reproducible failure cases. [Pinned core source](https://github.com/tetherto/wdk/blob/a112c38a9a2bdcf4525961812a712591d1470118/src/wdk.js).

The Tether guide claims direct ClientEvmSigner compatibility. Runtime preparation/verification PASS; uncast TypeScript assignment FAIL (TS2322, address string versus 0x template type). X402-CONFORMANCE.md records the mismatch; documentation alone is not a PASS. [Tether claim](https://docs.wdk.tether.io/ai/x402/), [direct assignment fixture](integrations/wdk/signer-compatibility.ts).

No community facilitator is installed or contacted. Tether explicitly disclaims endorsement/audit/responsibility for community modules and third-party facilitators. [Official guide](https://docs.wdk.tether.io/ai/x402/).

## Upstream issue and proposed solution — checked 2026-10-07

[Issue #132](https://github.com/tetherto/wdk-wallet-evm/issues/132), submitted on 2026-10-04, is open and reports the published direct strict TypeScript incompatibility. [PR #133](https://github.com/tetherto/wdk-wallet-evm/pull/133), opened on 2026-10-05, is open and unmerged; it proposes an async `createX402Signer(account)` helper for `main`, used with `toClientEvmSigner(await createX402Signer(account))`. This is a proposed upstream change, not a released fix or maintainer acceptance. The pinned published `1.0.0-beta.20` package remains incompatible with direct assignment to `ClientEvmSigner` from `@x402/evm` 2.28.0. No dependency, sandbox adapter or frozen evidence was updated for this status correction. The provenance and runtime results above retain their 2026-10-04 verification date.

## Supported project adapter (2026-10-04)

Exact installed declarations were inspected member by member in WDK-X402-TYPE-GAP.md. Our WdkX402ClientSigner explicitly implements the required ClientEvmSigner surface using composition, validated address/signature guards and reconstructed EIP-3009 input. The normal project typecheck and positive adapter contract pass. No optional transaction/approval functionality is exposed. The direct raw account fixture still fails TS2322 with unchanged packages/locks; separate runtime crypto verification still passes. Current results: the accepted technical evidence in evidence/public/technical-summary.json. This is a project boundary, not an upstream patch.
