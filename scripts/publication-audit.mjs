import { spawnSync } from 'node:child_process';
import { readFileSync, lstatSync } from 'node:fs';
import ts from 'typescript';
const mode = process.argv[2] === '--staged' ? ['--cached'] : [];
const inventory = spawnSync('git', ['ls-files', '-z', ...mode], { encoding: 'utf8' });
if (inventory.status !== 0) throw new Error('Local Git inventory required');
const files = inventory.stdout.split('\0').filter(Boolean);
if (!files.length) throw new Error('Empty publication inventory');
const findings = [];
const username = process.env.USERNAME;
for (const path of files) {
  if (/(^|\/)(node_modules|\.npm-cache|\.npm-downloads|reproduction|\.release-private|\.release-checkouts|dist)(\/|$)/.test(path)
    || /(^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith('.env.example')) findings.push({ path, reason: 'Excluded/generated/credential path staged' });
  if (!lstatSync(path).isFile()) { findings.push({ path, reason: 'Non-regular publication file' }); continue; }
  const staged = mode.length ? spawnSync('git', ['show', `:${path}`], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }) : undefined;
  if (staged && staged.status !== 0) throw new Error('Cannot read exact staged blob');
  const text = staged ? staged.stdout : readFileSync(path, 'utf8');
  let pathText = text;
  if (/\.(ts|mjs)$/.test(path)) {
    // Regex syntax such as a timestamp digit pattern is not a Windows drive path.
    const ast = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
    const ranges = [];
    function visit(node) { if (node.kind === ts.SyntaxKind.RegularExpressionLiteral) ranges.push([node.getStart(ast), node.end]); ts.forEachChild(node, visit); }
    visit(ast);
    for (const [start, end] of ranges.reverse()) pathText = pathText.slice(0, start) + ' '.repeat(end - start) + pathText.slice(end);
  }
  if (/\b[A-Za-z]:[\\/]|\/Users\/|\/home\/[A-Za-z0-9_-]+\//.test(pathText)) findings.push({ path, reason: 'Absolute machine-specific path' });
  // Match the actual account identifier, not coincidental substrings in public SRI base64.
  if (username && username.length > 3 && text.toLowerCase().split(/[^a-z0-9_-]+/).includes(username.toLowerCase())) findings.push({ path, reason: 'Local username (value withheld)' });
  if (/\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) findings.push({ path, reason: 'Credential pattern (value withheld)' });
}
console.log(JSON.stringify({ scope: mode.length ? 'Staged publication files' : 'Tracked publication files', files: files.length,
  status: findings.length ? 'FAIL' : 'PASS', findings, limitations: 'Privacy/credential/path heuristics plus manual publication review; not a formal security or ownership certification.' }, null, 2));
if (findings.length) process.exitCode = 1;
