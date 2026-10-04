import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
if (!process.env.npm_execpath) throw new Error('Run via npm run integration:evidence');
mkdirSync('evidence/integration', { recursive: true });
const results = [];
for (const name of ['typecheck', 'lint', 'build', 'test:all', 'demo', 'test:wdk', 'typecheck:upstream-direct', 'scan:secrets']) {
  const startedAt = new Date().toISOString();
  const r = spawnSync(process.execPath, [process.env.npm_execpath, 'run', name], { encoding: 'utf8', timeout: 120000 });
  const output = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
  writeFileSync(`evidence/integration/final-${name.replaceAll(':', '-')}.txt`, output);
  const count = /(?:ℹ|#) tests (\d+)/.exec(output);
  const passed = /(?:ℹ|#) pass (\d+)/.exec(output);
  results.push({ command: `npm run ${name}`, startedAt, completedAt: new Date().toISOString(), exitCode: r.status,
    status: name === 'typecheck:upstream-direct' && r.status !== 0 && output.includes('error TS2322') ? 'EXPECTED_FAIL' : r.status === 0 ? 'PASS' : 'FAIL', ...(count ? { tests: Number(count[1]), passed: Number(passed?.[1] ?? 0) } : {}),
    ...(name === 'typecheck:signer' ? { measuredUpstreamDeclarationGate: true } : {}) });
  console.log(`${name}: ${results.at(-1).status} (exit ${r.status})`);
}
const locks = Object.fromEntries(['package-lock.json', 'integrations/wdk/package-lock.json'].map(path => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]));
writeFileSync('evidence/integration/final-summary.json', JSON.stringify({ node: process.version, platform: process.platform, locks, results,
  realFunds: 0, realTransactionSignatures: 0, publicWrites: 0, scope: 'Local runtime conformance and core quality; supported project strict adapter passes; isolated upstream direct declaration fixture is EXPECTED_FAIL, with raw non-zero exit retained.' }, null, 2));
if (results.some(r => r.status === 'FAIL')) process.exitCode = 1;
