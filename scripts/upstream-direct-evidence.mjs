import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const original = readFileSync('integrations/wdk/signer-compatibility.ts');
const fixture = readFileSync('integrations/wdk/upstream-direct-signer-compatibility.ts');
const digest = createHash('sha256').update(original).digest('hex');
if (!original.equals(fixture) || digest !== '0e92083aba8854982feacc03fa00fa0a9390d0478a2ff7b7f7dddce12c37cf49') throw new Error('Frozen direct fixture changed');
const r = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--skipLibCheck',
  '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2023', 'integrations/wdk/upstream-direct-signer-compatibility.ts'], { encoding: 'utf8' });
const output = `${r.stdout ?? ''}${r.stderr ?? ''}`;
mkdirSync('evidence/upstream-direct-compatibility', { recursive: true });
writeFileSync('evidence/upstream-direct-compatibility/current-diagnostic.txt', output);
const reproduced = r.status === 2 && output.includes('error TS2322') && output.includes("Type 'string' is not assignable to type '`0x${string}`'");
writeFileSync('evidence/upstream-direct-compatibility/current-result.json', JSON.stringify({ timestamp: new Date().toISOString(),
  exitCode: r.status, upstreamDirectTypescript: reproduced ? 'FAIL' : 'CHANGED_REVIEW_REQUIRED', expectedFailureReproduced: reproduced,
  fixtureSha256: digest }, null, 2));
console.log(reproduced ? 'UPSTREAM DIRECT TYPESCRIPT: FAIL (TS2322); frozen regression evidence reproduced.' : 'Upstream diagnostic changed: inspect evidence; no longer the frozen expected failure.');
if (!reproduced) process.exitCode = 1;
