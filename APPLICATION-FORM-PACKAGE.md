# Application form package — project evidence updated 2026-10-06

**Public evidence checked 2026-10-06:** [repository](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox); [v0.1.0](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/releases/tag/v0.1.0), published 2026-10-05, snapshot `2e04dba65132f5e0790fcc56c52f10712581bd5a`; [Local sandbox conformance run 37288753892](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/actions/runs/37288753892), PASS on Ubuntu 26.04 and Windows. Release evidence: 77 core + 59 official-profile = 136 runtime tests; 34 adapter tests are a subset. Verification is local and cryptographic; settlement is simulated. No mainnet, blockchain broadcast, real credentials or real funds. This independent project does not claim work commissioned by Tether or Tether endorsement.

Form observations below are historical observations from 2026-10-04; the form and terms were not reverified in this update.

## A. VERIFIED FIELD OBSERVATIONS — 2026-10-04

Read-only sources: [official application page](https://tether.dev/grants/apply-for-a-grant/) links [Submit a proposal](https://forms.monday.com/forms/embed/d8a6c98afe75c562acea773eaa3ca3ed?r=euc1). Browser-rendered first section was inspected without filling/submitting anything.

| Observed field | Type | Required | Observation |
|---|---|---|---|
| Tether Grant Application Terms | Agreement checkbox | YES | Visible unchecked; accepting the linked terms is requested before advancing |

The heading is Submit a proposal and a Next button is visible. Neither the agreement nor Next was activated. Later sections/conditional fields are **FORM FIELD UNVERIFIED** because progressing would require legal acceptance; read-only preparation does not authorize it. This is a partial field observation, not a complete verified schema. Terms last updated April 1, 2026; applicant eligibility/authority, due diligence and application disclosures require owner review. No general funding cap is inferred from bounties or the form. [Official terms](https://tether.dev/grants/terms/).

## B. PREPARED ANSWERS

The following topics are reusable prepared copy. Except the agreement in section A, every topic below has status **FORM FIELD UNVERIFIED**: it is not claimed to be an observed current form field. Re-map only after the owner reviews/accepts terms and the actual remaining fields can be inspected. Do not submit placeholders.

### Project Name

FORM FIELD UNVERIFIED

WDK Agent Payment Sandbox

### One-line Summary

FORM FIELD UNVERIFIED

Security-focused WDK/x402 conformance and policy sandbox for agentic payments.

### Applicant / Team

FORM FIELD UNVERIFIED

OWNER DECISION REQUIRED: legal applicant/team and authorized representative. No identities inferred.

### Project URL

FORM FIELD UNVERIFIED

Public project repository: https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox. Public release: https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/releases/tag/v0.1.0. No separate hosted product/demo URL is claimed.

### GitHub URL

FORM FIELD UNVERIFIED

https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox

### Problem

FORM FIELD UNVERIFIED

Autonomous payment integrations need repeatable evidence that malformed challenges, substituted recipients, retries and expired requests cannot bypass authorization or budgets. A happy-path wallet demo does not provide that evidence.

### Solution

FORM FIELD UNVERIFIED

A working fund-free sandbox with a Policy Engine above execution, official WDK/x402 integration and deterministic/adversarial conformance tests. Developers reproduce allowed and denied payments locally before adapting financial integrations.

### Tether Technology Used

FORM FIELD UNVERIFIED

Official @tetherto/wdk 1.0.0-beta.18 and @tetherto/wdk-wallet-evm 1.0.0-beta.20; WDK EVM orchestration, reads and local EIP-712 authorization. WDK remains beta.

### Why WDK

FORM FIELD UNVERIFIED

Use official wallet functionality rather than implementing wallet cryptography; test agent policy and compatibility around its actual API.

### Why x402

FORM FIELD UNVERIFIED

Exercise HTTP 402 discovery, payment requirements, payload construction, cryptographic verification and resource release through official/reference packages. Supported scope is v2 exact EOA EIP-3009, local chain 31337 and simulated settlement.

### Ecosystem Benefit

FORM FIELD UNVERIFIED

A reusable security/conformance corpus and reproducible safe environment for WDK developers, with explicit failure classifications and compatibility regression evidence.

### Technical Architecture

FORM FIELD UNVERIFIED

Structured agent interface -> policy/capability/reservation gateway -> mock ledger or strict WDK signer adapter -> official x402 client -> local protected server and verifier. No raw wallet write tools are exposed to agents.

### Security Model

FORM FIELD UNVERIFIED

Default mock/no-money mode; limits and allowlists; explicit intent; authorization; duplicate/replay/expiry controls; dry-run; sanitized projected logs. Host code/dependencies trusted; state not durable/distributed. No financial readiness or formal certification claimed.

### Current Status

FORM FIELD UNVERIFIED

136/136 runtime tests including 34/34 adapter subset; strict project typecheck/build/lint/scans and Windows locked-snapshot reproduction pass. Official WDK runtime and supported x402 profile pass. Hosted Ubuntu 26.04 and Windows conformance passed on the v0.1.0 snapshot; see the public run above. Local cryptographic verification and simulated settlement only.

### Deliverables

FORM FIELD UNVERIFIED

Four measurable milestones in GRANT-DELIVERABLES.md: completed sandbox implementation; published v0.1.0; passing hosted platform evidence and proposed upstream feedback; future bounded maintenance/feedback. Completion is not grant acceptance. Completed and future work are labeled separately.

### Milestones

FORM FIELD UNVERIFIED

M1 completed implementation; M2 v0.1.0 published; M3 Windows/Ubuntu hosted validation completed, upstream proposal open/unaccepted; M4 future owner-approved maintenance.

### Testing

FORM FIELD UNVERIFIED

77 preserved offline core tests plus 59 official-profile tests = 136. Coverage includes caps, substitutions, unauthorized access, retries, replay, expiry, dry-run, malformed SDK data/signatures, exception secrecy and actual official ECDSA verification.

### Novelty

FORM FIELD UNVERIFIED

Not a new wallet or novel policy primitive. Differentiation is the combined WDK-specific security/conformance, compatibility and reproduction harness; overlap is disclosed. It detected a real published direct TypeScript mismatch for the installed pair while preserving runtime success and a validated project adapter. [tetherto/wdk-wallet-evm#133](https://github.com/tetherto/wdk-wallet-evm/pull/133) is an open, mergeable upstream proposal as checked 2026-10-06, not merged, accepted or released. Mergeability is not maintainer acceptance. It does not change the published package pair or this release's direct TypeScript mismatch.

### Open Source Plan

FORM FIELD UNVERIFIED

Apache-2.0 project source with separate upstream notices, locked dependencies, docs and passing hosted CI. Repository and v0.1.0 are public. No Tether endorsement claimed.

### Maintenance

FORM FIELD UNVERIFIED

OWNER DECISION REQUIRED. Proposed bounded options: 3 months×4h, 6 months×8h or 12 months×12h; no 24/7 support/SLA. See MAINTENANCE.md.

### Budget

FORM FIELD UNVERIFIED

PROJECT-LEAD REVIEW REQUIRED. Three internal scenarios in GRANT-BUDGET.md; no final requested amount chosen. Completed work valuation is separated from prospective work/maintenance.

### Timeline

FORM FIELD UNVERIFIED

Publication and hosted validation are completed. Remaining feedback/maintenance timeline is an OWNER/PROJECT-LEAD DECISION; the earlier 2–4-week rollout estimate is not a remaining-work deadline.

### Applicant Background

FORM FIELD UNVERIFIED

Demonstrable evidence is this working implementation/test/reproduction record. No personal employment, qualifications, public history or experience is fabricated; owner supplies verified biography if desired.

### Contact

FORM FIELD UNVERIFIED

OWNER DECISION REQUIRED. No private email/phone is inferred or inserted.
