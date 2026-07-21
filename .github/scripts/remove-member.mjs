// Couche I/O (#36) : traite un retrait RGPD. Lit le status_index du membre,
// l'ajoute au registre de révocation (le badge restera révoqué à vie), puis
// supprime entièrement son dossier — fiche + photo LFS — sans réécrire l'historique.
//
// Env : HANDLE (le membre à retirer, = auteur de la demande).
// Sortie (GITHUB_OUTPUT) : status_index, removed=true/false.
import { readFileSync, writeFileSync, existsSync, rmSync, appendFileSync } from 'node:fs';
import { parseMemberYaml } from './lib/credential.mjs';
import { memberDir, recordPathFor } from './lib/member-paths.mjs';
import { LEDGER_PATH, parseLedger, addIndex, serializeLedger } from './lib/revocation.mjs';

function fail(m) { console.error(m); process.exit(1); }
function out(k, v) { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`); }

const handle = process.env.HANDLE;
if (!handle) fail('HANDLE absent');

const recordPath = recordPathFor(handle);
if (!existsSync(recordPath)) {
  console.log(`Aucune fiche pour @${handle} — rien à retirer.`);
  out('removed', 'false');
  process.exit(0);
}

const record = parseMemberYaml(readFileSync(recordPath, 'utf8'));
const statusIndex = Number(record.status_index);
if (!Number.isInteger(statusIndex) || statusIndex < 0) fail(`status_index invalide pour @${handle}`);

// 1) Révoquer à vie : ajouter l'index au registre (survit à la suppression du dossier).
const ledger = existsSync(LEDGER_PATH) ? parseLedger(readFileSync(LEDGER_PATH, 'utf8')) : [];
writeFileSync(LEDGER_PATH, serializeLedger(addIndex(ledger, statusIndex)));

// 2) Effacer les données personnelles : supprimer tout le dossier (fiche + photo LFS).
rmSync(memberDir(handle), { recursive: true, force: true });

out('status_index', statusIndex);
out('removed', 'true');
console.log(`Retrait @${handle} : index ${statusIndex} révoqué, dossier supprimé.`);
