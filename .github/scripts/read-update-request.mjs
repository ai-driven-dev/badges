// Couche I/O : lit l'event GitHub + la fiche existante, construit la fiche mise à
// jour via la lib, écrit les sorties du workflow. Toute la logique est dans lib/.
//
// Sorties : has_record=false si l'auteur n'a pas de fiche (rien à mettre à jour).
// Sinon has_record=true + les champs de la fiche régénérée (dont un diff avant/après).
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { parseHandle } from './lib/certification-request.mjs';
import { buildMemberUpdate } from './lib/update-request.mjs';
import { recordPathFor } from './lib/member-paths.mjs';

function out(key, value) {
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

function writeOutputs(update) {
  const scalars = {
    has_record: 'true',
    changed: String(update.changed),
    github: update.handle,
    name: update.name,
    linkedin: update.linkedin,
    website: update.website,
    description: update.description,
    before_name: update.before.name,
    before_linkedin: update.before.linkedin,
    before_website: update.before.website,
    before_description: update.before.description,
    path: update.path,
    branch: update.branch,
    issue_number: update.issueNumber,
    photo_changed: String(update.photoChanged),
    photo_url: update.photoUrl,
    photo_path: update.photoPath,
  };
  for (const [key, value] of Object.entries(scalars)) out(key, value);
  // Contenu YAML multi-ligne via délimiteur.
  appendFileSync(process.env.GITHUB_OUTPUT, `record<<__YAML__\n${update.yaml}__YAML__\n`);
}

function main() {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const handle = parseHandle(event.issue?.user?.login);
  const recordPath = recordPathFor(handle);

  if (!existsSync(recordPath)) {
    out('has_record', 'false');
    console.log(`Aucune fiche pour @${handle} — rien à mettre à jour.`);
    return;
  }

  const update = buildMemberUpdate(event.issue, readFileSync(recordPath, 'utf8'));
  writeOutputs(update);
  console.log(`Mise à jour prête : ${update.path} (changé=${update.changed}, photo=${update.photoChanged})`);
}

main();
