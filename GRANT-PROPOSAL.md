# WDK Agent Payment Sandbox — grant proposal candidate

**Application status corrected 2026-10-06:** Submitted on 2026-10-04 after owner authorization and terms acceptance. The retained submission confirmation is the Tether “Thank you!” screen (`tether-submitted-1791128177695.jpg`); applicant/contact details and the submitted copy remain private. Submission is not grant approval, funding, payment or a Tether commission. No duplicate application has been submitted. The later v0.1.0 release/CI evidence and upstream #133 are project updates, not claimed amendments to the submitted form.

**Public evidence checked 2026-10-06:** [repository](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox); [v0.1.0](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/releases/tag/v0.1.0), published 2026-10-05, snapshot `2e04dba65132f5e0790fcc56c52f10712581bd5a`; [Local sandbox conformance run 37288753892](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/actions/runs/37288753892), PASS on Ubuntu 26.04 and Windows. Release evidence: 77 core + 59 official-profile = 136 runtime tests; 34 adapter tests are a subset. Verification is local and cryptographic; settlement is simulated. No mainnet, blockchain broadcast, real credentials or real funds. This independent project does not claim work commissioned by Tether or Tether endorsement.

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

136/136 runtime cases, including 34/34 adapter subset; strict project compilation, build/lint/scans, dependency advisory review and Windows locked snapshot reproduction pass. Current installed WDK core beta.18/EVM beta.20, x402 2.28.0. Online advisories returned zero critical/high/known reachable vulnerabilities; signature/SRI/identity checks pass. These are scoped checks, not formal certification. Hosted Ubuntu 26.04 and Windows conformance passed on the release snapshot; see the public run above.

## Integration finding

Direct raw WDK EIP-3009 runtime and official cryptographic verification work. Published direct TypeScript assignment fails TS2322 for the installed pair. Our validated composition adapter compiles strictly and preserves semantics; an unchanged direct failure fixture automatically retains the discrepancy. No upstream declaration in this sandbox was patched and no acknowledgment claimed. A related documentation-version PR is disclosed; it does not resolve our measured pair and we infer nothing about untested older examples. [tetherto/wdk-wallet-evm#133](https://github.com/tetherto/wdk-wallet-evm/pull/133) is an open, mergeable upstream proposal as checked 2026-10-06, not merged, accepted or released. Mergeability is not maintainer acceptance. It does not change the published package pair or this release's direct TypeScript mismatch.

## Deliverables, milestones and acceptance

GRANT-DELIVERABLES.md defines four measurable milestones with completed/future status, objective acceptance, test evidence and proposed maintenance impact: completed implementation; published v0.1.0; completed hosted Windows/Ubuntu validation and proposed upstream compatibility feedback; future bounded supported-profile maintenance. Completion does not establish Tether/grant acceptance. Acceptance requires same-profile passing tests/type/build/lint/scans, privacy-safe exact committed reproduction and no financial activity. Future supported engineering means regression fixtures/fixes, not broader financial/mainnet functionality.

## Open-source and ecosystem benefit

Apache-2.0 project source, distinct upstream/transitive notices, official pins/locks, public curated evidence, developer README and secret-free CI. A reusable harness helps developers establish allowed and denied behavior before adapting payment integrations. Repository and v0.1.0 are public. Owner-supplied applicant/contact details, terms acceptance and submission authorization were used on 2026-10-04; no grant acceptance is inferred.

## Maintenance and funding

The owner-approved submitted request is **8,280 USDt over four weeks from an agreed start**, with **96 planned hours**: engineering 32h + documentation 16h + maintenance/conformance 48h. Calculation: 96 × 75 USD = 7,200 USD; 15% contingency = 1,080 USD; total = 8,280 USDt requested. These are prospective estimates, not recorded hours or official Tether rates; completed implementation/publication/CI are excluded. Award, start date and payment remain subject to a grant agreement. GRANT-BUDGET.md retains earlier scenarios as historical alternatives; they are not the submitted request. No official custom-grant funding cap is invented.

## Risks and limitations

Beta/API/runner drift; process-local budgets/replay; native dependency trust and unverified full build provenance; restricted profile; no fair-exchange proof against dishonest sellers; public deterministic test material; hosted evidence limited to the tested Ubuntu/Windows release snapshot. Mitigate with locks, validation, retained compatibility fixtures, exact source-snapshot reproduction, scoped claims and approved maintenance. No mainnet readiness, full x402 coverage or financial security certification.

## Application submission

The owner supplied applicant/contact details, selected the submitted budget/period, accepted terms and authorized submission on 2026-10-04. The early read-only field mapping in APPLICATION-FORM-PACKAGE.md is historical. The submission confirmation is retained privately. #133 remains submitted but unaccepted upstream. New external commitments require separate owner authorization; neither grant acceptance nor payment is confirmed.
