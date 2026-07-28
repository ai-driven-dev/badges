// Signe des credentials RÉELS pour les membres de directory.json, dans .localserve,
// base = http://localhost:8200. Permet de tester /u/<handle> en vrai (VALID) sans DNS.
// Signature RS256 via node:crypto (aucune dépendance, jose non installé en local).
// Usage : node .localserve/sign-samples.mjs   (puis serve.mjs sert le tout, CORS *)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { buildCredential, keyUrl } from '../.github/scripts/lib/credential.mjs';
import { buildStatusListCredential } from '../.github/scripts/lib/status-list.mjs';

const root = dirname(fileURLToPath(import.meta.url));
// Bases prod-like servies par Caddy (HTTPS) : données sous /data, site à la racine.
const BASE = 'https://verify.ai-driven-dev.fr/data'; // DONNÉES (clés, statut, preuves)
const SITE = 'https://verify.ai-driven-dev.fr';      // SITE (page /u/<handle>)
const write = (rel, content) => {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
};
const b64url = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

// Clé jetable de démo. En vrai : secret d'environnement CI.
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = publicKey.export({ format: 'jwk' }); // { kty, n, e }
const kid = crypto.createHash('sha256')
  .update(JSON.stringify({ e: jwk.e, kty: jwk.kty, n: jwk.n })).digest('base64url'); // RFC7638
const pub = { ...jwk, kid, alg: 'RS256', use: 'sig' };

const header = { alg: 'RS256', typ: 'JWT', kid: keyUrl(kid, BASE) };
const signJwt = (payload) => {
  const input = `${b64url(header)}.${b64url(payload)}`;
  const sig = crypto.sign('RSA-SHA256', Buffer.from(input), privateKey).toString('base64url');
  return `${input}.${sig}`;
};

const dir = JSON.parse(readFileSync(join(root, 'directory.json'), 'utf8'));
const members = dir.members || [];
const now = new Date();
let issuer;

for (let i = 0; i < members.length; i += 1) {
  const m = members[i];
  const c = buildCredential({ handle: m.handle, name: m.name, statusIndex: i }, { certifiedOn: now, base: BASE });
  issuer = c.issuer;
  const jwt = signJwt({
    ...c,
    iss: c.issuer.id,
    sub: c.credentialSubject.id,
    jti: c.id,
    iat: Math.floor(now / 1000),
    exp: Math.floor(new Date(c.validUntil) / 1000),
  });
  write(`u/${m.handle}/credential.jwt`, jwt);
}

// --- Deux personnes de démo : une VALIDE, une INVALIDE (révoquée) — nom + photo. ---
const testPeople = [
  { handle: 'sophiedurand', name: 'Sophie Durand', role: 'certifie', photo: 'crousseau', description: 'Ingénieure plateforme, delivery assisté par IA.', statusIndex: members.length, revoke: false },
  { handle: 'marclefebvre', name: 'Marc Lefebvre', role: 'certifie', photo: 'ybenali', description: 'Tech lead, refactoring guidé par agents.', statusIndex: members.length + 1, revoke: true },
];
for (const t of testPeople) {
  const c = buildCredential({ handle: t.handle, name: t.name, statusIndex: t.statusIndex }, { certifiedOn: now, base: BASE });
  const jwt = signJwt({
    ...c,
    iss: c.issuer.id,
    sub: c.credentialSubject.id,
    jti: c.id,
    iat: Math.floor(now / 1000),
    exp: Math.floor(new Date(c.validUntil) / 1000),
  });
  write(`u/${t.handle}/credential.jwt`, jwt);
}

const revokedIndices = testPeople.filter((t) => t.revoke).map((t) => t.statusIndex);
const statusCred = await buildStatusListCredential(revokedIndices, { issuedOn: now, base: BASE });
const statusJwt = signJwt({ ...statusCred, iss: statusCred.issuer.id, iat: Math.floor(now / 1000) });

write(`keys/${kid}.json`, JSON.stringify(pub, null, 2));
write('issuer.json', JSON.stringify(issuer, null, 2));
write('status/1', statusJwt);

// Annuaire : membres réels + les personnes de démo NON révoquées (comme buildDirectory
// en prod, qui exclut les révoqués via isActive). Le révoqué garde sa page /u mais,
// absent de l'annuaire, son nom n'y est pas -> sa page affiche @handle, sans donnée perso.
const rewritten = [
  ...members.map((m) => ({ ...m, photo: `${BASE}/photos/${m.handle}.webp`, verify: `${SITE}/u/${m.handle}` })),
  ...testPeople
    .filter((t) => !t.revoke)
    .map((t) => ({
      handle: t.handle,
      name: t.name,
      role: t.role,
      description: t.description,
      photo: `${BASE}/photos/${t.photo}.webp`,
      verify: `${SITE}/u/${t.handle}`,
    })),
];
write('directory.json', JSON.stringify({ ...dir, count: rewritten.length, members: rewritten }, null, 2));

console.log(`signé ${members.length} membres + ${testPeople.length} personnes de démo — kid=${kid}`);
console.log('démo :', testPeople.map((t) => `${t.handle}(${t.revoke ? 'invalide/révoqué' : 'valide'})`).join(', '));
