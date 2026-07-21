// Couche I/O (#23) : lit un enregistrement, dérive le kid de la clé active, signe
// le credential OB3 en RS256, écrit la preuve. Logique de construction dans lib/.
//
// Argument : chemin d'un fichier data/members/<handle>.yml
// Clé privée : env SIGNING_PRIVATE_KEY (PEM PKCS8), jamais un fichier du dépôt.
// Date : env CERTIFIED_ON (date ISO du commit d'ajout) → émission déterministe.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { importPKCS8, exportJWK, calculateJwkThumbprint, SignJWT } from 'jose';
import { parseMemberYaml, buildCredential, keyUrl, DEFAULT_BASE } from './lib/credential.mjs';

function fail(message) { console.error(message); process.exit(2); }

async function loadSigningKey(pem) {
  if (!pem || !pem.includes('BEGIN')) fail('SIGNING_PRIVATE_KEY absent ou invalide');
  // extractable: sinon le calcul du thumbprint (kid) échoue.
  return importPKCS8(pem, 'RS256', { extractable: true });
}

async function main() {
  const memberPath = process.argv[2];
  if (!memberPath) fail('usage: sign-credential.mjs <data/members/handle.yml>');

  const member = parseMemberYaml(readFileSync(memberPath, 'utf8'));
  if (!member.github) fail(`github manquant dans ${memberPath}`);

  const certifiedOn = process.env.CERTIFIED_ON;
  if (!certifiedOn) fail("CERTIFIED_ON absent (date ISO du commit d'ajout)");
  const issuedAt = new Date(certifiedOn);
  if (Number.isNaN(issuedAt.getTime())) fail(`CERTIFIED_ON invalide : ${certifiedOn}`);

  const privateKey = await loadSigningKey(process.env.SIGNING_PRIVATE_KEY);
  // Le thumbprint ignore `d` → identique au kid de la clé publique publiée.
  const kid = await calculateJwkThumbprint(await exportJWK(privateKey));

  const credential = buildCredential({ handle: member.github, name: member.name }, { certifiedOn: issuedAt });

  const jwt = await new SignJWT(credential)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: keyUrl(kid) })
    .setIssuer(credential.issuer.id)
    .setSubject(credential.credentialSubject.id)
    .setJti(credential.id)
    .setIssuedAt(Math.floor(issuedAt.getTime() / 1000))
    .setNotBefore(Math.floor(issuedAt.getTime() / 1000))
    .setExpirationTime(Math.floor(new Date(credential.validUntil).getTime() / 1000))
    .sign(privateKey);

  const outDir = new URL(`../../u/${member.github}/`, import.meta.url);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(new URL('credential.jwt', outDir), jwt); // pas de newline final (SP4)
  writeFileSync(new URL('credential.json', outDir), JSON.stringify(credential, null, 2));
  console.log(`Émis : u/${member.github}/credential.jwt (kid=${kid}, expire ${credential.validUntil})`);
}

main();
