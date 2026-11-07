Thanks for the explanation — the docs fix makes sense. Following your point about other integrations, I checked an independent consumer: the community `@nktkas/hyperliquid` SDK (0.33.3), outside x402.

[Reproduction, pinned dependencies and executed output](https://github.com/h2so4nackl-code/wdk-agent-payment-sandbox/tree/7af109ea988ef2220743ebc2a44896a9bc7c73ff/research/hyperliquid-signer), using WDK beta.25, ethers 6.15.0 and TypeScript 5.9.3:

- A direct WDK account fails strict assignment to its local signing interface. A real `WalletAccountEvm` backed by an async test signer (`address === undefined`) is also rejected by its runtime dispatcher.
- This PR's projection type compiles as that interface, but the **original helper does not work unchanged**: Hyperliquid injects `types.EIP712Domain`, which makes the helper's ethers primary-type derivation fail.
- A fixture-only wrapper that checks/removes that injected domain declaration lets the projected WDK account sign and verify both a synthetic EIP-712 fixture and a standard testnet L1 cancel action offline. Altering the signed message fails verification.

The reproduction passed after a clean `npm ci --ignore-scripts`: two compiler checks and five runtime check groups. This is local interoperability evidence, not live Hyperliquid/hardware validation, an official integration, or evidence of existing user demand. Nothing was broadcast. Morpho is not included as tested evidence.

Would an async, generically named EIP-712 signer projection be worth discussing on this basis, with reviewed domain normalization and retained primary-type validation, or would you prefer keeping this in integration-specific adapters/docs? I'm leaving this PR closed and won't open a replacement without agreement on scope.
