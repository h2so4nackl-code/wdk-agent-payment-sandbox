# Current ecosystem research

Checked 2026-10-03. Public read-only research only. This file precedes implementation. Source branch versions are not asserted to be npm dist-tags. Where transport prevented verification, the result is **UNVERIFIED**.

## Current follow-up — 2026-10-04

The earlier transport/version limitations below are historical. Read-only PowerShell registry/GitHub HTTPS now works; npm/Node direct TLS still returns EACCES. Installed official versions: WDK core 1.0.0-beta.18, EVM 1.0.0-beta.20, x402 core/evm/fetch/express 2.28.0. Six registry signatures and SHA512 archive integrity verify; immutable WDK release/tag commit evidence is preserved. Online npm audits for both profiles exit 0 with zero known advisories. Exact registry URLs, repositories, licenses/runtime declarations, tags/commits/dates and ownership are in UPSTREAM-INTEGRATION.md and DEPENDENCY-AUDIT.md with captured JSON sources. No current-version claim relies on cached branch views.

Official runtime direct signer preparation/verification passes; no-cast TypeScript assignment fails on the published address declaration. X402-CONFORMANCE.md distinguishes this measured mismatch, local simulated settlement and unsupported live-chain/extension behavior. No community facilitator or real RPC used. The actual grant form/identity/budget readiness limitations below remain unresolved; program rules are not invented from technical audit results.

## Tether program

- https://tether.dev/ — advertised areas include WDK libraries, onboarding, applications and open-standard tooling.
- https://tether.dev/grants/ — initial browser retrieval failed. Resolved navigation through the home page.
- https://tether.dev/grants/bounties/ — distinguishes grants for new/community solutions from targeted bounties. Custom proposals have a dedicated application route.
- https://tether.dev/grants/apply-for-a-grant/ — links to the Monday proposal form: https://forms.monday.com/forms/embed/d8a6c98afe75c562acea773eaa3ca3ed?r=euc1 . Form fields were not exposed by text retrieval: **UNVERIFIED**. No submission performed.
- https://tether.dev/grants/bounties/2885260379/ — visible listing: ANE/CoreML/QVAC, 5,000 USD₮, displayed date 01/05/2026. No matching WDK bounty was visible. Completeness of dynamically filtered listing: **UNVERIFIED**.
- https://tether.dev/grants/terms/ — published update April 1, 2026. Applications are nonconfidential; program aims for public open-source outputs. Eligibility, lawful participation and possible KYC apply; selection is discretionary and an award requires a separate written agreement. Applicant eligibility and award terms are not verified here. This is a technical summary, not legal advice; read the full terms before approving submission.

## WDK

| Source | Verified observation |
|---|---|
| https://docs.wdk.tether.io/ | Modular self-custodial wallet SDK for applications and agents |
| https://docs.wdk.tether.io/sdk/get-started/ | Core orchestrates chain wallet modules and protocol modules |
| https://docs.wdk.tether.io/start-building/nodejs-bare-quickstart/ | Official Node/Bare setup reference |
| https://github.com/tetherto | Official organization; wallet and USD₮0 bridge repositories present |
| https://raw.githubusercontent.com/tetherto/wdk/main/package.json | `@tetherto/wdk`, branch version `1.0.0-beta.18`, Apache-2.0; wallet/runtime/zod dependencies |
| https://raw.githubusercontent.com/tetherto/wdk-wallet-evm/main/package.json | `@tetherto/wdk-wallet-evm`, branch version `1.0.0-beta.19`, Apache-2.0; ethers, noble, bip39, sodium, base-wallet and failover dependencies |
| https://raw.githubusercontent.com/tetherto/wdk-wallet-evm/main/index.js | Exports `WalletAccountReadOnlyEvm`; use without key material |
| https://raw.githubusercontent.com/tetherto/wdk-wallet-evm/main/src/wallet-account-evm.js | Separates quoting from signing/broadcast; signer methods include typed-data authorization |
| https://docs.wdk.tether.io/ai/mcp-toolkit/ | `@tetherto/wdk-mcp-toolkit`, documented beta.1, read/write tools and human elicitation |
| https://raw.githubusercontent.com/tetherto/wdk-mcp-toolkit/main/package.json | beta.1 branch manifest; MCP SDK dependency, GitHub-sourced indexer dependency; not installed by this sandbox |
| https://docs.wdk.tether.io/ai/agent-skills/ | Instructions require human confirmation for writes; skills are guidance, not an executable policy boundary |
| https://github.com/tetherto/wdk-agent-skills | Official skill repository |
| https://docs.wdk.tether.io/ai/x402/ | WDK EVM account supports the x402 signer interface; examples use `@x402/fetch`, `@x402/evm`, `@x402/core`; recommended USD₮0 rails include Plasma and Stable. These are research facts, never enabled here |
| https://github.com/tetherto/wdk-protocol-bridge-usdt0-evm | USD₮/USD₮0 bridging module, not needed for safe sandbox |

