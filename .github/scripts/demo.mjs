// Démo locale (#test sans DNS) : signe un membre fictif avec une base localhost,
// assemble le site et le sert. Ouvre http://localhost:8000/u/demo pour voir la
// page de vérification marcher EN VRAI dans le navigateur, sans domaine ni DNS.
//
// Usage : node .github/scripts/demo.mjs   (puis ouvrir l'URL affichée)
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { generateKeyPair, exportJWK, calculateJwkThumbprint, SignJWT } from 'jose';
import { buildCredential, keyUrl, statusListUrl, isoSeconds } from './lib/credential.mjs';
import { buildStatusListCredential } from './lib/status-list.mjs';
import { generateQrSvg } from './lib/qr.mjs';

const PORT = Number(process.env.PORT || 8000);
const BASE = `http://localhost:${PORT}`;
const HANDLE = 'demo';
const root = join(dirname(fileURLToPath(import.meta.url)), '../../.demo-site');
const site = join(dirname(fileURLToPath(import.meta.url)), '../../site');

function write(rel, content) {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}

async function build() {
  // Clé jetable (démo). En vrai : secret d'environnement CI.
  const { publicKey, privateKey } = await generateKeyPair('RS256', { modulusLength: 2048, extractable: true });
  const pub = await exportJWK(publicKey); // clé PUBLIQUE (jamais la privée)
  const kid = await calculateJwkThumbprint(pub);
  pub.kid = kid; pub.alg = 'RS256'; pub.use = 'sig';

  const now = new Date();
  const credential = buildCredential(
    { handle: HANDLE, name: 'Membre Démo', statusIndex: 0 },
    { certifiedOn: now, base: BASE },
  );
  const jwt = await new SignJWT(credential)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: keyUrl(kid, BASE) })
    .setIssuer(credential.issuer.id).setSubject(credential.credentialSubject.id).setJti(credential.id)
    .setIssuedAt(Math.floor(now / 1000)).setExpirationTime(Math.floor(new Date(credential.validUntil) / 1000))
    .sign(privateKey);

  // Status list (aucune révocation) signée avec la même clé.
  const statusCred = await buildStatusListCredential([], { issuedOn: now, base: BASE });
  const statusJwt = await new SignJWT(statusCred)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: keyUrl(kid, BASE) })
    .setIssuer(statusCred.issuer.id).setIssuedAt(Math.floor(now / 1000)).sign(privateKey);

  // Assemble le site de démo.
  write(`keys/${kid}.json`, JSON.stringify(pub, null, 2));
  write('issuer.json', JSON.stringify(credential.issuer, null, 2));
  write(`u/${HANDLE}/credential.jwt`, jwt);
  write(`u/${HANDLE}/qr.svg`, await generateQrSvg(HANDLE, BASE));
  write('status/1', statusJwt);
  for (const f of ['verify.mjs', 'verify-page.mjs', 'bitstring.mjs']) write(f, readFileSync(join(site, f)));
  write(`u/${HANDLE}/index.html`, readFileSync(join(site, 'badge-page.html')));
  return { kid };
}

const TYPES = { '.mjs': 'text/javascript', '.json': 'application/json', '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.jwt': 'text/plain' };

const { kid } = await build();
createServer((req, res) => {
  let path = decodeURIComponent(req.url.split('?')[0]);
  if (path.endsWith('/')) path += 'index.html';
  const file = join(root, path);
  if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(PORT, () => {
  console.log(`Démo servie. kid=${kid}`);
  console.log(`\n  Ouvre → ${BASE}/u/${HANDLE}\n`);
  console.log('Ctrl+C pour arrêter.');
});
