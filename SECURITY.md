# Security policy

Default mode is the original offline mock sandbox. Do not connect either mode to real funds, real wallet material, mainnet, public facilitators or broadcast APIs. Explicit optional `wdk-test` generates deterministic public test material and signs only a fixed local EIP-712 authorization domain (chain 31337, simulated contract/recipient). Its provider accepts only chain ID/balance reads and rejects every other RPC method. No configurable external provider/seed input or financial execution mode exists.

## Supported boundary

Treat agent commands, HTTP challenges and resource data as hostile. Trust the local supervisor process, its dependencies and its policy configuration. A malicious agent is a tool caller, not a co-resident process with arbitrary host code execution. Run untrusted agents separately and expose only the structured gateway; never hand them host.authorize, verifier, preparation callbacks or module execution privileges. Current MVP transport is an in-process interface, not a hardened remote MCP service.

## Controls

Exact schemas; atomic unit strings; explicit purchase intent; immutable snapshots; READ/WRITE classification; supervisor capabilities; per-transaction, session and daily limits; allowlists; hard-coded mock-only rails; preparation before execution; post-preparation revalidation; duplicate ID and nonce tracking; expiry and cancellation; bounded storage and messages; loopback numeric URL pinning; no redirects; one-use expected-intent receipt verification; projected logs; install scripts disabled.

Agent facades expose no raw account/transfer/approve/transaction-signing methods. Optional typed authorization validates exact schema/domain/types/from/to/value/expiry before original gateway policy reservation; fixture rails are mapped explicitly to the existing mock policy units only after fixed chain/token/recipient checks. Dry-run has zero ledger writes and test signatures; request/nonce/audit bookkeeping still occurs. No financial API is needed. Failed verification cannot refund a reservation or automatically authorize another payment. SDK spend controls stay enabled with a single fixed test asset and the same atomic cap.

## Limits

State is process-local and non-durable. Supervisor code can import the host-only test wallet factory or instantiate another sandbox; hostile executable agents require process isolation. Dependency folders are not an isolation mechanism. Once a bounded asynchronous operation reaches a cryptographic library, cancellation cannot prove erasure of all library temporaries; no broadcast capability exists here. Pattern scans and source review are not formal certification. Runtime upstream tests and online audits now pass; published direct TypeScript signer assignment still fails in an isolated upstream fixture. The supported project adapter passes strict compilation and runtime conformance; upstream direct failure remains visible without blocking the supported local profile. Test material is generated in memory, never serialized to results/audit/artifacts; disposal clears retained test material, without claiming complete process-memory erasure.

No public repository exists yet, so no supported external reporting channel is claimed. Share findings with the project owner for local triage; a private disclosure contact and supported release policy must be established before publication. No experience, security certification or upstream endorsement is asserted.

## Release gates

Full local tests, typecheck, lint, build and secret scan; successful official WDK profile installation/conformance; current advisory audit; review synthetic versus interoperable x402 claims; immutable dependency/provenance record; approved license/contact and applicant information. Never weaken a control for a test. Public publication and grant submission require the owner's approval.

## Typed signer invariants

WdkX402ClientSigner uses private composition and a default-deny authorization callback. It validates exactly 0x + 40 hex address characters (mixed case allowed, no checksum claim), fixed local EIP-3009 domain/type/message, uint256 bounds, payer/recipient, nonce and bounded expiry; validates 65-byte EOA signature encoding and recovery byte; offers no transaction/broadcast/approval capability. Initialization and SDK/policy exceptions are sanitized. It snapshots policy and signing inputs separately, consumes failed signing nonces conservatively, denies simultaneous invocations and rechecks expiry after asynchronous policy. Trusted post-sign instrumentation gets no material. The only production WDK signing site is inside this boundary, after the original policy gateway reserves the request.

An allow callback in a host-only compatibility test is intentional trusted-host authority. Tool callers never obtain the adapter, callback or raw WDK account. The retained direct upstream reproduction is a type regression artifact, not an unsafe production path or a vulnerability allegation. The supported profile is local EOA EIP-3009 only; broader upstream protocol support is not a project claim.

The optional scan:test-material quality command reconstructs only the public deterministic test fixture and searches its exact seed/key hex in source and retained evidence. Values are never emitted. This strengthens artifact checks beyond general credential patterns; unknown encodings and process memory remain outside the guarantee.
