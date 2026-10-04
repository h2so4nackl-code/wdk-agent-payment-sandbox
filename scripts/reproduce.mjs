import { spawnSync } from 'node:child_process';
import { mkdirSync, cpSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

if (!process.env.npm_execpath) throw new Error('Run via npm run reproduce.');
const target = resolve('reproduction', `run-${Date.now()}`);
const root = resolve('.');
if (!target.startsWith(`${root}\\reproduction\\`) && !target.startsWith(`${root}/reproduction/`)) throw new Error('Unsafe reproduction path');
mkdirSync(target, { recursive: true });
const excludes = new Set(['node_modules', '.git', '.npm-cache', '.npm-downloads', 'dist', 'reproduction', '.release-private', '.release-checkouts', 'evidence']);
for (const entry of readdirSync('.', { withFileTypes: true })) {
  if (!excludes.has(entry.name) && (entry.name === '.env.example' || !entry.name.startsWith('.env'))) {
    cpSync(entry.name, resolve(target, entry.name), {
      recursive: entry.isDirectory(), errorOnExist: true,
      filter: source => !excludes.has(basename(source)) && (basename(source) === '.env.example' || !basename(source).startsWith('.env'))
    });
  }
}
// Reuse the project-local npm cache, not node_modules or compiler binaries. Cache still verifies package integrity.
const commands = [
  ['ci', '--offline', '--ignore-scripts', '--no-audit', '--cache', resolve('.npm-cache')],
  ['run', 'verify'],
  ['run', 'demo']
];
const results = [];
mkdirSync('evidence', { recursive: true });
for (const args of commands) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd: target, encoding: 'utf8', timeout: 60000 });
  results.push({ command: `npm ${args.join(' ')}`, exitCode: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' });
  if (result.status !== 0) break;
}
const success = results.length === commands.length && results.every(result => result.exitCode === 0);
writeFileSync('evidence/reproduction.json', JSON.stringify({ target, scope: 'Fresh source copy + lockfile offline install from verified cache; not fresh online clone or optional WDK.', success, results }, null, 2));
console.log(JSON.stringify({ target, success, commandsCompleted: results.length }));
if (!success) process.exitCode = 1;
