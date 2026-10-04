import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

if (!process.env.npm_execpath) throw new Error('Run via npm run evidence.');
mkdirSync('evidence', { recursive: true });
const checks = [
  ['verify', ['run', 'verify'], false],
  ['demo', ['run', 'demo'], false],
  ['wdk-conformance', ['run', 'test:wdk'], true],
  ['dependency-audit', ['audit', '--json', '--fetch-retries=0', '--fetch-timeout=15000'], true]
];
const results = [];
for (const [name, args, canBeUnverified] of checks) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { encoding: 'utf8', timeout: 60000 });
  writeFileSync(`evidence/${name}.txt`, `${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  const status = result.status === 0 ? 'PASS' : canBeUnverified ? 'UNVERIFIED' : 'FAIL';
  results.push({ name, command: `npm ${args.join(' ')}`, startedAt, completedAt: new Date().toISOString(), exitCode: result.status, status });
  console.log(`${name}: ${status} (exit ${result.status})`);
}
const manifest = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', '.git', '.npm-cache', '.npm-downloads', 'dist', 'reproduction', '.release-private', '.release-checkouts', 'evidence'].includes(entry.name)) continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) walk(path);
    else manifest.push({ path: path.slice(2), sha256: createHash('sha256').update(readFileSync(path)).digest('hex') });
  }
}
walk('.');
writeFileSync('evidence/source-manifest.json', JSON.stringify(manifest, null, 2));
writeFileSync('evidence/summary.json', JSON.stringify({ node: process.version, platform: process.platform, results, scope: 'Core source tests; WDK package conformance separate.', realFunds: 0, realTransactionsSigned: 0 }, null, 2));
if (results.some(result => result.status === 'FAIL')) process.exitCode = 1;