WDK docs list EVM, Bitcoin, Spark, TON, Tron, Solana, Aptos, RGB, RGB Lightning and Cosmos wallet families. Exact chain coverage varies by module/release; module support does not establish token deployment or x402 compatibility. USD₮ balances/transfers and USD₮0 x402 authorizations require chain-specific contracts; no mainnet contract is configured here. Standard USD₮ support must not be treated as proof of EIP-3009 authorization support.

## Version evidence and limits

Registry `npm view` failed with EACCES even after approved escalation; raw HTTP requests failed TLS; GitHub remote query timed out. Web tool successfully read the official source manifests. **Historical baseline limitation:** latest npm versions/integrity/commit/release details were initially UNVERIFIED. Subsequent verified registry acquisition and pinned evidence are in UPSTREAM-INTEGRATION.md; do not apply this old transport limitation to current installed evidence. Never equate a mutable main-branch manifest with an immutable release. Exact tested artifacts and lock integrity will be recorded after actual installation.

## Dependency and tooling gate

No blind remote scripts or system installation. Only project-local dependencies; install lifecycle hooks disabled. Official WDK modules have substantial transitive crypto/native dependencies; lock and audit are required before release. The installed Spec Kit executable failed because its referenced Python runtime was missing. Follow its requirements/specification/plan/tasks/verification workflow through checked-in documents; do not repair global tooling. Existing Node is v24.16.0, npm 11.13.0. Cached TypeScript 5.9.3 is being evaluated for offline installation.

## Existing projects

- https://github.com/tetherto/wdk-examples — upstream example location to inspect, including x402 client/server.
- https://github.com/SemanticPay/x402-usdt0-demo — WDK/USD₮0 demo and facilitator adapter.
- https://github.com/nirholas/x402-agent-wallet — pre-sign policy governor, budgets, merchant caps and verdicts.
- https://github.com/Omnivalent/x402-agent-pay — agent x402 skill with spending controls.
- https://github.com/xenarch-ai/x402-agent — framework-neutral payer with session budgets.
- https://github.com/Deep-CodeAI/Agents.KT/blob/main/docs/x402.md — offer selection and allowlist policies.
- https://github.com/capinhoooo/forage — WDK agent with x402 payments.
- https://github.com/coinbase/x402 — protocol implementation; current v2 wire compatibility must be checked separately from Tether's explanatory legacy v1 snippet.

Searches: `github WDK x402 policy sandbox agent payments`, `github tetherto wdk x402`, official repository/release lookups. Public descriptions are evidence of overlap, not proof that every security property has been audited. Novelty cannot be proven by absence in a finite search.

## Strict adapter investigation — 2026-10-04

Rechecked https://docs.wdk.tether.io/ai/x402/ and inspected exact installed WDK EVM beta.20 / x402 EVM 2.28.0 declarations. Raw direct runtime EIP-3009 succeeds, direct TypeScript assignment fails TS2322, supported strict adapter compiles and verifies. Frozen diagnostics, package versions and lock hashes are in evidence/upstream-direct-compatibility/. Open/closed relevant GitHub issue searches found no exact indexed report; draft only, no submission. Current official runner images list Ubuntu 26.04 and windows-latest/Server 2025 (https://github.com/actions/runner-images); pinned v6 action refs are recorded in ci-actions.json. Linux/macOS runtime reproduction remains UNVERIFIED. No new dependency version was selected for the adapter.
