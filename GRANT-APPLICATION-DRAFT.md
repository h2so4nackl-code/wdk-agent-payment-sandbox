# WDK Agent Payment Sandbox — application copy, not submitted

**Summary:** Security-focused WDK/x402 conformance and policy sandbox for agentic payments.

Autonomous agents need more than a successful payment demo: developers must verify that a malicious challenge, substituted recipient, repeated request or expired authorization cannot bypass payment policy. This project provides a working, reproducible local sandbox for testing those boundaries without real credentials, wallet funding or blockchain broadcasts.

The implementation uses official Tether WDK core/EVM packages and official x402 Foundation fetch/core/EVM/Express packages. A Policy Engine sits above payment execution, enforcing explicit intent, supervisor authorization, transaction/session/day limits, allowlists, duplicate/replay/expiry controls and dry-run. Agents receive structured tools rather than raw wallet write authority.

**Evidence:** 136/136 runtime tests pass, including a 34/34 strict signer-adapter subset. Tests cover allowed payments, hostile requirements, policy bypass attempts, substitutions, concurrent/repeated requests, malformed addresses/signatures and secret-bearing exceptions. Strict project TypeScript, build, lint, secret/material scans, dependency advisory checks and Windows clean-snapshot reproduction pass. Package identities, registry signatures and archive integrity are recorded. This is test evidence, not a formal audit or production security certification.

**Supported profile:** local/test WDK EVM, EOA, EIP-3009 and x402 v2 exact on chain 31337 with fixed simulated token/recipient/domain. Official cryptographic authorization verification runs; settlement is simulated. No mainnet, financial execution or complete x402 coverage is claimed. WDK remains beta. Windows is tested; Ubuntu CI is prepared but has not run externally.

**Developer value:** a reusable conformance and adversarial regression corpus that complements WDK examples/MCP/skills. During development it detected a direct published TypeScript signer discrepancy for the installed package pair: runtime EIP-3009 behavior passes, direct structural assignment fails. A validated composition adapter supports the project while a frozen fixture keeps the discrepancy visible. No upstream repair or acknowledgment is claimed.

**Deliverables:** accepted implementation; reviewed open-source release candidate; owner-authorized hosted Windows/Ubuntu evidence and concise upstream compatibility feedback; bounded supported-profile maintenance and developer-feedback fixes. GRANT-DELIVERABLES.md separates completed work from future funded outputs and defines objective acceptance tests.

**Open-source plan:** Apache-2.0 project source, separate third-party notices, pinned locks, external README, architecture/security documentation and secret-free CI. No Tether endorsement is implied. Publication has not occurred and requires owner approval.

**Maintenance, budget and timeline:** OWNER/PROJECT-LEAD DECISION REQUIRED. Three transparent internal prospective scenarios are prepared; no final requested amount is selected. Proposed rollout 2–4 weeks after authorization, followed by an approved maintenance option. No duration/SLA/24-hour support promise is made.

**Applicant/team/background/contact:** owner-supplied verified details required. Demonstrated evidence currently consists of the working local implementation and reproducible tests; no personal qualifications or prior public work are invented. Project/GitHub URLs remain pending authorized publication.

Current form mapping is partial: only the mandatory terms checkbox was observed before a legal-agreement gate. APPLICATION-FORM-PACKAGE.md labels all unobserved topics FORM FIELD UNVERIFIED. Owner must review eligibility/terms, select budget/maintenance, provide identity/contact/URLs and explicitly approve submission. This draft is not submitted.
