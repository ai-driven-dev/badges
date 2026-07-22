// Couche I/O (#23) : lit un enregistrement, dérive le kid de la clé active, signe
// le credential OB3 en RS256, écrit la preuve. Logique de construction dans lib/.
//
// Argument : chemin d'un fichier data/members/<handle>/record.yml
// Clé privée : env SIGNING_PRIVATE_KEY (PEM PKCS8), jamais un fichier du dépôt.
// Date : env CERTIFIED_ON (date ISO du commit d'ajout) → émission déterministe.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { importPKCS8, exportJWK, calculateJwkThumbprint, SignJWT } from 'jose';
import { parseMemberYaml, buildCredential, keyUrl, resolveEmissionDate, DEFAULT_BASE } from './lib/credential.mjs';
import { generateQrSvg } from './lib/qr.mjs';

function fail(message) { console.error(message); process.exit(2); }

async function loadSigningKey(pem) {
  if (!pem || !pem.includes('BEGIN')) fail('SIGNING_PRIVATE_KEY absent ou invalide');
  // extractable: sinon le calcul du thumbprint (kid) échoue.
  return importPKCS8(pem, 'RS256', { extractable: true });
}

async function main() {
  const memberPath = process.argv[2];
  if (!memberPath) fail('usage: sign-credential.mjs <data/members/handle/record.yml>');

  const member = parseMemberYaml(readFileSync(memberPath, 'utf8'));
  if (!member.github) fail(`github manquant dans ${memberPath}`);
  const statusIndex = Number(member.status_index);
  if (!Number.isInteger(statusIndex) || statusIndex < 0) fail(`status_index manquant/invalide dans ${memberPath}`);

  // Renouvellement (#27) : renewed_on du record prime sur la date de première
  // certification (CERTIFIED_ON = date du commit d'ajout).
  let issuedAt;
  try { issuedAt = resolveEmissionDate(member.renewed_on, process.env.CERTIFIED_ON); }
  catch (e) { fail(e.message); }

  const privateKey = await loadSigningKey(process.env.SIGNING_PRIVATE_KEY);
  // Le thumbprint ignore `d` → identique au kid de la clé publique publiée.
  const kid = await calculateJwkThumbprint(await exportJWK(privateKey));

  const credential = buildCredential({ handle: member.github, name: member.name, statusIndex }, { certifiedOn: issuedAt });

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
  writeFileSync(new URL('qr.svg', outDir), await generateQrSvg(member.github)); // QR de vérif (#60)
  console.log(`Émis : u/${member.github}/credential.jwt (+qr.svg, kid=${kid}, expire ${credential.validUntil})`);
}

main();
