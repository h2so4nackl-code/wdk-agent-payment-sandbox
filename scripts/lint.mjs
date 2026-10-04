import ts from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// Project-local dependency-minimal AST lint. Rules and scope are explicit; this is not ESLint.
let errors = 0;
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory() && ['node_modules', '.git', 'dist', '.npm-cache'].includes(entry.name)) continue;
    if (entry.isDirectory()) { walk(path); continue; }
    if (!/\.(ts|mjs)$/.test(path)) continue;
    const source = readFileSync(path, 'utf8');
    if (path.endsWith('.mjs')) execFileSync(process.execPath, ['--check', path]);
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, path.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS);
    const report = rule => { console.error(`${path}: ${rule}`); errors++; };
    function visit(node) {
      if (node.kind === ts.SyntaxKind.AnyKeyword) report('explicit any is forbidden');
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'eval') report('eval forbidden');
      if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'Function') report('dynamic Function forbidden');
      if (node.kind === ts.SyntaxKind.DebuggerStatement) report('debugger forbidden');
      ts.forEachChild(node, visit);
    }
    visit(ast);
    if (/@ts-(ignore|nocheck)/.test(source)) report('type checking suppression forbidden');
    if (/[\t ]+$/m.test(source)) report('trailing whitespace forbidden');
  }
}
for (const directory of ['src', 'tests', 'scripts', 'integrations']) walk(directory);
if (errors) process.exitCode = 1;
else console.log('AST lint PASS: no explicit any, eval, dynamic Function, debugger, type suppressions or trailing whitespace; JS syntax checked.');
