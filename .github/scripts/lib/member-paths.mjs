// Disposition sur disque des enregistrements membres : un dossier par membre.
// data/members/<handle>/record.yml + data/members/<handle>/photo.webp
// L'effacement RGPD est alors `rm -rf data/members/<handle>/` (fiche + photo).
// Ces chemins sont INTERNES au dépôt ; les URLs publiques sont ailleurs (directory/verify).
import { readdirSync, existsSync } from 'node:fs';

export const MEMBERS_DIR = 'data/members';

/** Dossier d'un membre. */
export function memberDir(handle) {
  return `${MEMBERS_DIR}/${handle}`;
}

/** Chemin de la fiche YAML d'un membre. */
export function recordPathFor(handle) {
  return `${memberDir(handle)}/record.yml`;
}

/** Chemin de la photo (objet Git LFS) d'un membre. */
export function photoPathFor(handle) {
  return `${memberDir(handle)}/photo.webp`;
}

/** Liste les handles ayant une fiche (dossiers contenant record.yml). */
export function listMemberHandles(root = MEMBERS_DIR) {
  let entries = [];
  try { entries = readdirSync(root, { withFileTypes: true }); } catch { return []; }
  return entries
    .filter((e) => e.isDirectory() && existsSync(`${root}/${e.name}/record.yml`))
    .map((e) => e.name)
    .sort();
}
