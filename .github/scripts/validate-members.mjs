// Couche I/O : garde fail-fast à l'émission. Lit tous les records + le registre de
// révocation, vérifie l'intégrité des index de statut, et échoue bruyamment (exit 1)
// avant toute signature/déploiement. Empêche de publier deux membres au même bit de
// statut, ou un membre neuf sur un index déjà révoqué. Logique pure dans lib/.
import { readFileSync, existsSync } from 'node:fs';
import { parseMemberYaml } from './lib/credential.mjs';
import { listMemberHandles, recordPathFor } from './lib/member-paths.mjs';
import { LEDGER_PATH, parseLedger } from './lib/revocation.mjs';
import { checkStatusIndices } from './lib/member-indices.mjs';

const members = listMemberHandles().map((h) => parseMemberYaml(readFileSync(recordPathFor(h), 'utf8')));
const revoked = existsSync(LEDGER_PATH) ? parseLedger(readFileSync(LEDGER_PATH, 'utf8')) : [];

const result = checkStatusIndices(members, revoked);
if (!result.ok) {
  console.error(`::error::Intégrité des index de statut violée : ${result.error}`);
  process.exit(1);
}
console.log(`Indices de statut OK : ${members.length} membre(s), distincts et hors registre de révocation.`);
