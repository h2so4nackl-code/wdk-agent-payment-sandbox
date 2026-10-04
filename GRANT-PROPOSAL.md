# WDK Agent Payment Sandbox — grant proposal candidate

## Executive summary

Security-focused WDK/x402 conformance and policy sandbox for agentic payments. A working local implementation demonstrates how structured agent requests pass a strict policy boundary before mock execution or official WDK test authorization. It provides reproducible adversarial evidence without real credentials, wallet funding, mainnet or blockchain broadcast.

## Problem and ecosystem gap

A wallet/payment demo establishes a happy path, not safety under substituted recipients, inflated amounts, malformed offers, retries, concurrency or late authorization. WDK examples/MCP/skills and community policy projects overlap with wallet and budget primitives. The contribution is a focused WDK-specific security/conformance corpus, deterministic environment, strict integration contract and reproducible dependency/compatibility evidence. NOVELTY.md records bounded research and overlap; no universal novelty claim.

## Solution and architecture

Agent tool caller -> strict interface -> original Policy Engine/capability/reservation -> mock ledger or validated composition adapter -> official WalletAccountEvm -> x402 client -> local protected resource/verifier -> simulated settlement/resource. ARCHITECTURE.md defines exact data flow; no direct agent-to-WDK write path is exposed. Host code/dependencies are trusted; process isolation/durable financial accounting are not claimed.

## Why WDK and x402

Reuse official Tether wallet orchestration/EVM accounts and test signing rather than implement cryptography. Exercise HTTP payment discovery, EIP-3009 authorization and verification through official x402 Foundation code. Sources: https://docs.wdk.tether.io/ai/x402/ ; https://github.com/tetherto/wdk ; https://github.com/tetherto/wdk-wallet-evm ; https://github.com/x402-foundation/x402 . WDK remains beta. No Tether/community-facilitator endorsement is implied.

## Security model and scope

Local/test only, EOA, EIP-3009, x402 v2 exact, chain 31337, fixed simulated asset/recipient/domain. Caps, allowlists, explicit intent, supervisor capability, prepare/revalidate/reserve, replay/duplicate/deadline/cancellation controls, dry-run and projected sanitized logs. Default mock has zero external spending; configuration cannot enable financial rails. Test material is deliberately public/reconstructible and must never be funded/reused for real money. Official verification performs actual cryptography; settlement changes fixture state only. SECURITY.md/THREAT-MODEL.md document failure/residual risks.

## Existing evidence

136/136 runtime cases, including 34/34 adapter subset; strict project compilation, build/lint/scans, dependency advisory review and Windows locked snapshot reproduction pass. Current installed WDK core beta.18/EVM beta.20, x402 2.28.0. Online advisories returned zero critical/high/known reachable vulnerabilities; signature/SRI/identity checks pass. These are scoped checks, not formal certification. Ubuntu workflow prepared, hosted execution not yet authorized/performed.

## Integration finding

Direct raw WDK EIP-3009 runtime and official cryptographic verification work. Published direct TypeScript assignment fails TS2322 for the installed pair. Our validated composition adapter compiles strictly and preserves semantics; an unchanged direct failure fixture automatically retains the discrepancy. No upstream declaration was patched and no acknowledgment claimed. A related documentation-version PR is disclosed; it does not resolve our measured pair and we infer nothing about untested older examples.

## Deliverables, milestones and acceptance

GRANT-DELIVERABLES.md defines four measurable milestones with completed/future status, objective acceptance, test evidence and proposed maintenance impact: accepted implementation; reviewed release/public rollout; authorized hosted Windows/Ubuntu and upstream compatibility feedback; bounded supported-profile maintenance. Acceptance requires same-profile passing tests/type/build/lint/scans, privacy-safe exact committed reproduction and no financial activity. Future supported engineering means regression fixtures/fixes, not broader financial/mainnet functionality.

## Open-source and ecosystem benefit

Apache-2.0 project source, distinct upstream/transitive notices, official pins/locks, public curated evidence, developer README and secret-free CI. A reusable harness helps developers establish allowed and denied behavior before adapting payment integrations. Local preparation does not authorize publication. Owner confirmation of rights, contact and external actions remains required.

## Maintenance and funding

MAINTENANCE.md proposes bounded options, not a promise: 3×4h, 6×8h or 12×12h. GRANT-BUDGET.md separates completed retrospective scope estimates from prospective release/CI/docs/supported engineering/maintenance, with LEAN/STANDARD/EXTENDED calculations. STANDARD is recommended for PROJECT-LEAD REVIEW; no final amount/duration selected. Proposed release period 2–4 weeks after authorization; schedule/capacity/terms are unapproved. No official custom-grant funding cap is invented.

## Risks and limitations

Beta/API/runner drift; process-local budgets/replay; native dependency trust and unverified full build provenance; restricted profile; no fair-exchange proof against dishonest sellers; public deterministic test material; hosted Linux evidence pending. Mitigate with locks, validation, retained compatibility fixtures, exact source-snapshot reproduction, scoped claims and approved maintenance. No mainnet readiness, full x402 coverage or financial security certification.

## Application prerequisites

Owner supplies verified applicant/background/contact, legal eligibility/authority, URLs after publication, budget/maintenance choice and terms review. Current observed form begins with required terms agreement; later fields remain unverified because no agreement was accepted. APPLICATION-FORM-PACKAGE.md prepares reusable answers without inventing the schema. Publication, issue submission, hosted CI and grant submission all need explicit authorization.
