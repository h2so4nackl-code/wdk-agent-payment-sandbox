import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

// Optional offline bootstrap: copy ONLY the public compiler archive, never cache logs/credentials/other packages.
if (!process.env.npm_execpath || !process.argv[2]) throw new Error('Run npm run seed-cache -- <existing-npm-cache>.');
const requireNpm = createRequire(process.env.npm_execpath);
const cacache = requireNpm('cacache');
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const pkg = lock.packages['node_modules/typescript'];
const url = 'https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz';
if (pkg.version !== '5.9.3' || pkg.resolved !== url) throw new Error('Unexpected compiler provenance');
const key = `make-fetch-happen:request-cache:${url}`;
const cached = await cacache.get(resolve(process.argv[2], '_cacache'), key);
const integrity = `sha512-${createHash('sha512').update(cached.data).digest('base64')}`;
if (integrity !== pkg.integrity) throw new Error('Compiler archive integrity mismatch');
await cacache.put(resolve('.npm-cache', '_cacache'), key, cached.data, {
  integrity,
  // Explicit safe metadata, not copied source-cache request headers.
  metadata: { time: Date.now(), url, reqHeaders: {}, resHeaders: { 'content-type': 'application/octet-stream' }, options: { compress: true } }
});
console.log(JSON.stringify({ version: pkg.version, integrity, copiedPublicCompilerOnly: true }));
