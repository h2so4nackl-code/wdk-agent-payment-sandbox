# Internal grant budget scenarios

**PROJECT-LEAD REVIEW REQUIRED. No final amount selected or inserted into the application.** Currency for calculation: USD-equivalent planning units; payment asset/currency and award terms are UNVERIFIED/owner decision. Rates are internal assumptions, not market research or official Tether rates. No official custom-grant cap/range is asserted; displayed bounties do not establish one. Current [program terms](https://tether.dev/grants/terms/) were reviewed 2026-10-04 and provide no entitlement to reimbursement of our completed work.

## Completed work (separate retrospective estimate)

The accepted implementation, tests, docs and tooling already exist. No contemporaneous timesheet was provided. For planning only, model 160 engineering + 20 documentation + 20 conformance/reproducibility hours = 200 retrospective equivalent hours. This is an explicit estimate, not a claim of hours actually billed/worked. Estimated value: LEAN 200×60=12,000; STANDARD 200×75=15,000; EXTENDED 200×90=18,000. These values are **not included** in the prospective requests below. Any retrospective funding needs owner review and explicit program eligibility clarification; no double counting.

## Prospective work and maintenance

| Scenario | FUTURE supported conformance engineering | Release/publication | Docs | CI/reproduction | Maintenance (unapproved) | Total hours | Assumed rate | Base | Contingency | Internal requested amount |
|---|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|
| LEAN | 12h | 16h | 8h | 12h | 3×4h=12h | 60h | 60 | 3,600 | 10%=360 | 3,960 |
| STANDARD | 32h | 24h | 16h | 24h | 6×8h=48h | 144h | 75 | 10,800 | 15%=1,620 | 12,420 |
| EXTENDED | 64h | 32h | 24h | 40h | 12×12h=144h | 304h | 90 | 27,360 | 15%=4,104 | 31,464 |

Requested amount = future-work and maintenance hours × assumed rate + disclosed contingency. At each scenario's rate, maintenance portions are respectively 720, 3,600 and 12,960 before contingency; non-maintenance portions 2,880, 7,200 and 14,400. Tax, payment fees, paid CI and legal costs are not invented; if relevant, the owner must supply them before selecting an amount. No equipment/system software purchase is assumed.

Future engineering means regression fixes, additional negative fixtures/developer-feedback changes within the existing supported EOA/EIP-3009 local profile. It does not fund mainnet, token deployment, multi-chain financial execution, new architecture or complete x402 coverage. Already finished local release preparation is not silently billed again: the release rows estimate authorized public rollout, hosted validation, reviewer feedback and final packaging still ahead; unused hours should be removed during lead review.

**Recommendation: STANDARD**, subject to review. Six months of bounded attention addresses beta dependency/runner drift and allows documented contributor feedback without an unrealistic full-time promise. LEAN minimizes funding but offers shorter maintenance; EXTENDED needs a justified supported-profile backlog and owner capacity. The figures are scenario models, not an application amount. Maintenance duration, hourly assumptions, future scope, contingency, payment currency and prospective/retrospective eligibility all require explicit owner/project-lead review.
