// Cérémonie de clé (#41) — exécutée UNIQUEMENT dans le job gaté `environment: signing`.
// Génère une paire RS256, publie la clé publique (JWK nu) + marqueur du kid courant,
// et dépose la clé privée (PEM PKCS8) dans un fichier temporaire hors dépôt que
// l'étape suivante pousse dans le secret d'environnement. La clé privée ne touche
// jamais le dépôt et n'est jamais journalisée.
import { generateKeyPair, exportJWK, exportPKCS8, calculateJwkThumbprint } from 'jose';
import { writeFileSync, mkdirSync, appendFileSync } from 'node:fs';

const REPO_KEYS = new URL('../../keys/', import.meta.url); // keys/ à la racine du repo
mkdirSync(REPO_KEYS, { recursive: true });

const { publicKey, privateKey } = await generateKeyPair('RS256', { modulusLength: 2048, extractable: true });

const pub = await exportJWK(publicKey);
const kid = await calculateJwkThumbprint(pub);          // kid = thumbprint RFC 7638
pub.kid = kid; pub.alg = 'RS256'; pub.use = 'sig';

// Clé publique : un JWK nu par kid (contrainte SP4/CT-7), servi à vie par Pages.
// Pas de marqueur "kid courant" : l'émission (E3) dérive le kid de la clé privée
// active (thumbprint) — le kid ne peut donc jamais diverger de la clé qui signe.
writeFileSync(new URL(`${kid}.json`, REPO_KEYS), JSON.stringify(pub, null, 2) + '\n');

// Clé privée -> fichier temporaire hors dépôt (RUNNER_TEMP), lu par l'étape secret puis détruit.
const privPath = `${process.env.RUNNER_TEMP}/signing-private.pem`;
writeFileSync(privPath, await exportPKCS8(privateKey), { mode: 0o600 });

// Sorties pour le workflow (le kid n'est pas secret ; le chemin non plus).
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `kid=${kid}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `priv_path=${privPath}\n`);
}
console.log(`Nouvelle clé générée. kid=${kid}`);
console.log(`Clé publique -> keys/${kid}.json`);
