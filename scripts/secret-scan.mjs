import { readdirSync, readFileSync } from 'node:fs';
const ignored = new Set(['node_modules', '.git', '.npm-cache', '.npm-downloads', 'dist', 'reproduction', '.release-private', '.release-checkouts']);
const rules = [
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GitHub credential', /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}\b/],
  ['AWS access identifier', /\bAKIA[A-Z0-9]{16}\b/],
  ['assigned wallet secret', /(?:private[_-]?key|seed[_-]?phrase|mnemonic)\s*[=:]\s*["'][^"'\r\n]{20,}["']/i],
  ['hex key assignment', /(?:key|secret)\s*[=:]\s*["'](?:0x)?[a-fA-F0-9]{64}["']/i]
];
let files = 0;
let findings = 0;
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) { walk(path); continue; }
    if (!/\.(?:ts|mjs|json|md|yml|example|txt)$/.test(path) && entry.name !== '.npmrc') continue;
    files++;
    const contents = readFileSync(path, 'utf8');
    for (const [name, regex] of rules) if (regex.test(contents)) { findings++; console.error(`${path}: ${name} detected (value withheld)`); }
  }
}
walk('.');
console.log(JSON.stringify({ filesScanned: files, secretsFound: findings, status: findings ? 'FAIL' : 'PASS', limitations: 'Pattern-based source scan; not proof of absence of all secret forms.' }));
if (findings) process.exitCode = 1;
