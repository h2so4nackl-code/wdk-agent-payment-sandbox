# Test and quality evidence

Run `npm test` for the complete core suite. Node executes TypeScript source directly; tests use the native runner and assertions. Deterministic policy time is injected; HTTP tests bind numeric loopback with ephemeral ports. Timing-specific tests use bounded waits, not wall-clock business-day assumptions.

Installed upstream reads: `npm run test:wdk`. Official conformance/adversarial suite: `npm run test:official` (59 tests). Combined suite: `npm run test:all` (136 tests). Original `npm test` remains 77 offline tests. All runtime suites need no funds or remote/test RPC; only dependency acquisition and live audit require internet. Native crypto executes provided package binaries with lifecycle scripts disabled. Direct TypeScript assignment: `npm run typecheck:upstream-direct`, currently FAIL (TS2322), distinct from supported strict project/adapter typecheck PASS. Current results are in FINAL-TECHNICAL-GATE.md; prior evidence/report remains historical.

| Mandatory case | Evidence |
|---|---|
| 1 Read wallet | read-only address and balance; adapter contract fixture |
| 2 Allowed mock payment | prepares/reserves/settles; clean-start HTTP roundtrip |
| 3 Per-transaction cap | per transaction limit |
| 4 Session cap | session cumulative; concurrent distinct requests |
| 5 Daily cap | daily cumulative and UTC rollover |
| 6 Recipient | recipient allowlist; preparation substitution |
| 7 Token | token allowlist |
| 8 Network | network allowlist; mainnet configuration rejection |
| 9 Unknown contract | unknown contract; preparation substitution |
| 10 Malformed x402 | hostile requirement matrix; strict base64/JSON |
| 11 Duplicate | duplicate request; concurrent duplicate |
| 12 Replay | nonce replay; receipt one use; HTTP replay |
| 13 Expired | expired request; expiry after prepare; receipt expiry |
| 14 Failed transaction secret leak | preparation error canary, insufficient balance, verification failure; synthetic failures only |
| 15 Seeds/keys never logged | Core canaries; optional generated material/derived test key absent from result/audit snapshots; upstream exception injection sanitized |
| 16 Dry-run | zero payment writes; HTTP dry-run |
| 17 Unauthorized agent | no capability; read-only capability; revocation |
| 18 Malformed command | command matrix; accessor rejected |
| 19 Network failure | closed local endpoint; redirect rejection; hang timeout |
| 20 Verification failure | rejected verification and forged settlement |
| 21 Clean-start server | ephemeral server roundtrip and cleanup |
| 22 Reproduction | scripts/reproduce.mjs and evidence/reproduction.json; offline fresh source copy, not online clone |
| 23 Dependency audit | Executed online root/profile npm audits exit 0, zero known advisories; database limits explicit in DEPENDENCY-AUDIT.md |
| 24 Secret scan | source-pattern scan with values withheld; documented heuristic limits |
| 25 Type checking | TypeScript 5.9.3 strict compile, unused checks, no suppressions; core plus installed optional adapter/positive compile fixture |
| 26 Lint | AST rules for source/tests/scripts/integration; JS syntax; no ESLint claim |

Additional cases: conservative failed-execution accounting; immutable config/input; safe zero budgets; cancellation during preparation; state capacity; audit ring/projection; rollback clock; accessors; unsupported fake real scheme; arbitrary metadata; multiple-offer ambiguity; malformed integer formats.

## Commands

```sh
npm ci --ignore-scripts
npm run verify
npm run demo
node dist/demo.mjs
npm run evidence
npm run reproduce
npm run test:wdk
npm run test:official
npm run test:all
npm run typecheck:signer
npm run typecheck:adapter
node scripts/upstream-direct-evidence.mjs
npm run reproduce:official
npm run audit:online
npm audit --json
```

No mandatory case is counted as passed solely because it is listed here. Local mock tests cannot establish live settlement correctness, on-chain replay protection, distributed/durable budgets, KYC eligibility or third-party security. Project scripts execute no dependency lifecycle hooks. After dependency/version changes, rerun profile install, audit and conformance.

Initial unchanged baseline run had five transient NETWORK_FAILURE classifications in hostile-header tests. Isolated HTTP tests and five unchanged full-suite reruns passed; later full verification also passed. No assertion was relaxed. Precise local transport cause is not proven; retain this reproducibility warning in PRE-INTEGRATION-BASELINE.md. Official-profile fixes addressed SDK default non-default-asset spend rejection by explicitly configuring the bounded local asset, and accepted the official bounded `Payment required` challenge error. Neither fix disabled policy or library controls.

## Adapter and cross-platform scope

34 new signer-adapter.test.mjs cases cover address validation (7), uninitialized/default-deny/non-exposed capabilities (1), explicit immutable conversion (1), adversarial typed data before policy/signing (15), malformed signature/replay (5), concurrency/replay/post-policy expiry (1), exception sanitation (1), actual WDK/official ECDSA (1), malformed WDK outputs through the policy facade (2). Existing 25 official tests now execute the typed adapter, except the unchanged direct-runtime evidence case. Core 77 tests were not removed.

The normal typecheck includes the supported adapter when the optional profile is installed and states core-only scope if not installed, preserving the dependency-free offline base. typecheck:adapter is an unconditional supported-profile compile gate. The negative upstream fixture is excluded by positive tsconfig include lists; its own command still fails. The diagnostic-checking helper exits 0 only when the unchanged fixture reproduces expected TS2322, records raw exit 2, and fails on fixture/diagnostic drift. No negative fixture assertion is a runtime test counted in the 136 total. skipLibCheck skips third-party declaration bodies in the optional config, not project strictness or structural assignment checks.

.github/workflows/conformance.yml is locally prepared only: Ubuntu 26.04 LTS and windows-latest (currently Server 2025), Node 24.16.0, pinned official action commits, read-only repository permission, no persisted checkout credential, lifecycle scripts disabled, manual trigger only. Current labels were checked at https://github.com/actions/runner-images on 2026-10-04. No hosted CI run or publication occurred. Windows local reproduction is executed; Linux/macOS are UNVERIFIED. No Docker executable or installed WSL distribution was available; no system software or configuration changed.

After installing the optional profile, npm run scan:test-material derives only the same public deterministic fixture material in memory and checks its seed/private-key hex against source and retained evidence/log artifacts without printing values. This complements the heuristic secret scan; it does not prove absence of unknown encodings or memory remnants. Both scans pass with zero findings.

## Release snapshot reproduction

After a local commit and verified cache acquisition, npm run reproduce:git exports exactly HEAD with git archive, extracts it into a fresh ignored release checkout, and performs fresh root/official npm ci installs from locked archives. It runs core/official/adapter runtime suites, both strict compile gates, lint/build, both secret/material scans, mock demo, expected upstream diagnostic and registry signature checker. No working-tree/untracked source or existing node_modules is copied. Results with exact commit, exits and counts are written to the ignored local evidence/release/committed-snapshot.json; the local release gate records the immutable hash. Normal internet-connected developers can use the README npm ci commands rather than the host-specific offline cache option. Generated checkout trees are excluded from the parent scans and independently scanned inside the reproduction. Public curated evidence is in evidence/public; historical raw reports remain local, not Git assets.
