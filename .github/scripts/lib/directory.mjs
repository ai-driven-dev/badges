// Construit le flux public de l'annuaire (#33/#49) : directory.json consommé par
// le site ai-driven-dev.fr. Pur : reçoit les enregistrements déjà parsés.
// photo = données (Pages) ; verify = belle page (site).
import { DATA_BASE, SITE_BASE, siteVerifyUrl } from './credential.mjs';

/** URL publique de la photo servie par Pages (copiée depuis LFS au build). */
export function photoUrlFor(handle, dataBase = DATA_BASE) {
  return `${dataBase}/photos/${handle}.webp`;
}

/** Une entrée d'annuaire pour un membre. */
export function toDirectoryEntry(member, { dataBase = DATA_BASE, siteBase = SITE_BASE } = {}) {
  const entry = {
    handle: member.github,
    name: member.name,
    role: member.role || 'certifie',
    linkedin: member.linkedin,
    photo: photoUrlFor(member.github, dataBase),
    verify: siteVerifyUrl(member.github, siteBase),
  };
  if (member.website) entry.website = member.website;
  if (member.description) entry.description = member.description;
  return entry;
}

/** Membre actif = non révoqué (le retrait le sort de l'annuaire, #35). */
export function isActive(member) {
  return String(member.revoked) !== 'true';
}

/**
 * Assemble le flux annuaire trié par nom, révoqués exclus.
 * @param {object[]} members enregistrements parsés
 * @param {{ dataBase?, siteBase?, generatedAt? }} options
 */
export function buildDirectory(members, { dataBase = DATA_BASE, siteBase = SITE_BASE, generatedAt } = {}) {
  const entries = members
    .filter(isActive)
    .map((m) => toDirectoryEntry(m, { dataBase, siteBase }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return { generatedAt, count: entries.length, members: entries };
}
