// Couche I/O (#19) : lit l'event GitHub, construit l'enregistrement via la lib,
// écrit les sorties du workflow. Toute la logique testable est dans lib/.
import { readFileSync, appendFileSync } from 'node:fs';
import { buildMemberRecord } from './lib/certification-request.mjs';

function writeOutputs(output, record) {
  const scalars = {
    github: record.handle,
    name: record.name,
    path: record.path,
    branch: record.branch,
    issue_number: record.issueNumber,
  };
  for (const [key, value] of Object.entries(scalars)) {
    appendFileSync(output, `${key}=${value}\n`);
  }
  // Contenu YAML multi-ligne via délimiteur.
  appendFileSync(output, `record<<__YAML__\n${record.yaml}__YAML__\n`);
}

function main() {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const record = buildMemberRecord(event.issue);
  writeOutputs(process.env.GITHUB_OUTPUT, record);
  console.log(`Enregistrement prêt : ${record.path}`);
}

main();
