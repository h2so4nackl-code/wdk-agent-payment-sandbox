import { readFile } from 'node:fs/promises';
import { createSandbox } from './sandbox.ts';
import { PaymentClient } from './x402.ts';
import { startResourceServer } from './server.mjs';

const policy = JSON.parse(await readFile(new URL('../config.example.json', import.meta.url), 'utf8'));
const sandbox = createSandbox({ policy });
const capability = sandbox.host.authorize();
const server = await startResourceServer(sandbox);
try {
  const address = await sandbox.agent.call({ operation: 'wallet.address' }, capability);
  const before = await sandbox.agent.call({ operation: 'wallet.balance' }, capability);
  const payment = await new PaymentClient(sandbox.agent, capability, server.resource).purchase();
  const after = await sandbox.agent.call({ operation: 'wallet.balance' }, capability);
  console.log(JSON.stringify({ mode: 'mock', address, before, payment, after, stats: sandbox.stats, realTransactionsSigned: 0 }, null, 2));
  console.log(sandbox.audit.jsonLines());
  if (!payment.ok) process.exitCode = 1;
} finally { await server.close(); sandbox.host.revoke(capability); }
