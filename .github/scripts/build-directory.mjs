// Couche I/O (#33/#49) : lit les enregistrements membres et écrit le flux public
// directory.json, consommé par le site ai-driven-dev.fr. Déterministe si
// DIRECTORY_GENERATED_AT est fixé (date du commit HEAD au build).
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseMemberYaml } from './lib/credential.mjs';
import { buildDirectory } from './lib/directory.mjs';

const MEMBER_DIR = 'data/members';
const OUT = 'directory.json';

function loadMembers() {
  let files = [];
  try { files = readdirSync(MEMBER_DIR).filter((f) => f.endsWith('.yml')); } catch { files = []; }
  return files.map((f) => parseMemberYaml(readFileSync(`${MEMBER_DIR}/${f}`, 'utf8')));
}

const directory = buildDirectory(loadMembers(), { generatedAt: process.env.DIRECTORY_GENERATED_AT });
mkdirSync('.', { recursive: true });
writeFileSync(OUT, JSON.stringify(directory, null, 2) + '\n');
console.log(`Annuaire écrit : ${OUT} (${directory.count} membre(s) actif(s))`);
