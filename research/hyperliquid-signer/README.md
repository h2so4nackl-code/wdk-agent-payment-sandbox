# WDK async signer projection: independent Hyperliquid SDK reproduction

This is a local, offline interoperability reproduction, not a proposed production adapter.
It supplies a concrete consumer outside x402 for the address + typed-data-signing projection discussed in [wdk-wallet-evm #133](https://github.com/tetherto/wdk-wallet-evm/pull/133#issuecomment-6708749527).
The original PR remains closed. No upstream approval or user demand is claimed.

## Reproduce

Use Node 24 (executed on Node 24.22.1, Linux x86_64):

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

Installation downloads dependencies. The test uses no RPC, HTTP requests, blockchain broadcasts, real funds or private user keys. The deterministic key is a public fixture and must never be funded.
Dependencies are pinned with a committed lockfile:

| Package | Version |
| --- | --- |
| @tetherto/wdk-wallet-evm | 1.0.0-beta.25 |
| @nktkas/hyperliquid | 0.33.3 |
| ethers | 6.15.0 |
| typescript | 5.9.3 |

## Executed results

`RESULTS.log` records the executed output; `SHA256SUMS.json` identifies the input files. The runner regenerates both after a successful run.

1. A consumer of the PR's public signer-projection type compiles in strict TypeScript, without consumer casts. `proposed-helper.d.mts` transcribes the public projection declaration, rewriting its relative WDK account import to the installed package; it does not claim declaration generation was rerun.
2. Direct assignment of a WDK account to Hyperliquid's `AbstractViemLocalAccount` produces the expected TS2322 diagnostic (including readonly typed-data fields). The negative fixture is compiled separately and must fail for the runner to pass.
3. A real `WalletAccountEvm` constructed with an async test signing backend has `address === undefined`; Hyperliquid rejects it directly as an unknown wallet type. This tests the async boundary with an ethers-backed fixture, not hardware.
4. The unmodified PR helper resolves the address, but Hyperliquid signing fails: Hyperliquid adds `EIP712Domain` alongside the message type, while the helper passes all types into ethers' `TypedDataEncoder.getPrimaryType`.
5. A fixture-only wrapper checks the exact domain declaration injected by Hyperliquid and removes it before forwarding to the original helper. The resulting synthetic EIP-712 signature recovers the expected address, and an altered message does not.
6. The same wrapper signs a standard Hyperliquid testnet L1 cancel action through `signL1Action`; the signature verifies offline. The action is never submitted.

The runner labels two compiler checks and five runtime check groups. These are bounded interoperability assertions, not a full SDK or protocol test suite.

## Source provenance

- `proposed-helper.mjs`: runtime helper copied from `src/x402-signer.js` at [WDK PR head 9b150d3d2de13f6e9127f65c2e00bee547d393db](https://github.com/h2so4nackl-code/wdk-wallet-evm/blob/9b150d3d2de13f6e9127f65c2e00bee547d393db/src/x402-signer.js). Its Apache-2.0 notice is retained. It is not a released WDK export.
- [Hyperliquid wallet interfaces and domain injection](https://github.com/nktkas/hyperliquid/blob/db80d598f6e4672edc090fe69994ecec97ebc980/src/signing/_abstractWallet.ts).
- [Hyperliquid L1 signing](https://github.com/nktkas/hyperliquid/blob/db80d598f6e4672edc090fe69994ecec97ebc980/src/signing/_l1.ts).

## Interpretation and limits

This is an independent SDK consumer with the same core projection requirement, not evidence of an existing public request from Hyperliquid users. `@nktkas/hyperliquid` is a community SDK; this is not an official Tether or Hyperliquid integration.

The original helper cannot be reused unchanged. A future generic helper would need reviewed EIP-712 domain normalization, retained primary-type checks, readonly field conversion, hex result validation and bound signing methods. The small wrapper here accepts one known domain layout; it is not a complete normalization implementation or security review.

No hardware wallet, Windows, Bare runtime, deployed account, live Hyperliquid acceptance, account rotation, or smart-account signature semantics were qualified. A signing surface does not establish policy authorization or full protocol compatibility. Morpho was not tested and is not part of this evidence.
