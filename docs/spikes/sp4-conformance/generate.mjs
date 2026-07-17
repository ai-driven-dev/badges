// SP4 — Preuve de conformité Open Badges 3.0, VC-JWT signé RS256.
// Produit un credential de référence accepté par le validateur public 1EdTech (vc.1ed.tech).
// Aucune donnée réelle : membre fictif. Aucun secret réutilisé (clé générée à chaque run).
import {
  generateKeyPair, exportJWK, importJWK, SignJWT, jwtVerify,
  calculateJwkThumbprint, decodeProtectedHeader,
} from 'jose';
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('./out/', import.meta.url);
mkdirSync(OUT, { recursive: true });

// --- Ancre d'émission (fictive, alignée sur le PRD) ---
const BASE      = 'https://verify.ai-driven-dev.fr';    // domaine décidé (SP1)
const ISSUER_ID = `${BASE}/issuer.json`;
const KEY_URL   = (kid) => `${BASE}/keys/${kid}.json`;  // 1 JWK nu par clé (SP1/CT-7)
const HANDLE    = 'octomember';                         // identité = compte GitHub (CT-3)
const ACH_ID    = `${BASE}/achievements/certified-member`;
const CRED_ID   = 'urn:uuid:6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // fixe pour reproductibilité

// --- Clé RS256 (RSA 2048). En prod : secret GitHub Actions, jamais commit (CT-7/CT-13). ---
const { publicKey, privateKey } = await generateKeyPair('RS256', { modulusLength: 2048, extractable: true });
const publicJwk  = await exportJWK(publicKey);
const kid = await calculateJwkThumbprint(publicJwk);    // kid = thumbprint RFC 7638
publicJwk.kid = kid; publicJwk.alg = 'RS256'; publicJwk.use = 'sig';

// --- Corps du credential : bare JWT (VCDM 2.0), pas d'enveloppe `vc` ---
const now = new Date();
const exp = new Date(now); exp.setFullYear(exp.getFullYear() + 1); // +1 an (CT-8)
const iso = (d) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');

const credential = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
  ],
  id: CRED_ID,
  type: ['VerifiableCredential', 'OpenBadgeCredential'],
  issuer: {
    id: ISSUER_ID,
    type: ['Profile'],
    name: 'AI-Driven Development',
    url: 'https://ai-driven-dev.com',
  },
  validFrom: iso(now),
  validUntil: iso(exp),
  credentialSubject: {
    id: `https://github.com/${HANDLE}`,   // liaison identité = compte GitHub (CT-3)
    type: ['AchievementSubject'],
    achievement: {
      id: ACH_ID,
      type: ['Achievement'],
      name: 'Certified Member',
      description: 'Membre certifié de la communauté AI-Driven Development.',
      criteria: {
        narrative: 'Décerné après réussite de la masterclass évaluée et validation par la Core Team.',
      },
    },
  },
};

// --- Signature : deux variantes ---
// A) `jwk` embarqué dans le header  -> passe le validateur sans hébergement (preuve crypto autonome)
// B) `kid` = thumbprint + JWKS hébergé -> chemin de PRODUCTION (rotation, anciennes clés conservées, CT-7)
async function sign(headerExtra) {
  return new SignJWT(credential)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', ...headerExtra })
    .setIssuer(ISSUER_ID)                 // iss dupliqué (conformité spec §8.2)
    .setSubject(credential.credentialSubject.id)
    .setJti(CRED_ID)
    .setIssuedAt(Math.floor(now.getTime() / 1000))
    .setNotBefore(Math.floor(now.getTime() / 1000))
    .setExpirationTime(Math.floor(exp.getTime() / 1000))
    .sign(privateKey);
}

const jwtEmbedded = await sign({ jwk: publicJwk });                 // variante A
const jwtKid      = await sign({ kid: KEY_URL(kid) });              // variante B (kid = URL déréférençable -> JWK nu)

// --- Auto-vérification locale (bibliothèque auditée jose, CT-9) ---
const checks = [];
{ // A : clé tirée du header jwk
  const hdr = decodeProtectedHeader(jwtEmbedded);
  const key = await importJWK(hdr.jwk, 'RS256');
  const { payload } = await jwtVerify(jwtEmbedded, key);
  checks.push(['A embedded-jwk  signature', payload.iss === ISSUER_ID]);
}
{ // B : clé tirée du JWKS (simulé : on connaît la clé publique)
  const { payload } = await jwtVerify(jwtKid, publicKey);
  checks.push(['B kid+jwks       signature', payload.sub === `https://github.com/${HANDLE}`]);
}
// altération -> doit échouer
{
  const tampered = jwtEmbedded.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'));
  let rejected = false;
  try { await jwtVerify(tampered, await importJWK(publicJwk, 'RS256')); } catch { rejected = true; }
  checks.push(['tamper           rejeté', rejected]);
}

// --- JWKS public (variante B) : ce que SP1 devra héberger ---
const jwks = { keys: [publicJwk] };

// NB: pas de '\n' final dans les .jwt — le validateur lit tout le fichier comme token ;
// un saut de ligne atterrit dans le segment signature et casse la vérif (leçon SP4).
writeFileSync(new URL('credential.json', OUT), JSON.stringify(credential, null, 2));
writeFileSync(new URL('credential.embedded-jwk.jwt', OUT), jwtEmbedded);
writeFileSync(new URL('credential.kid-jwks.jwt', OUT), jwtKid);
writeFileSync(new URL('jwks.json', OUT), JSON.stringify(jwks, null, 2));
// Ce que SP1 doit héberger pour le chemin `kid` : UN JWK nu par clé (pas d'enveloppe {keys:[]}).
// Le validateur GET l'URL du kid et lit `.kty` à la racine -> une JWKS array échouerait.
writeFileSync(new URL(`key.${kid}.json`, OUT), JSON.stringify(publicJwk, null, 2));

console.log('kid (thumbprint):', kid);
console.log('\nAuto-vérification :');
let allOk = true;
for (const [name, ok] of checks) { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`); allOk &&= ok; }
console.log('\nFichiers -> out/  (credential.json, *.jwt, jwks.json)');
console.log('JWT variante A (à coller dans vc.1ed.tech) :\n');
console.log(jwtEmbedded);
process.exit(allOk ? 0 : 1);
