# Upstream issue reproduction and status

## Current upstream status — checked 2026-10-07

[Issue #132](https://github.com/tetherto/wdk-wallet-evm/issues/132) was submitted on 2026-10-04 and is open. [PR #133](https://github.com/tetherto/wdk-wallet-evm/pull/133), opened on 2026-10-05, is open and unmerged. It proposes an async `createX402Signer(account)` projection for `main`, used through `toClientEvmSigner(await createX402Signer(account))`. This is a proposed change, not a released fix or maintainer acceptance; the published `1.0.0-beta.20` package still fails direct strict TypeScript assignment with `@x402/evm` 2.28.0.

The filename is retained for existing links. The reproduction below records the original draft environment; the pre-submission search is historical, not current issue status. Frozen diagnostics, fixtures and search evidence remain unchanged.

## Title
WalletAccountEvm direct x402 ClientEvmSigner assignment fails with published TypeScript declarations

## Environment

- Node 24.16.0; npm 11.13.0; TypeScript 5.9.3; strict TypeScript; NodeNext.
- @tetherto/wdk 1.0.0-beta.18.
- @tetherto/wdk-wallet-evm 1.0.0-beta.20.
- @x402/evm 2.28.0 (core/fetch/express also 2.28.0).
- Reproduced locally on Windows; Linux/macOS not executed.

## Historical pre-submission issue search — 2026-10-04

Read-only searches repeated immediately before release-draft finalization on 2026-10-04 covered open and closed relevant WDK/core/wallet/docs issues and PRs. No exact installed-version declaration report was found before #132 was submitted. Related [documentation PR #280](https://github.com/tetherto/wdk-docs/pull/280) was open at that check and clarifies example versions beta.19/x402 2.26.0; inspected body/diff do not fix or report the beta.20/2.28.0 structural mismatch reproduced here. We do not infer behavior of that older example pair. The guide read at that check still described direct usage without that version qualification; source/deployed docs may differ. Results: evidence/public/issue-search-release.json and related-docs-pr.json. This is a bounded historical search, not proof no differently worded report exists or a claim that the issue remains unsubmitted. No maintainer acknowledgment is claimed.

## Documentation context

The [Tether x402 guide](https://docs.wdk.tether.io/ai/x402/) describes WalletAccountEvm as directly usable with ClientEvmSigner. The example is JavaScript; the measured runtime behavior succeeds, while direct structural TypeScript assignment fails with the versions above.

## Minimal reproduction

Install the exact versions above and TypeScript 5.9.3. Save this as an ES-module TypeScript file in the installed dependency directory:

```ts
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import type { ClientEvmSigner } from '@x402/evm';
export function directCompatibility(account: WalletAccountEvm): ClientEvmSigner {
  return account;
}
```

Compile with: tsc --noEmit --strict --skipLibCheck --module NodeNext --moduleResolution NodeNext --target ES2023 upstream-direct-signer-compatibility.ts.

## Actual diagnostic

```text
error TS2322: Type 'WalletAccountEvm' is not assignable to type 'ClientEvmSigner'.
  Types of property 'address' are incompatible.
    Type 'string' is not assignable to type '`0x${string}`'.
```

Compiler exit: 2. The sandbox retains the unmodified direct fixture, raw diagnostic and hashes separately from its passing project typecheck.

## Expected behavior

Either direct strict TypeScript usage compiles for the documented supported interface/profile, or documentation identifies the need for a validated compatibility boundary and the supported method subset.

## Runtime observation

The unchanged WDK account successfully creates an official x402 exact EIP-3009 payload using generated test-only material. Official x402 cryptographic verification succeeds for chain 31337 and a simulated token. No transaction is broadcast and no real funds or credentials are used. The separate direct-runtime test is preserved.

## Likely cause and cautious resolution suggestion

Published declaration shapes differ: address and typed signature return are broad strings; typed-data definitions differ in width; the optional raw transaction-signing method also has different required fields and gas naming. It may be helpful to examine whether narrower validated EVM output declarations, a dedicated upstream signer projection, or explicit documentation of a typed adapter best represents supported usage. We have not established compatibility for optional approval/transaction extensions. This is an integration/type discrepancy, not a security vulnerability allegation. Our project uses a small validated composition adapter; it does not modify upstream declarations or claim to fix Tether itself.
