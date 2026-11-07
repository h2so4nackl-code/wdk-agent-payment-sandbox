import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const log=[];
function print(s){log.push(s);console.log(s);}
print(`Node ${process.version}; ${process.platform}/${process.arch}`);
for(const p of ['@tetherto/wdk-wallet-evm','@x402/evm','@nktkas/hyperliquid','@morpho-org/morpho-sdk','viem','ethers','typescript']){
 const pkg=JSON.parse(readFileSync(new URL(`node_modules/${p}/package.json`,import.meta.url))); print(`${p} ${pkg.version}`);
}
function run(args){ const p=spawnSync(process.execPath,args,{cwd:new URL('.',import.meta.url),encoding:'utf8',timeout:60000}); assert.ifError(p.error);const out=(p.stdout+p.stderr).trim();if(out)print(out);assert.equal(p.status,0);return out; }
run(['node_modules/typescript/bin/tsc','--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2023','--allowImportingTsExtensions','consumer.mts']);
print('PASS: strict TypeScript core, viem wrapper and all three consumer interfaces');
const result=run(['--test','--test-reporter=tap','test.mts']);assert.match(result,/# pass 20/);assert.match(result,/# fail 0/);
print('RESULT: PASS; strict compiler check + 20 Node tests; local offline evidence only');
writeFileSync(new URL('RESULTS.log',import.meta.url),log.join('\n')+'\n');
const files=['core.mts','viem-client.mts','consumer.mts','test.mts','run.mjs','package.json','package-lock.json'];
writeFileSync(new URL('SHA256SUMS.json',import.meta.url),JSON.stringify(Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(new URL(f,import.meta.url))).digest('hex')])),null,2)+'\n');
