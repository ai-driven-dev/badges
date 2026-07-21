// Couche I/O (#33/#49) : lit les enregistrements membres et écrit le flux public
// directory.json, consommé par le site ai-driven-dev.fr. Déterministe si
// DIRECTORY_GENERATED_AT est fixé (date du commit HEAD au build).
import { readFileSync, writeFileSync } from 'node:fs';
import { parseMemberYaml } from './lib/credential.mjs';
import { buildDirectory } from './lib/directory.mjs';
import { listMemberHandles, recordPathFor } from './lib/member-paths.mjs';

const OUT = 'directory.json';

function loadMembers() {
  return listMemberHandles().map((h) => parseMemberYaml(readFileSync(recordPathFor(h), 'utf8')));
}

const directory = buildDirectory(loadMembers(), { generatedAt: process.env.DIRECTORY_GENERATED_AT });
writeFileSync(OUT, JSON.stringify(directory, null, 2) + '\n');
console.log(`Annuaire écrit : ${OUT} (${directory.count} membre(s) actif(s))`);
