import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readdirSync, readFileSync } from 'node:fs';
const require = createRequire(new URL('../integrations/wdk/package.json', import.meta.url));
const { HDNodeWallet } = require('ethers');
// Reconstruct public deterministic test material only; never emit the derived values.
const material = createHash('sha512').update('WDK sandbox public deterministic test fixture v1').digest();
const derived = HDNodeWallet.fromSeed(material).derivePath("m/44'/60'/0'/0/0");
const patterns = [material.toString('hex'), derived.privateKey.toLowerCase(), derived.privateKey.slice(2).toLowerCase()];
const ignored = new Set(['node_modules', '.git', '.npm-cache', '.npm-downloads', 'dist', 'reproduction', '.release-private', '.release-checkouts']);
let files = 0; let findings = 0;
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) { walk(path); continue; }
    if (!/\.(?:ts|mjs|json|md|yml|example|txt)$/.test(path)) continue;
    files++;
    const text = readFileSync(path, 'utf8').toLowerCase();
    if (patterns.some(pattern => text.includes(pattern))) { findings++; console.error(`${path}: generated fixture material detected (value withheld)`); }
  }
}
try { walk('.'); } finally { material.fill(0); }
console.log(JSON.stringify({ filesScanned: files, generatedMaterialLeaks: findings, status: findings ? 'FAIL' : 'PASS',
  scope: 'Source and retained evidence/artifacts; known deterministic test seed/private-key hex only, not unknown encodings or process memory.' }));
if (findings) process.exitCode = 1;
