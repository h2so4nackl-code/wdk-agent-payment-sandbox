# Third-party provenance — updated 2026-10-04

| Component | Source and version | Access / hooks | Review result |
|---|---|---|---|
| TypeScript | https://github.com/microsoft/TypeScript ; 5.9.3, root SRI lock | Local compiler/lint; lifecycle disabled | PASS; online advisory audit PASS |
| WDK core | https://github.com/tetherto/wdk ; beta.18 | Optional local orchestration, generated test material; no external RPC | PASS runtime; beta |
| WDK EVM | https://github.com/tetherto/wdk-wallet-evm ; beta.20 | Optional reads/test EIP-712 authorizations; no transaction signing/broadcast | PASS runtime; direct TypeScript signer FAIL |
| WDK MCP/skills | https://github.com/tetherto/wdk-mcp-toolkit ; https://github.com/tetherto/wdk-agent-skills | Public research only | Not installed/executed |
| x402 core/evm/fetch/express | https://github.com/x402-foundation/x402 ; 2.28.0 each | Optional local HTTP/codecs/EVM verification/simulated settlement | PASS scoped runtime; no live-chain claim |

Six exact official-package identities, registry signatures and SHA512 values verify. All lifecycle scripts were disabled. Registry archives were acquired through read-only PowerShell HTTPS into project-local cache; no system/network/proxy changes. Native crypto/Bare code is trusted package code, not exhaustively audited instructions. Full SLSA provenance chains remain UNVERIFIED; remaining build-provenance limitation is disclosed as WARN; no broader assurance is claimed.

The 202 optional installed license declarations comprise Apache-2.0 (91), MIT (101), ISC (5), BSD-3-Clause (2), BSD-2-Clause (1), 0BSD (1), Unlicense (1). Preserve upstream license/notice files on distribution. TypeScript retains LICENSE.txt and ThirdPartyNoticeText.txt. No upstream wallet/cryptography/protocol source was vendored. Installed versions/scripts/licenses, tags/commits, audit outcomes and source URLs are in UPSTREAM-INTEGRATION.md, DEPENDENCY-AUDIT.md and evidence/public/installed-inventory.json. No community facilitator or Tether endorsement is claimed.

## Release license and attribution review

Project-authored sandbox source is offered under the standard Apache License 2.0 in LICENSE (https://www.apache.org/licenses/LICENSE-2.0.txt). No personal copyright holder has been invented; the owner must confirm title/optional attribution and approve publication. Upstream API usage and standard protocol schema definitions are not represented as upstream wallet/crypto code owned by this project.

Root direct development dependency TypeScript 5.9.3 is Apache-2.0 (https://github.com/microsoft/TypeScript). Optional direct dependencies @tetherto/wdk beta.18 and @tetherto/wdk-wallet-evm beta.20 are Apache-2.0; @x402/core, evm, fetch, express 2.28.0 are Apache-2.0. No package implementations/binaries, upstream logo or copyrighted grant-page text is bundled. The lock/inventory references are metadata; installs retain package license/notice files in their own trees.

The release distributes our source, not a bundled dependency artifact; any future binary/vendor distribution must preserve actual dependency license/notice texts and be reviewed separately. The current 202-entry permissive transitive declaration inventory is included in evidence/public/installed-inventory.json; no known copyleft incompatibility was found in those declarations. SPDX metadata is evidence, not complete legal certification of every transitive file. Registry metadata projections omit unnecessary maintainer emails while preserving attribution repository links and license identities.
