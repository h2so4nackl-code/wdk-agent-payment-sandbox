# Novelty audit

Classification: **PARTIALLY_DUPLICATED**. Checked 2026-10-03; source URLs and transport limits in RESEARCH.md.

Updated 2026-10-04: the installed WDK core beta.18 already includes registerPolicy/governed account APIs, and official x402 core 2.28.0 includes spend controls. This strengthens the duplication finding for generic payment governors. Reuse official client/wallet functionality and retain the differentiator: security-focused conformance/testing sandbox with hostile inputs, local simulated settlement and measured declaration drift. [Pinned WDK core source](https://github.com/tetherto/wdk/tree/a112c38a9a2bdcf4525961812a712591d1470118), [installed x402 client source](integrations/wdk/node_modules/@x402/core/dist/esm/client/index.mjs), [integration record](UPSTREAM-INTEGRATION.md).

| Comparator | Overlap | Design response |
|---|---|---|
| Official WDK SDK/examples | Wallet reads, signing, policies and x402 integration | Reuse official wallet/cryptography/orchestration; test exact policy boundary and declaration/runtime compatibility |
| WDK MCP Toolkit | Agent tools, read/write distinction, confirmation | A strict agent interface is sufficient for MVP; future MCP tools must route through the same gateway, never register upstream broadcast tools directly |
| WDK Agent Skills | Agent instructions and security guidance | Make executable tests the differentiator; prompt instructions alone cannot enforce limits |
| SemanticPay demo | WDK plus USD₮0 x402 | Reuse API contracts; replace settlement with explicit synthetic scheme |
| nirholas/x402-agent-wallet | Policy budgets and merchant caps | Do not claim a novel governor; add WDK read conformance and deterministic adversarial corpus |
| Omnivalent/x402-agent-pay, xenarch-ai/x402-agent | Agent payer, budgets | Separate signed payment safety from credential-free local reproduction |
| Agents.KT, forage | Agent payments and allowlists | Provide narrowly scoped TypeScript harness with substitution/replay/concurrency tests |

Proposed differentiation: **a security-focused conformance and testing sandbox for agentic WDK payments**. Measurable contribution: version-pinned adapter conformance, credential-free loopback demo, fail-closed schemas, atomic budget reservations, replay binding, hostile server fixtures and documented threat-to-test mapping. This is a differentiated combination, not a claim that policy controls or x402 are new.

No complete equivalent established in reviewed sources; full GitHub code search coverage and competitor runtime validation are UNVERIFIED. Recheck before public grant submission. Keep objective; narrow claims, and make real-chain interoperability a separately reviewed future milestone.

## Measured integration differentiator — 2026-10-04

This is a security-focused WDK/x402 agent-payment sandbox and conformance harness validating policy enforcement, protocol behavior, dependency integrity and compatibility before autonomous payments. During implementation it detected an actual discrepancy between documented direct signer usage and published TypeScript declarations: raw runtime EIP-3009 verification succeeds, direct structural assignment fails TS2322. A small strict validated composition adapter supports our project while the unchanged upstream failing fixture remains reproducible. This finding is not claimed as acknowledged by Tether; an issue draft is prepared but not submitted. The adapter is project integration code, not a fix to Tether. This evidence strengthens the conformance-harness differentiator; it does not make wallet/policy/payment primitives novel.
