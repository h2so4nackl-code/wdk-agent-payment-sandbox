# Implementation audit trail

## 2026-10-04 — official integration

- Preserved 77-test baseline/hash; documented transient HTTP failures and unchanged passing reruns without relaxed assertions.
- Rechecked official registry/GitHub metadata; pinned core beta.18/EVM beta.20/x402 2.28.0. Six registry signatures/SRI verify. Public PowerShell transport works; Node TLS EACCES persists. No networking/execution-policy changes.
- Corrected acquisition-helper project-root binding and npm Accept cache metadata. Resolver initially cached a higher semver instead of a satisfying stable dist-tag; missing get-intrinsic 1.3.0 caused ENOTCACHED. Preserved partial tree under reproduction, corrected selection/acquisition, clean install passed with scripts disabled.
- Added explicit generated-material local WDK mode, exact typed-data gate above existing policy and official fetch/Express/core/EVM conformance with simulated contract settlement.
- Fixed demonstrated profile defects: explicitly bounded allowed test asset in SDK spend controls, and official `Payment required` challenge field. No disabled controls, upstream patches or unsafe casts.
- Added 25 runtime tests; retained all 77 baseline tests. Combined 102/102 PASS. Direct published signer declarations fail TS2322 despite raw runtime preparation/verification PASS; retained failed gate.
- Online root/profile npm audits exit 0, zero known advisories. Fresh core and official cached/offline reproduction pass. Updated current docs/report; previous source scan is historical, not a scan of these changes.

## 2026-10-03 — baseline

1. Created new isolated directory; read ancestor AGENTS.md only. No unrelated project modified.
2. Verified current official program/SDK documentation before implementation; recorded transport gaps, source URLs and overlap. Retained original objective with conformance-focused positioning.
3. Spec Kit launcher failed due missing referenced Python runtime. Wrote requirements/specification/plan/tasks locally; made no global tool changes.
4. Installed cached official TypeScript 5.9.3 with lifecycle scripts disabled. No system installation. Registry and GitHub native transport failures recorded; approved retries also failed.
5. Implemented strict policy/gateway, synthetic ledger and local x402-style flow; no signing or credential-loading APIs.
6. Initial 73 core/HTTP/adapter-fixture tests passed. Adapter-fixture test explicitly separated from installed-package conformance.
7. Corrected a lint detector bug: whitespace regex counted newline as trailing whitespace. Narrowed check to spaces/tabs; this changed lint implementation, not policy controls.
8. Review added caller cancellation propagation, post-preparation capability revalidation and audit allowlist projection. Added regression tests. One new test initially asserted 13 fields where documented schema has 12; replaced irrelevant count assertion with retained amount/reason checks. No security behavior weakened.
9. Optional pinned WDK install and advisory audit failed with EACCES, including approved retries; do not label them passed. Final evidence and security review follow in evidence/ and FINAL-REPORT.md.
10. Fresh-copy reproduction initially failed because the project-local cache lacked the compiler. Imported only the cached public compiler archive, verified against locked SHA512, with explicit safe metadata; no other cache entries or credentials copied. Fresh-copy offline install/verify/demo then passed.
11. Independent architecture review clarified optional dependency-directory separation is not process isolation. Build now removes only validated project-local generated dist before compiling. First-party lint excludes nested dependency/generated trees; reproduction excludes nested dependency trees and environment files. No policy controls weakened.
