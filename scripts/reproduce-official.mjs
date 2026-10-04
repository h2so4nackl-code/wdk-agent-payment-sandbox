import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
if (!process.env.npm_execpath) throw new Error('Run via npm run reproduce:official');
const root = realpathSync('.');
const data = JSON.parse(readFileSync('evidence/reproduction.json', 'utf8'));
const target = realpathSync(data.target);
if (!data.success || !target.startsWith(`${root}${sep}reproduction${sep}`)) throw new Error('Verified fresh core reproduction required');
const commands = [
  ['ci', '--prefix', 'integrations/wdk', '--offline', '--ignore-scripts', '--omit=optional', '--no-audit', '--cache', resolve('.npm-cache')],
  ['run', 'test:official'], ['run', 'test:wdk'], ['run', 'typecheck'], ['run', 'lint'], ['run', 'build'], ['run', 'scan:secrets']
];
const results = [];
for (const args of commands) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd: target, encoding: 'utf8', timeout: 180000 });
  results.push({ command: `npm ${args.join(' ')}`, exitCode: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' });
  if (result.status !== 0) break;
}
const success = results.length === commands.length && results.every(r => r.exitCode === 0);
writeFileSync('evidence/integration/reproduction-official.json', JSON.stringify({ target, success, scope: 'Fresh root source+lock install followed by fresh locked official profile install and runtime conformance; no internet/RPC/funds.', results }, null, 2));
console.log(JSON.stringify({ success, commandsCompleted: results.length }));
if (!success) process.exitCode = 1;
