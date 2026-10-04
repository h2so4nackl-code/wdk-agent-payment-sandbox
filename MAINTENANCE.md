# Maintenance proposal

**OWNER DECISION REQUIRED:** maintainer identity, funding, duration, availability, contact and supported release policy. This document is a realistic proposal, not an executed support contract. No 24/7 support, incident SLA or unapproved workload is promised.

| Area | Proposed practice | Acceptance / scope |
|---|---|---|
| Dependencies | Monthly advisory check; review package identity/repository/license/scripts/lock diff before updates | No forced major upgrades; preserve lifecycle disablement and official package boundary; run all supported tests/type/build/lint/scans |
| WDK/x402 compatibility | Check each proposed beta/reference upgrade in a separate branch | Strict supported adapter and actual EIP-3009 verification; retain direct negative fixture until measured upstream behavior changes |
| Declaration changes | If the evidence helper alerts, review exact diagnostic/declarations rather than treating disappearance as automatic success | Add positive direct compile/runtime evidence before retiring the mismatch; keep historical frozen proof; simplify adapter only with justified tests, not an architecture redesign |
| Security intake | Before publication, owner selects a private contact or GitHub private vulnerability reporting | Until then, no public security email is invented; report sensitive findings privately to the owner. Triage only supported boundaries and do not solicit wallet secrets |
| CI | Monthly review of pinned official actions, Node and runner labels; investigate actual runner failures | Windows/Ubuntu supported profile; no CI secrets, RPC credentials, mainnet or settlement transport |
| Docs | Update version tables/profile limitations/reproduction with release evidence | Do not claim full x402, financial readiness, Tether endorsement or formal audit |
| Issues | Proposed weekly or fortnightly batch review within funded hours | Categorize defect/compatibility/docs/out-of-scope; acknowledge when capacity permits; no response-time guarantee |

Options for review: LEAN 3 months at up to 4h/month; STANDARD 6 months at up to 8h/month; EXTENDED 12 months at up to 12h/month. STANDARD is recommended for beta SDK drift without promising full-time support. These durations and ceilings require owner approval; they are not current commitments. See GRANT-BUDGET.md.

Exit/renewal: publish last tested package versions, unresolved issues and a clear maintenance status when funding ends. Renewal requires a new owner decision. Real-money scope remains excluded throughout.
