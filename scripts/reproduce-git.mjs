import { spawnSync } from 'node:child_process';
import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
if (!process.env.npm_execpath) throw new Error('Run via npm run reproduce:git');
const root = realpathSync('.');
const revision = spawnSync('git', ['rev-parse', '--verify', 'HEAD'], { encoding: 'utf8' });
const commit = revision.stdout.trim();
if (revision.status !== 0 || !/^[a-f0-9]{40,64}$/.test(commit)) throw new Error('Committed Git snapshot required');
const target = resolve('.release-checkouts', `${commit.slice(0, 12)}-${Date.now()}`);
if (!target.startsWith(`${root}${sep}.release-checkouts${sep}`)) throw new Error('Unsafe checkout target');
mkdirSync(target, { recursive: true });
const archive = resolve(target, 'source.tar');
const archived = spawnSync('git', ['archive', '--format=tar', `--output=${archive}`, commit], { encoding: 'utf8' });
if (archived.status !== 0) throw new Error('Git archive failed');
const extracted = spawnSync('tar', ['-xf', archive, '-C', target], { encoding: 'utf8' });
if (extracted.status !== 0) throw new Error('Existing tar extraction unavailable');
const npm = args => [process.execPath, [process.env.npm_execpath, ...args]];
const cache = resolve('.npm-cache');
const commands = [
  npm(['ci', '--offline', '--ignore-scripts', '--no-audit', '--cache', cache]),
  npm(['ci', '--prefix', 'integrations/wdk', '--offline', '--ignore-scripts', '--omit=optional', '--no-audit', '--cache', cache]),
  npm(['test']), npm(['run', 'test:official']),
  [process.execPath, ['--test', 'integrations/wdk/signer-adapter.test.mjs']],
  ...['typecheck', 'typecheck:adapter', 'lint', 'build', 'scan:secrets', 'scan:test-material', 'demo'].map(name => npm(['run', name])),
  [process.execPath, ['scripts/upstream-direct-evidence.mjs']],
  [process.execPath, ['scripts/check-supply-chain.mjs']]
];
const results = [];
for (const [binary, args] of commands) {
  const r = spawnSync(binary, args, { cwd: target, encoding: 'utf8', timeout: 180000, maxBuffer: 4 * 1024 * 1024 });
  const sanitize = value => value.replaceAll(root, '<PROJECT_ROOT>').replaceAll(root.replaceAll('\\', '/'), '<PROJECT_ROOT>')
    .replaceAll(root.replaceAll('\\', '/').replaceAll(' ', '%20'), '<PROJECT_ROOT>');
  const output = sanitize(`${r.stdout ?? ''}${r.stderr ?? ''}`);
  const count = /(?:ℹ|#) tests (\d+)/.exec(output);
  const passed = /(?:ℹ|#) pass (\d+)/.exec(output);
  results.push({ command: sanitize([binary === process.execPath ? 'node' : binary, ...args].join(' ')), exitCode: r.status,
    ...(count ? { tests: Number(count[1]), passed: Number(passed?.[1] ?? 0) } : {}), output });
  console.log(JSON.stringify({ command: results.at(-1).command, exit: r.status, ...(count ? { tests: Number(count[1]) } : {}) }));
  if (r.status !== 0) break;
}
const success = results.length === commands.length && results.every(r => r.exitCode === 0);
mkdirSync('evidence/release', { recursive: true });
writeFileSync('evidence/release/committed-snapshot.json', JSON.stringify({ commit, timestamp: new Date().toISOString(), platform: process.platform,
  node: process.version, success, scope: 'Exact Git archive, no untracked source/dependencies copied; fresh locked offline installs from verified local cache.',
  results, realFunds: 0, broadcasts: 0, publicActions: 0 }, null, 2));
if (!success) process.exitCode = 1;
