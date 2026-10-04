# Threat model

Assets: policy integrity, mock budgets, one-use receipts, audit confidentiality and reproducible evidence. Trust boundaries: hostile tool caller → trusted supervisor/gateway; hostile HTTP server → bounded payment parser; official dependency → local execution; expected challenge → receipt verification. No real monetary assets or real credentials are present. The optional fixture derives deterministic public test-only signing material in memory.

| THREAT | IMPACT | MITIGATION | RESIDUAL RISK | TEST COVERAGE |
|---|---|---|---|---|
| Malicious AI agent | Unapproved spending | Exact operations, supervisor capability, all writes through gateway | Arbitrary host code can create another sandbox; separate process required for hostile executable agents | unauthorized agent cannot write; malformed command matrix |
| Prompt injection | Converts resource text into payment command | Explicit purchase intent; fixed resource payload; no instruction execution; caps and allowlists | Supervisor can intentionally authorize a bounded purchase from misleading agent intent | prompt injection intent; arbitrary metadata; limits |
| Recipient substitution | Diverts payment | Recipient allowlist and preparation equality; verifier binds expected intent | Host configuration compromise | recipient allowlist; preparation recipient substitution |
| Amount substitution | Excessive debit | Canonical integer amount, immutable snapshot, caps | Real asset valuation/fees not modeled | per transaction; preparation amount; input mutation |
| Replay | Reuses authorization | Nonce retained; deadline; expected-intent one-use receipt | State reset on process restart; no cross-process persistence | nonce replay; receipt expiry; HTTP replay |
| Duplicate payment / concurrency | Retry storm or race exceeds budgets | ID tracking; synchronous reservation; conservative failure accounting | Different approved requests can exhaust configured budget | concurrent duplicate; concurrent distinct payments |
| Malicious x402 server | Fake offer, redirect, huge response, forged verification | Single strict synthetic offer, pinned loopback URL, no redirects, body/header size caps, exact receipt binding | Server can deny resource after mock debit; no fair-exchange guarantee | hostile requirement matrix; forged settlement; verification failure |
| Compromised dependency | Executes malicious host code | Minimal core deps, pinned compiler, disabled hooks, optional SDK has a separate dependency directory | Directory separation is not process isolation; disabled hooks do not stop malicious runtime imports; current online advisory audits pass with zero returned vulnerabilities | lock/signature inspection; executed online npm audits; optional upstream conformance gate |
| Secret leakage | Exposes credentials | No wallet secret input; public fixture address; raw exceptions suppressed | Host-injected provider/callback could be malicious; none installed by default | failed preparation error; wallet error sanitization |
| Logging leakage | Logs secret-like attacker content | Fixed enums and safe projection; unknown identifiers masked; local audit UUIDs | Allowed numeric amounts/timestamps are still observability data | audit projection; attacker identifiers; credential omission |
| Policy bypass | Debit before approval | Private ledger mutation after evaluate/prepare/reserve; no agent authorize operation | Arbitrary supervisor code is trusted | unauthorized write; capability revocation during prepare |
| Malformed transaction data | Parser confusion or arithmetic error | Exact keys, plain JSON objects, rejects accessors, numbers/floats/huge strings and extra fields | Native JS Proxy inputs are host-code objects; JSON transport only for hostile callers | malformed intent matrix; accessor command |
| Unsupported chain/token/contract | Unintended real transaction | Runtime and config limited to one synthetic network/asset/contract; deny unknown | No claim of real-chain readiness | network/token/unknown contract; unsafe config |
| User configuration mistake | Accidentally enables money movement | Validated mode, externalSpendLimit exactly zero; no env-based overrides | Mistaken expectation that mock USDT0 is real USD₮0 | mainnet config rejected; zero budget |
| Timeout / cancellation | Late payment after caller gives up | Absolute expiry recheck, bounded preparation, caller abort propagation | Once synchronous mock debit occurred, cancellation cannot undo it | timeout late callback; caller abort; HTTP cancellation |
| State exhaustion | Memory growth or replay-record eviction | Bounded maps; new requests denied instead of removing replay records | Deliberate exhaustion causes safe denial of service; audit ring evicts oldest events | state capacity; server challenge cap; audit ring |
| Clock manipulation | Resets daily budgets or revives requests | UTC day calculation, rollback rejection after reservation, deadline checks | Trusted host clock can advance; durable trusted-time design needed before real funds | daily rollover; clock rollback; expiry |

Financial deployment remains out of scope. A future version must add durable reservations/reconciliation, authenticated process isolation, independent dependency review and fee accounting before financial signing is considered. Optional local EIP-712 test authorization does not enable any financial mode.

## Official integration additions — 2026-10-04

