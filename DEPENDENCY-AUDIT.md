# Dependency and supply-chain audit — 2026-10-04

## Executed advisory result

`npm run audit:online` executed standard npm 11.13.0 audit twice: root and integrations/wdk. Both exit **0**. Both reports contain zero known CRITICAL, HIGH, MODERATE and LOW vulnerabilities; known reachable advisory findings: **0**. There are no returned vulnerabilities to classify as REACHABLE / LIKELY_UNREACHABLE / UNVERIFIED. This is an advisory database snapshot, not proof that every dependency is vulnerability-free.

[Root npm report](evidence/public/npm-audit-root.json), [official-profile npm report](evidence/public/npm-audit-official.json), [raw official advisory responses ](evidence/public/registry/), [official npm endpoint](https://registry.npmjs.org/-/npm/v1/security/advisories/bulk).

Node outbound TLS still fails EACCES. The project-only audit bridge forwards npm's public name/version POST to that exact official security endpoint through PowerShell HTTPS. It validates and bounds the body, strips all original headers, accepts no arbitrary destination, and records the real response. npm performs its normal advisory interpretation and returns its own report/exit code. No system proxy, TLS validation, networking or execution policy changes. No `npm audit fix` or forced upgrades. [Audited bridge source](scripts/audit-online.mjs).

## Direct and transitive inventory

Root: one dev dependency, TypeScript 5.9.3; zero core runtime dependencies. Optional official profile: six exact direct packages, 202 installed dependency entries (135 prod, 68 peer including root accounting as reported by npm; total 202). Registry-selected exact versions and sources are in [UPSTREAM-INTEGRATION.md](UPSTREAM-INTEGRATION.md); installed paths/version/license/scripts/SRI values are preserved in [installed inventory](evidence/public/installed-inventory.json) and [lockfile](integrations/wdk/package-lock.json). No installed deprecated package is recorded in that inventory.

Installed license declarations: Apache-2.0 (91), MIT (101), ISC (5), BSD-3-Clause (2), BSD-2-Clause (1), 0BSD (1), Unlicense (1). These are permissive declarations; distribute required notices/license texts with any future release. This inspection is not legal certification. No copyleft license declaration appears in the measured set. Root TypeScript is Apache-2.0. [Actual manifests](evidence/public/installed-inventory.json), [notices](THIRD-PARTY-NOTICES.md).

No preinstall/install/postinstall hook or `binding.gyp` was found in the installed package manifests/tree inventory. All lifecycle scripts were disabled regardless. Native/prebuilt crypto and Bare runtime artifacts still enter the trusted dependency boundary; this audit does not inspect every native instruction or prove their build provenance. [Inventory](evidence/public/installed-inventory.json), [installation options](README.md).

## Authenticity checks

- Exact names match the documented Tether WDK/x402 packages; no unofficial wallet/facilitator wrapper installed. [Tether guide](https://docs.wdk.tether.io/ai/x402/), [package provenance](UPSTREAM-INTEGRATION.md).
- All six repositories exactly match tetherto or x402-foundation paths. Registry ECDSA signatures verify for all six using the published key set; SHA512 exists for every dependency lock entry and is enforced by npm/cache import. [Supply-chain result](evidence/public/supply-chain.json), [checker](scripts/check-supply-chain.mjs), [registry keys](https://registry.npmjs.org/-/npm/v1/keys).
- SLSA attestation URLs are advertised; full provenance-chain validation remains **UNVERIFIED**, so no provenance endorsement is claimed. [Recorded metadata ](evidence/public/registry/).
- Repository creation/activity/stars/forks/issues and current commit evidence were read from official GitHub APIs and recorded, not inferred from package similarity. [Repository evidence](https://api.github.com/repos/tetherto/wdk), [release/tag evidence](evidence/public/releases.json).
- Both lockfiles are preserved in the local release-candidate Git snapshot. No remote/public push exists. Optional lock SHA256: `89b019e6d63940715a0852290ef25ff07fd6b7720f1f19ad700e4e6c20739ab0`.

Overall recorded advisory audit **PASS**. Supply-chain provenance beyond registry signatures/integrity remains **UNVERIFIED**, a disclosed publication warning reviewed in PUBLICATION-AUDIT.md. Installed-component provenance is measurable; no broad third-party audit or Tether endorsement is asserted.

## Installation history

Initial offline optional install selected get-intrinsic 1.3.0 via stable dist-tag; only a higher semver archive had been cached. It failed ENOTCACHED with partial Windows cleanup errors. The resolver was corrected to prefer a satisfying latest dist-tag, missing archive acquired and checked, partial tree preserved under reproduction/, and a fresh approved project-local install passed (`added 202 packages in 53s`). No security control was disabled. Source scripts and evidence preserve this history.

An early official audit attempt before the optional lock existed returned ENOLOCK; the final above audit was rerun after successful install. It is not counted as a vulnerability-free result. Earlier baseline reports remain historical.

## Adapter run refresh — 2026-10-04

Re-executed npm run audit:online: genuine root and official-profile npm audit exit 0, zero critical/high/moderate/low advisories. Re-executed six-package registry signature/identity checks: all true. The adapter adds no dependency and both lockfile hashes are unchanged. Findings/reachability classification: no returned vulnerabilities to classify; known reachable count 0, not proof against unknown advisories. Native build provenance/SLSA limits remain unchanged. Locally prepared CI references pinned official checkout/setup-node v6 commits resolved through GitHub; the hosted actions were not downloaded/executed here.
