// Construit le flux public de l'annuaire (#33/#49) : directory.json consommé par
// le site ai-driven-dev.fr. Pur : reçoit les enregistrements déjà parsés.
import { DEFAULT_BASE } from './credential.mjs';

/** URL publique de la photo servie (copiée depuis LFS au build). */
export function photoUrlFor(handle, base = DEFAULT_BASE) {
  return `${base}/photos/${handle}.webp`;
}

/** Une entrée d'annuaire pour un membre. */
export function toDirectoryEntry(member, base = DEFAULT_BASE) {
  const entry = {
    handle: member.github,
    name: member.name,
    role: member.role || 'certifie',
    linkedin: member.linkedin,
    photo: photoUrlFor(member.github, base),
    verify: `${base}/u/${member.github}`,
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
 * @param {{ base?: string, generatedAt?: string }} options
 */
export function buildDirectory(members, { base = DEFAULT_BASE, generatedAt } = {}) {
  const entries = members
    .filter(isActive)
    .map((m) => toDirectoryEntry(m, base))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return { generatedAt, count: entries.length, members: entries };
}
