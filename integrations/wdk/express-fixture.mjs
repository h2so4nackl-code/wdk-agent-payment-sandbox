import express from 'express';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { localFacilitator } from './local-facilitator.mjs';
import { TEST_ASSET, TEST_NETWORK, TEST_RECIPIENT, testRequirement } from './official.mjs';
export async function expressFixture() {
  const app = express(); app.disable('x-powered-by');
  let releases = 0;
  const local = localFacilitator(testRequirement('http://127.0.0.1:4021/resource'));
  const facilitator = { verify: local.verify, settle: local.settle, async getSupported() {
    return { kinds: [{ x402Version: 2, scheme: 'exact', network: TEST_NETWORK }], extensions: [], signers: { 'eip155:*': ['0x3333333333333333333333333333333333333333'] } };
  } };
  app.use(paymentMiddleware({ 'GET /resource': { accepts: [{ scheme: 'exact', network: TEST_NETWORK,
    payTo: TEST_RECIPIENT, maxTimeoutSeconds: 30,
    price: { amount: '100000', asset: TEST_ASSET, extra: { name: 'SandboxToken', version: '1', assetTransferMethod: 'eip3009' } }
  }], description: 'Local WDK conformance fixture', mimeType: 'application/json' } },
  new x402ResourceServer(facilitator).register(TEST_NETWORK, new ExactEvmScheme())));
  app.get('/resource', (_req, res) => { releases++; res.json({ data: 'official local conformance resource' }); });
  const server = await new Promise((resolve, reject) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); s.on('error', reject); });
  return { resource: `http://127.0.0.1:${server.address().port}/resource`, get stats() { return { ...local.stats, releases }; },
    close: () => new Promise((resolve, reject) => { server.close(e => e ? reject(e) : resolve()); server.closeAllConnections(); }) };
}
