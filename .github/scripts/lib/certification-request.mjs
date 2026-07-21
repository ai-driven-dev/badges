// Construit l'enregistrement d'un membre à partir d'une issue d'inscription (#18).
// Identité = auteur de l'issue (compte GitHub), jamais un champ saisi (CT-3).
// Fonctions pures : ni lecture d'event, ni écriture de fichier.
import { clean, parseIssueFormBody } from './issue-form.mjs';
import { extractImageUrl, photoPathFor } from './photo-url.mjs';

export const MEMBER_DIR = 'data/members';
const NO_RESPONSE = '_No response_';

const LIMIT = Object.freeze({ name: 120, linkedin: 200, website: 200 });

// Le heading d'un champ Issue Form = son `label`, rendu en `### <label>`.
const HEADING = Object.freeze({
  name: 'nom complet',
  linkedin: 'profil linkedin',
  website: 'site web',
  photo: 'photo',
});

const GITHUB_HANDLE_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

/** Erreur de validation d'une demande : message destiné au demandeur. */
export class RequestError extends Error {}

const omitNoResponse = (value) => (value === NO_RESPONSE ? '' : value);

function requireSingleLine(value, field) {
  if (value.includes('\n')) throw new RequestError(`${field} doit tenir sur une ligne`);
  return value;
}

function requireUnderLimit(value, field, max) {
  if (value.length > max) throw new RequestError(`${field} dépasse ${max} caractères`);
  return value;
}

function isHttpsUrl(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

/** Scalaire YAML sûr : double-quote via JSON (échappe guillemets, backslash, etc.). */
const yamlScalar = (value) => JSON.stringify(String(value));

/** Valide le handle GitHub (issu de l'auteur de l'issue, pas d'un champ saisi). */
export function parseHandle(login) {
  const handle = clean(login);
  if (!GITHUB_HANDLE_RE.test(handle)) throw new RequestError(`handle GitHub invalide : ${handle}`);
  return handle;
}

/** Nom : requis, une ligne, sous la limite. */
export function parseName(fields) {
  const name = requireUnderLimit(requireSingleLine(clean(fields[HEADING.name]), 'Nom'), 'Nom', LIMIT.name);
  if (!name) throw new RequestError('Nom requis');
  return name;
}

/** LinkedIn : requis, URL https linkedin.com, sous la limite. */
export function parseLinkedin(fields) {
  const value = requireSingleLine(clean(fields[HEADING.linkedin]), 'LinkedIn');
  if (!value) throw new RequestError('LinkedIn requis');
  requireUnderLimit(value, 'LinkedIn', LIMIT.linkedin);
  if (!isHttpsUrl(value) || !/linkedin\.com/i.test(value)) {
    throw new RequestError('LinkedIn doit être une URL https linkedin.com');
  }
  return value;
}

/** Site : optionnel ; si fourni, URL https sous la limite. */
export function parseWebsite(fields) {
  const value = omitNoResponse(requireSingleLine(clean(fields[HEADING.website]), 'Site'));
  if (!value) return '';
  requireUnderLimit(value, 'Site', LIMIT.website);
  if (!isHttpsUrl(value)) throw new RequestError('Site doit être une URL https');
  return value;
}

/** Photo : requise. Rend l'URL de l'image déposée dans le champ. */
export function parsePhotoUrl(fields) {
  const url = extractImageUrl(omitNoResponse(clean(fields[HEADING.photo])));
  if (!url) throw new RequestError('Photo requise');
  return url;
}

/** Sérialise l'enregistrement du membre en YAML plat, valeurs échappées. */
export function toMemberYaml({ handle, name, linkedin, website, statusIndex }) {
  if (!Number.isInteger(statusIndex) || statusIndex < 0) throw new RequestError('statusIndex requis');
  const lines = [
    `github: ${yamlScalar(handle)}`,
    `role: "certifie"`,
    `name: ${yamlScalar(name)}`,
    `linkedin: ${yamlScalar(linkedin)}`,
    `photo: ${yamlScalar(photoPathFor(handle))}`, // objet Git LFS (#16), normalisé à l'intake (#21)
    `status_index: ${statusIndex}`, // index permanent dans la Bitstring Status List (CT-4)
  ];
  if (website) lines.push(`website: ${yamlScalar(website)}`);
  return lines.join('\n') + '\n';
}

/**
 * Transforme une issue (objet event.issue) en enregistrement complet.
 * @param {object} issue  objet event.issue
 * @param {number} statusIndex  index permanent assigné à l'inscription (Bitstring, CT-4)
 * Lève RequestError si un champ requis manque ou est invalide.
 */
export function buildMemberRecord(issue, statusIndex) {
  const handle = parseHandle(issue?.user?.login);
  const fields = parseIssueFormBody(issue?.body || '');
  const name = parseName(fields);
  const linkedin = parseLinkedin(fields);
  const website = parseWebsite(fields);
  const photoUrl = parsePhotoUrl(fields);

  return {
    handle,
    name,
    linkedin,
    website,
    statusIndex,
    photoUrl,
    photoPath: photoPathFor(handle),
    issueNumber: issue.number,
    path: `${MEMBER_DIR}/${handle}.yml`,
    branch: `certif/${handle}-${issue.number}`,
    yaml: toMemberYaml({ handle, name, linkedin, website, statusIndex }),
  };
}
