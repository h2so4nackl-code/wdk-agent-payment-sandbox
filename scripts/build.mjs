import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve('.');
const output = resolve('dist');
if (dirname(output) !== root || (existsSync(output) && lstatSync(output).isSymbolicLink())) throw new Error('Unsafe build output path');
// The only removed tree is this project's generated dist, never source or an external/junction target.
if (existsSync(output)) rmSync(output, { recursive: true });

execFileSync(process.execPath, ['node_modules/typescript/bin/tsc'], { stdio: 'inherit' });
mkdirSync('dist', { recursive: true });
for (const name of ['server.mjs', 'demo.mjs']) {
  const source = readFileSync(`src/${name}`, 'utf8').replaceAll(".ts'", ".js'");
  writeFileSync(`dist/${name}`, source);
}
if (existsSync('integrations/wdk/node_modules/@x402/evm/package.json')) execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.wdk.json'], { stdio: 'inherit' });
console.log('Build complete: strict TypeScript and runtime entry points.');
