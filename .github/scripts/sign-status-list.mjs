// Émet le BitstringStatusListCredential signé (#25). Parcourt les enregistrements
// membres, collecte les index révoqués (champ `revoked: true`), construit la liste
// signée RS256, et l'écrit à `status/1`. Exécuté au build, dans l'env `signing`.
//
// Clé privée : env SIGNING_PRIVATE_KEY. Date : env STATUS_ISSUED_ON (déterministe).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { importPKCS8, SignJWT } from 'jose';
import { buildStatusListCredential } from './lib/status-list.mjs';
import { LEDGER_PATH, parseLedger } from './lib/revocation.mjs';

function fail(m) { console.error(m); process.exit(2); }

// Les révocations viennent du registre (#36), pas des records : un membre retiré
// n'a plus de dossier, seul son index survit dans le registre.
function collectRevokedIndices() {
  if (!existsSync(LEDGER_PATH)) return [];
  return parseLedger(readFileSync(LEDGER_PATH, 'utf8'));
}

async function main() {
  const pem = process.env.SIGNING_PRIVATE_KEY;
  if (!pem || !pem.includes('BEGIN')) fail('SIGNING_PRIVATE_KEY absent ou invalide');
  const issued = process.env.STATUS_ISSUED_ON;
  if (!issued) fail('STATUS_ISSUED_ON absent');
  const issuedOn = new Date(issued);
  if (Number.isNaN(issuedOn.getTime())) fail(`STATUS_ISSUED_ON invalide : ${issued}`);

  const privateKey = await importPKCS8(pem, 'RS256', { extractable: true });
  const { calculateJwkThumbprint, exportJWK } = await import('jose');
  const kid = await calculateJwkThumbprint(await exportJWK(privateKey));

  const revoked = collectRevokedIndices();
  const credential = await buildStatusListCredential(revoked, { issuedOn });

  const jwt = await new SignJWT(credential)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: `https://verify.ai-driven-dev.fr/keys/${kid}.json` })
    .setIssuer(credential.issuer.id)
    .setIssuedAt(Math.floor(issuedOn.getTime() / 1000))
    .sign(privateKey);

  mkdirSync('status', { recursive: true });
  writeFileSync('status/1', jwt); // servi tel quel (VC-JWT), pas de newline
  console.log(`Status list émise : status/1 (${revoked.length} révocation(s))`);
}

main();