| Threat | Impact | Mitigation | Residual risk | Test coverage |
|---|---|---|---|---|
| Automatic x402 signing/approval before policy | Uncontrolled authorization | Private address/signTypedData projection; original gateway reservation before WDK call; fixed exact/EIP-3009 profile; SDK spend controls remain enabled | Host supervisor/imports trusted; no executable-agent isolation | Direct writes denied; Permit2 denied; caps/session/day/dry-run/revocation |
| Chain/token/domain substitution | Signature usable on unintended rail | Chain 31337, simulated token/recipient/name/version/types/value fixed; all non-read RPC rejected | Test key is deliberately public/reproducible; never use with funds or a funded chain | Mainnet/network/token/recipient/domain deny |
| Generated material leaking via SDK exception | Test secret in logs/artifacts; unsafe template for real credentials | Sanitized initialization/sign errors; facade has no raw account; no material serialization; disposal clears fixture material | Complete process memory erasure not proven; dependencies remain trusted | Derived test-key snapshot absence; injected signing error containing generated material |
| Library retry/nonce reuse | Multiple authorizations/settlements | Canonical challenge hash reservation plus nonce tracking; simulated contract consumed-nonce set | Identical terms conservatively denied even for an intended second purchase; process restart resets state | Duplicate library retry, baseline concurrent/replay cases |
| Malicious 200/settlement echo | False perception of payment verification | Require prior authorized signature and bounded valid receipt fields; honest Express fixture verifies before response | Seller-controlled receipt cannot independently prove chain settlement or fair exchange | Unpaid 200 rejected; verification/simulation failure |
| Dependency/native supply chain | Host compromise | Exact names/versions/SRI lock, six registry signatures checked, online npm audits, lifecycle scripts disabled | Native instruction/build provenance not exhaustively reviewed; SLSA chains UNVERIFIED | Integrity acquisition, supply-chain checker, actual audit reports |
| Declaration mismatch | Unsafe cast conceals API incompatibility | Direct no-cast TypeScript fixture retains FAIL; supported project composition adapter compiles strictly; runtime profiles tested independently | Published broad address/signature types differ from x402 contract | typecheck:upstream-direct TS2322; positive adapter compile and runtime tests PASS |

The previous Codex Security scan belongs to the baseline snapshot. These additions have executable adversarial coverage and local source review, not a new independent full security certification.

## Overview and effective resources

The intended product is a local conformance/test harness, not financial infrastructure. Default startup uses mock policy/ledger, loopback server and synthetic receipts. Explicit official startup uses generated test material, actual WDK core/EVM and x402 reference packages, with in-memory chain reads/settlement. Policy and host authority precede signing. Source-backed review follows user context: dependencies/host code trusted; hostile agents have structured tool calls only.

| Component | Source and established boundary |
|---|---|
| Gateway/host capabilities | src/sandbox.ts:68 checks commands/capabilities; :89 rechecks after preparation; :91 reserves; :102 private mock debit |
| Budget/replay engine | src/policy.ts:59 duplicate check; :69 reservation; :72 dry-run handling |
| Strict WDK signer | integrations/wdk/wdk-x402-client-signer.ts:42 converts exact local data; :88 composition constructor; :113 async gate; :123 only product WDK signTypedData call |
| Official facade | integrations/wdk/official.mjs:67 constructs private signer; :75 policy call; :81 SDK spend controls; :148 returned facade lacks raw wallet |
| Provider and material | integrations/wdk/test-wallet.mjs:7 fixed read-only provider; :13 generated public fixture; :17 disposal |
| Honest local verifier | integrations/wdk/local-facilitator.mjs:19 simulated contract verification; :28 local state write; :33 sendTransaction denied |

| Deployment or workflow | Resource or capability | Configuration and precedence | Safe effective value or location | Readers/writers/recipients | Enforcing control | Evidence/unknowns |
|---|---|---|---|---|---|---|
| Default and official gateway | Private mock balance/budgets/receipts | options.policy validated before factory; read adapter does not replace ledger | sandbox:local / mock:USDT0, internal synthetic state | Host supervisor and granted tool caller | Exact intent/capability, immutable preparation, atomic reserve | src/model.ts:1; src/policy.ts:17; src/sandbox.ts:21 |
| Official test mode | Local EIP-3009 signature | Fixed fixture factory; no agent provider/material overrides | chain 31337, simulated token/recipient; generated material retained in memory until dispose | Trusted WDK and private signer; client gets address/signature only | Runtime profile validation, policy reservation, RPC write denial | test-wallet.mjs:7, :13; adapter :45, :64; official.mjs:75 |
| HTTP purchase | Payment requirements/resource response | Host supplies transport; resource parsed and pinned | numeric 127.0.0.1 GET /resource, explicit port, no redirects/query/credentials | Host-selected fixture seller and authorized caller | Exact requirement schema, 16384-character headers, prior valid signature | src/model.ts:89; official.mjs:113, :119, :133; successful body is not bounded by facade |
| Facilitator fixture | Verification and synthetic settlement | Official scheme invokes in-memory contract functions | Local consumed-nonce set and synthetic receipt | Honest fixture server/client | Actual ECDSA and SDK verification; synthetic write only | local-facilitator.mjs:19, :28, :33; no independent proof of malicious seller settlement |
| Developer install/CI | Package/native host code execution | Locked core and optional manifests, ignore-scripts | Project-local deps; prepared Windows/Ubuntu workflow | Trusted developer/CI host | SRI, public registry signatures, hooks disabled | Lock/audit evidence; native provenance not fully proven; hosted CI unexecuted |

