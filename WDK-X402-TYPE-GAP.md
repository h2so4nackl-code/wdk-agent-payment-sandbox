# WDK/x402 declaration gap — 2026-10-04

Inspected the installed packages, not inferred from the guide: WDK core 1.0.0-beta.18, EVM 1.0.0-beta.20, x402 EVM 2.28.0, TypeScript 5.9.3. The isolated original fixture remains byte-for-byte unchanged (SHA256 0e92083aba8854982feacc03fa00fa0a9390d0478a2ff7b7f7dddce12c37cf49). First compiler diagnostic: TS2322 on address. This first diagnostic alone does not identify every subsequent member incompatibility; the table compares the actual declarations.

Declaration sources: **W** = integrations/wdk/node_modules/@tetherto/wdk-wallet-evm/types/src/{wallet-account-evm,wallet-account-read-only-evm}.d.ts; **X** = integrations/wdk/node_modules/@x402/evm/dist/esm/signer-CJuc15ii.d.mts (exported ClientEvmSigner). Exact archive hashes and repositories: [UPSTREAM-INTEGRATION.md](UPSTREAM-INTEGRATION.md), [lockfile](integrations/wdk/package-lock.json). Runtime source: WDK EVM src/wallet-account-evm.js in the same installed archive. [Official guide](https://docs.wdk.tether.io/ai/x402/) rechecked 2026-10-04. WDK remains beta.

| MEMBER | WDK TYPE | X402 TYPE | RUNTIME COMPATIBLE? | COMPILE COMPATIBLE? | ADAPTER ACTION |
|---|---|---|---|---|---|
| address (required) | inherited getter string | readonly 0x template string | YES, measured actual EVM address | NO; declaration width, first TS2322 | getAddress then exact 0x + 40 hex format guard; immutable narrowed getter after initialize |
| getAddress | Promise<string> | Not required | YES as initialization source | Not part of x402 contract | Host-only initialization; sanitize failures; no normalization |
| signTypedData input (required) | {domain: ethers.TypedDataDomain, types: Record<string, ethers.TypedDataField[]>, message: Record<string, unknown>} | {domain: Record<string, unknown>, types: Record<string, unknown>, primaryType: string, message: Record<string, unknown>} | YES for tested single EIP-3009 primary type | Shapes differ; arbitrary x402 records do not establish valid WDK field arrays | Exact descriptor/schema/type/value/domain validation; reconstruct explicit domain, six mutable WDK field entries, message; omit primaryType only after verifying the sole type |
| signTypedData output (required) | Promise<string> | Promise<0x template string> | YES; actual 65-byte EOA EIP-712 signature verifies | NO; declaration width | Require 0x, 130 hex characters and recovery byte 1b/1c; guard narrows without a cast |
| readContract (optional) | No matching public method in inspected account declarations | Optional address/abi/functionName/args -> Promise<unknown> | Not exercised | Optional absence permitted | Not exposed; extension enrichment unsupported |
| signTransaction (optional) | EvmTransaction requires value: number or bigint; to/data/gasLimit/fees/nonce/chainId mostly optional; Promise<string> | Requires to/data/nonce/gas/maxFeePerGas/maxPriorityFeePerGas/chainId; no value; Promise<0x template string> | Not established; argument semantics differ | NO for present raw WDK method: required value absent; gas vs gasLimit; broad result | Omitted entirely; gas sponsoring and transaction signing unsupported |
| getTransactionCount (optional) | No matching public method | Optional {address} -> Promise<number> | Not exercised | Optional absence permitted | Not exposed |
| estimateFeesPerGas (optional) | No matching public method with this signature | Optional () -> Promise<{maxFeePerGas: bigint, maxPriorityFeePerGas: bigint}> | Not exercised | Optional absence permitted | Not exposed |

Address/signature discrepancies are declaration-width mismatches with equivalent validated runtime representations in this profile. The typed-data record width requires real validation/conversion: not every possible x402 input is supported. Transaction method differences are potentially semantic; this project does not claim compatibility for that optional functionality. The adapter is a project boundary, not a patch to Tether. No declaration edits, unsafe signer assertions, unrestricted types or checking suppressions are used.

## Supported contract and lifecycle

WdkX402ClientSigner explicitly implements the installed ClientEvmSigner using a Pick of the two actual WDK account methods for composition/test doubles. Its constructor assignment compiles without casts in signer-adapter-compatibility.ts. await initialize() validates the asynchronously retrieved address before registering with x402. Reading address earlier fails closed. The signer exposes no transfer, approve, transaction-signing or broadcast method. Initialization is read-only.

signTypedData accepts only the fixed chain 31337 / SandboxToken v1 / fixed asset and recipient / TransferWithAuthorization EOA profile. Address validation is syntactic, accepts mixed-case hex, and does not claim EIP-55 checksum validation. Compact signatures, EIP-1271, Permit2, v1 and approval extensions are outside this profile. Expiry is checked before and after the async authorization gate. Input is copied into frozen policy data and separately constructed WDK field arrays; callback mutation cannot change signed semantics. Nonce reuse, concurrent signing and bounded state fail closed. Exceptions are fixed classified reasons; arbitrary SDK/policy error material is withheld. The host-only post-sign callback updates counters only, receives no material and is sanitized if it fails.

Default authorization denies. The product constructs its private signer with a callback that validates the current challenge and invokes the existing Policy Engine/capability/reservation gateway before the only WDK signTypedData call. A trusted host can deliberately instantiate test fixtures with an allow callback; this is not agent authority or process isolation. All writes exposed to agent tool callers remain gated. No broadcast capability exists.

## Independent results

- Supported project strict adapter: PASS (npm run typecheck:adapter and normal installed-profile typecheck).
- Supported local x402 profile: PASS (official fetch/core/EVM/Express flow, actual ECDSA verification, simulated settlement).
- Direct unmodified WDK runtime: PASS (retained direct-runtime fixture).
- Direct published TypeScript assignment: FAIL, TS2322, expected and isolated. npm run typecheck:upstream-direct preserves non-zero exit.

skipLibCheck is restricted to the optional compile configuration and negative fixture to avoid auditing internal third-party declaration bodies. strict and all inherited project checks remain enabled; library declarations are still used to check every project call and assignment. The normal offline core config is unchanged. npm run typecheck checks the adapter whenever the optional profile is installed; typecheck:adapter fails if it is missing. The direct failing fixtures are excluded by explicit positive include lists, never suppressed.
