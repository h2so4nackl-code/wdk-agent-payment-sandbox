// Operator-only public registry acquisition. No dependency lifecycle scripts execute.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
if (!process.env.npm_execpath) throw new Error('Run via npm run acquire:upstream.');
const requireNpm = createRequire(process.env.npm_execpath);
const cacache = requireNpm('cacache');
const semver = requireNpm('semver');
const root = resolve('.');
mkdirSync('.npm-downloads', { recursive: true });
const visited = new Set();
const metadata = new Map();
const inventory = [];
function download(url) {
  if (!url.startsWith('https://registry.npmjs.org/')) throw new Error('Registry origin denied');
  const file = resolve('.npm-downloads', createHash('sha256').update(url).digest('hex'));
  if (!existsSync(file)) {
    const quote = value => `'${value.replaceAll("'", "''")}'`;
    const helper = readFileSync('scripts/registry-read.ps1', 'utf8').split('\n').slice(1).join('\n').replaceAll('$PSScriptRoot', quote(resolve('scripts')));
    const command = `$Uri=${quote(url)}; $OutFile=${quote(file)};\n${helper}`;
    const result = spawnSync('pwsh.exe', ['-NoProfile', '-EncodedCommand', Buffer.from(command, 'utf16le').toString('base64')], { encoding: 'utf8', timeout: 40000 });
    if (result.status !== 0) {
      rmSync(file, { force: true });
      console.error(url, result.stderr.slice(-1500));
      throw new Error('Public registry transport failed');
    }
  }
  return readFileSync(file);
}
async function cache(url, bytes, integrity) {
  await cacache.put(resolve('.npm-cache/_cacache'), `make-fetch-happen:request-cache:${url}`, bytes, {
    ...(integrity ? { integrity } : {}), metadata: { time: Date.now(), url, reqHeaders: { accept: integrity ? '*/*' : 'application/json' }, resHeaders: { 'content-type': integrity ? 'application/octet-stream' : 'application/json', 'cache-control': 'public, max-age=31536000', date: new Date().toUTCString() }, options: { compress: true } }
  });
}
async function acquire(name, range) {
  if (!/^(@[a-z0-9-]+\/)?[a-z0-9._-]+$/.test(name)) throw new Error('Invalid public package name');
  let pack = metadata.get(name);
  if (!pack) {
    const url = `https://registry.npmjs.org/${name.replace('/', '%2f')}`;
    const bytes = download(url); pack = JSON.parse(bytes);
    if (pack.name !== name) throw new Error('Package identity mismatch');
    metadata.set(name, pack); await cache(url, bytes);
  }
  const latest = pack['dist-tags'].latest;
  const version = semver.satisfies(latest, range) ? latest : semver.maxSatisfying(Object.keys(pack.versions), range);
  if (!version) throw new Error(`Unresolved range for ${name}`);
  const id = `${name}@${version}`;
  if (visited.has(id)) return;
  visited.add(id);
  const manifest = pack.versions[version];
  if (!manifest.dist.integrity?.startsWith('sha512-')) throw new Error('Missing SHA512 integrity');
  const bytes = download(manifest.dist.tarball);
  await cache(manifest.dist.tarball, bytes, manifest.dist.integrity);
  inventory.push({ name, version, repository: manifest.repository, license: manifest.license, deprecated: manifest.deprecated ?? null, scripts: manifest.scripts ?? {}, integrity: manifest.dist.integrity, tarball: manifest.dist.tarball, attestations: manifest.dist.attestations ?? null });
  writeFileSync('evidence/integration/acquisition-inventory.json', JSON.stringify(inventory, null, 2));
  console.log(id);
  for (const [dependency, requested] of Object.entries(manifest.dependencies ?? {})) await acquire(dependency, requested);
  for (const [dependency, requested] of Object.entries(manifest.peerDependencies ?? {})) {
    if (!manifest.peerDependenciesMeta?.[dependency]?.optional) await acquire(dependency, requested);
  }
}
const deps = JSON.parse(readFileSync('integrations/wdk/package.json', 'utf8')).dependencies;
for (const [name, range] of Object.entries(deps)) await acquire(name, range);
writeFileSync('evidence/integration/acquisition-inventory.json', JSON.stringify(inventory, null, 2));
console.log(`Verified ${inventory.length} public package archives into project-local cache at ${root}`);