## Trust boundaries and assumptions

Assets include capability integrity, budgets/replay state, exact signed intent, audit confidentiality and reproducible regression evidence. Agents may alter commands/challenges, replay requests or exhaust bounded state; they cannot mint host capabilities, import raw accounts through the facade, supply material/providers or enable mainnet configuration. An arbitrary executable in the supervisor process has host authority and is outside this boundary. The host must expose only structured calls.

The adapter owns address/schema/signature validation, local profile restriction, frozen policy snapshot and distinct WDK type arrays, default denial, post-authorization expiry check, concurrent-call denial and bounded nonce history. The original policy owns per-tx/session/day limits, capability revocation and cross-call replay. Official mode constructs a fresh signer per client; its private nonce set is not persistent session protection. SDK spend controls additionally restrict the single simulated asset/cap. Type safety is a developer contract; runtime policy is the payment authorization boundary.

A trusted host-only success callback receives no sensitive data and updates counters. A test can intentionally provide an allow authorization callback to isolate cryptographic compatibility; this is not an exposed agent path. The direct raw runtime fixture is likewise a host-only test. A seller echo does not prove honest economic settlement: the honest local facilitator performs actual cryptographic verification before simulated settlement/resource release. No process isolation, durable state, full memory erasure, financial signing or hosted platform execution is claimed.

## Adapter attacker stories and mitigations

These are threat scenarios with executable checks, not newly claimed vulnerabilities.

| Priority | Scenario/capability gain | Prerequisites | Impact | Existing controls / mitigation | Evidence/test |
|---|---|---|---|---|---|
| High within sandbox | Library signs before budget approval | Agent controls challenge, lacks policy authority | Unapproved test authorization | Default-deny callback, original gateway reservation before WDK; no optional transaction methods | adapter :113, :123; original official cap/recipient/asset/network/unauthorized/dry-run tests |
| High within sandbox | Typed data changes after policy validates | Caller mutates input while await runs | Wrong signed payer/value/domain | Explicit conversion and frozen snapshots; separate WDK field arrays; exact from/to/domain/value | adapter :70–:79; explicit conversion, schema/accessor/substitution tests |
| Medium | Retry/concurrent/late authorization | Valid test request reused or async gate delayed | Duplicate/expired signature | In-flight lock, consumed nonce, post-gate expiry; original persistent-within-process request reservations | adapter :105–:126; concurrency/replay/post-policy expiry tests |
| Medium | Invalid WDK output accepted as valid signer | Trusted SDK regression or injected test double | Invalid address/signature propagated | Exact address/65-byte EOA guards; fixed sanitation | adapter :19, :22, :95, :124; address and malformed signature/facade tests |
| Medium | Secret-bearing upstream exception leaks | SDK/host callback throws sensitive content | Unsafe logs/artifacts | Initialization, gate and signing errors projected to fixed reasons | adapter :94, :114–:123; injected generated-material tests |
| Low | Declaration discrepancy concealed by cast | Developer integrates incompatible public declarations | Undetected API drift | Explicit supported compile fixture, unmodified separate expected-failure fixture | signer-adapter-compatibility.ts:4; upstream-direct-signer-compatibility.ts:4; diagnostic/hash helper |

## Severity calibration

Critical: actual unauthorized real financial execution or real secret compromise would be critical in a funded deployment, but this sandbox has neither real funds nor credential input/broadcast surface; such a finding needs additional established prerequisites. High: a demonstrated bypass that signs a disallowed local intent or defeats the centralized caps is high impact on the harness security contract even without real money. Medium: reproducible leakage of generated test material, replay outside intended controls, or bounded resource-denial defects may undermine the reference architecture; real impact must be shown. Low: declaration/documentation drift with intact runtime policy is a compatibility issue, not evidence of exploitable financial compromise. Host callback/module execution by a trusted supervisor is expected authority, not an agent privilege gain. Unknown native build provenance remains an explicit uncertainty rather than a fabricated vulnerability.

A fresh independent read-only architecture pass checked these boundaries and identified stale credential/audit wording, which was corrected. It found no concrete source-established policy bypass or broadcast path in the inspected scope. This architecture review and automated tests do not constitute a complete new repository security audit. Source anchors were checked against the current files; upstream direct failure and adapter success remain independent evidence.
