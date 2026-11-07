import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const log = [];
function print(s) { log.push(s); console.log(s); }
print(`Node ${process.version}; ${process.platform}/${process.arch}`);
for (const name of ['@tetherto/wdk-wallet-evm', '@morpho-org/morpho-sdk', 'viem', 'ethers', 'typescript']) {
  const pkg = JSON.parse(readFileSync(new URL(`node_modules/${name}/package.json`, import.meta.url)));
  print(`${name} ${pkg.version}`);
}
const flags = ['--noEmit', '--strict', '--skipLibCheck', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2023', '--allowImportingTsExtensions'];
function run(args) {
  const p = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 60000 });
  assert.ifError(p.error);
  const output = (p.stdout + p.stderr).trim();
  if (output) print(output);
  return p;
}
assert.equal(run(['node_modules/typescript/bin/tsc', ...flags, 'consumer.mts']).status, 0);
print('PASS: signing-client adapter and Morpho consumer compile in strict TypeScript');
const negative = run(['node_modules/typescript/bin/tsc', ...flags, 'direct-negative.mts']);
assert.equal(negative.status, 2);
assert.match(negative.stdout, /TS2740/);
assert.match(negative.stdout, /TS2345/);
print('PASS: direct account/client and projection/toAccount boundaries retain expected TS2740 and TS2345');
assert.equal(run(['check.mts']).status, 0);
print('RESULT: PASS (2 compiler checks and 10 offline runtime groups)');
writeFileSync(new URL('RESULTS.log', import.meta.url), log.join('\n') + '\n');
const files = ['check.mts', 'adapter.mts', 'consumer.mts', 'direct-negative.mts', 'proposed-helper.mjs', 'proposed-helper.d.mts', 'run.mjs', 'package.json', 'package-lock.json'];
const hashes = Object.fromEntries(files.map(f => [f, createHash('sha256').update(readFileSync(new URL(f, import.meta.url))).digest('hex')]));
writeFileSync(new URL('SHA256SUMS.json', import.meta.url), JSON.stringify(hashes, null, 2) + '\n');
