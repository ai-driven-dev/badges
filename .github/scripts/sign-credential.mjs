// Émission (#23) : lit un enregistrement de membre, produit un Open Badges 3.0
// VC-JWT signé RS256, et écrit la preuve. Réutilise la forme prouvée conforme
// au validateur 1EdTech (spike SP4). Exécuté au merge, dans l'environnement
// `signing` (main uniquement) qui expose SIGNING_PRIVATE_KEY.
//
// Argument : chemin d'un fichier data/members/<handle>.yml
// La clé privée vient de l'env SIGNING_PRIVATE_KEY (PEM PKCS8), jamais d'un fichier.
import { importPKCS8, exportJWK, calculateJwkThumbprint, SignJWT } from 'jose';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'https://verify.ai-driven-dev.fr';   // domaine permanent (SP1)
const ISSUER_ID = `${BASE}/issuer.json`;

// --- Parse minimal du YAML plat (clé: "valeur" échappée en JSON) ---
function parseMemberYaml(text) {
  const rec = {};
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith('"')) { try { v = JSON.parse(v); } catch { /* garde brut */ } }
    rec[m[1]] = v;
  }
  return rec;
}

const memberPath = process.argv[2];
if (!memberPath) { console.error('usage: sign-credential.mjs <data/members/handle.yml>'); process.exit(2); }

const rec = parseMemberYaml(readFileSync(memberPath, 'utf8'));
const handle = rec.github;
if (!handle) { console.error(`github manquant dans ${memberPath}`); process.exit(2); }
if (!rec.name) { console.error(`name manquant dans ${memberPath}`); process.exit(2); }

const pem = process.env.SIGNING_PRIVATE_KEY;
if (!pem || !pem.includes('BEGIN')) { console.error('SIGNING_PRIVATE_KEY absent ou invalide'); process.exit(2); }
const privateKey = await importPKCS8(pem, 'RS256', { extractable: true });

// kid = thumbprint de la clé active (le thumbprint ignore `d` → identique au public).
const kid = await calculateJwkThumbprint(await exportJWK(privateKey));
const kidUrl = `${BASE}/keys/${kid}.json`;

// certified_on = date du commit qui a ajouté l'enregistrement (= merge), passée par
// le workflow. Rend l'émission DÉTERMINISTE : régénérer produit le même credential
// bit pour bit (RS256 est déterministe) — pas de dérive de date, pas besoin de le committer.
const certifiedOn = process.env.CERTIFIED_ON;
if (!certifiedOn) { console.error('CERTIFIED_ON absent (date ISO du commit d\'ajout)'); process.exit(2); }
const now = new Date(certifiedOn);
if (Number.isNaN(now.getTime())) { console.error(`CERTIFIED_ON invalide: ${certifiedOn}`); process.exit(2); }
const exp = new Date(now); exp.setFullYear(exp.getFullYear() + 1);   // +1 an (CT-8, #24)
const iso = (d) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
const credId = `urn:uuid:${cryptoUuidFrom(handle, now)}`;

const subject = {
  id: `https://github.com/${handle}`,     // liaison identité = compte GitHub (CT-3, #26)
  type: ['AchievementSubject'],
  achievement: {
    id: `${BASE}/achievements/certified-member`,
    type: ['Achievement'],
    name: 'Certified Member',
    description: 'Membre certifié de la communauté AI-Driven Development.',
    criteria: { narrative: 'Décerné après réussite de la masterclass évaluée et validation par la Core Team.' },
  },
};

const credential = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
  ],
  id: credId,
  type: ['VerifiableCredential', 'OpenBadgeCredential'],
  issuer: { id: ISSUER_ID, type: ['Profile'], name: 'AI-Driven Development', url: 'https://ai-driven-dev.fr' },
  validFrom: iso(now),
  validUntil: iso(exp),   // expiration 1 an (#24)
  credentialSubject: subject,
};

const jwt = await new SignJWT(credential)
  .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: kidUrl })
  .setIssuer(ISSUER_ID)
  .setSubject(subject.id)
  .setJti(credId)
  .setIssuedAt(Math.floor(now.getTime() / 1000))
  .setNotBefore(Math.floor(now.getTime() / 1000))
  .setExpirationTime(Math.floor(exp.getTime() / 1000))
  .sign(privateKey);

const outDir = new URL(`../../u/${handle}/`, import.meta.url);
mkdirSync(outDir, { recursive: true });
writeFileSync(new URL('credential.jwt', outDir), jwt);                       // preuve (CT-6)
writeFileSync(new URL('credential.json', outDir), JSON.stringify(credential, null, 2)); // lisible (#31)
console.log(`Émis: u/${handle}/credential.jwt (kid=${kid}, expire ${iso(exp)})`);

// UUID déterministe (pas de Math.random requis) à partir du handle + timestamp.
function cryptoUuidFrom(h, d) {
  const seed = `${h}:${d.getTime()}`;
  let x = 0; for (const c of seed) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  const hex = (n) => n.toString(16).padStart(8, '0');
  const a = hex(x), b = hex((x * 2654435761) >>> 0), c = hex((x ^ 0x9e3779b9) >>> 0), e = hex((x * 40503) >>> 0);
  return `${a}-${b.slice(0,4)}-4${b.slice(5,8)}-8${c.slice(1,4)}-${c.slice(4)}${e.slice(0,4)}`;
}
