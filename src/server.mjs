import { createServer } from 'node:http';
import { NETWORK } from './model.ts';
import { encode, makeIntent, parsePaymentHeader, requirement } from './x402.ts';

// Fault injection is explicitly host-controlled. No public endpoint changes configuration.
export async function startResourceServer(sandbox, options = {}) {
  const clock = options.clock ?? Date.now;
  const challenges = new Map();
  const capacity = options.capacity ?? 1000;
  let resource;
  const server = createServer({ maxHeaderSize: 20000 }, (request, response) => {
    response.setHeader('cache-control', 'no-store');
    const finish = (status, body) => { response.writeHead(status, { 'content-type': 'application/json' }); response.end(JSON.stringify(body)); };
    try {
      if (request.method !== 'GET' || request.url !== '/resource' || request.headers.host !== new URL(resource).host) return finish(404, { error: 'NOT_FOUND' });
      if (options.hang) return;
      if (options.redirect) { response.writeHead(302, { location: options.redirect }); return response.end(); }
      const header = request.headers['payment-signature'];
      if (!header) {
        for (const [id, intent] of challenges) if (intent.expiresAt <= clock()) challenges.delete(id);
        if (challenges.size >= capacity) return finish(503, { error: 'STATE_CAPACITY' });
        const intent = makeIntent(resource, clock(), options.intentChanges ?? {});
        challenges.set(intent.requestId, intent);
        const required = options.requirementTransform ? options.requirementTransform(requirement(intent)) : requirement(intent);
        response.setHeader('payment-required', encode(required));
        return finish(402, { error: 'PAYMENT_REQUIRED', sandbox: true });
      }
      const payment = parsePaymentHeader(header);
      const intent = challenges.get(payment.requestId);
      if (options.rejectVerification) { sandbox.verifier.reject(intent); return finish(403, { error: 'VERIFICATION_FAILED' }); }
      if (!intent || !sandbox.verifier.consume(payment.receipt, intent)) return finish(403, { error: 'VERIFICATION_FAILED' });
      challenges.delete(payment.requestId);
      const receipt = { success: true, network: NETWORK, transaction: payment.receipt, requestId: payment.requestId };
      response.setHeader('payment-response', encode(options.receiptTransform ? options.receiptTransform(receipt) : receipt));
      return finish(200, { data: 'local protected resource', requestId: payment.requestId });
    } catch { return finish(400, { error: 'MALFORMED' }); }
  });
  server.requestTimeout = 2500;
  server.headersTimeout = 2500;
  server.keepAliveTimeout = 1000;
  server.maxRequestsPerSocket = 100;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  resource = `http://127.0.0.1:${server.address().port}/resource`;
  return Object.freeze({
    resource,
    async close() {
      await new Promise((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); server.closeAllConnections(); });
    }
  });
}
