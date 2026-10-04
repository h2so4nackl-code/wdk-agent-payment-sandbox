import { createPublicKey, verify } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const keys = JSON.parse(readFileSync('evidence/public/registry/registry-signing-keys.json', 'utf8')).keys;
const packages = [];
for (const file of readdirSync('evidence/public/registry').filter(f => f.endsWith('-metadata.json'))) {
  const m = JSON.parse(readFileSync(`evidence/public/registry/${file}`, 'utf8'));
  const expected = m.name.startsWith('@tetherto/') ? `github.com/tetherto/${m.name.split('/')[1]}` : 'github.com/x402-foundation/x402';
  const repo = typeof m.repository === 'string' ? m.repository : m.repository.url;
  const signatures = m.dist.signatures.map(s => {
    const key = keys.find(k => k.keyid === s.keyid);
    return Boolean(key && verify('sha256', Buffer.from(`${m.name}@${m.version}:${m.dist.integrity}`), createPublicKey({ key: Buffer.from(key.key, 'base64'), format: 'der', type: 'spki' }), Buffer.from(s.sig, 'base64')));
  });
  const identity = repo.replace(/^git\+/, '').replace(/^git:\/\//, 'https://').replace(/\.git$/, '') === `https://${expected}`;
  packages.push({ name: m.name, version: m.version, repository: repo, identity, integrity: m.dist.integrity, registrySignatureValid: signatures.some(Boolean), attestationsAvailable: Boolean(m.dist.attestations), provenanceVerified: false, installScripts: ['preinstall','install','postinstall'].filter(k => m.scripts?.[k]) });
}
writeFileSync('evidence/integration/supply-chain.json', JSON.stringify(packages, null, 2));
console.log(JSON.stringify(packages.map(p => ({ name: p.name, version: p.version, identity: p.identity, registrySignatureValid: p.registrySignatureValid }))));
if (packages.length !== 6 || packages.some(p => !p.identity || !p.registrySignatureValid || p.installScripts.length)) process.exitCode = 1;
