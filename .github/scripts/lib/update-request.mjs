// Construit la fiche mise à jour d'un membre à partir d'une issue de mise à jour.
// Identité = auteur de l'issue (compte GitHub), jamais un champ saisi (CT-3).
// Fonctions pures : ni lecture d'event, ni écriture de fichier.
//
// Un badge signé n'encode QUE le handle + les dates + le statut ; nom, LinkedIn,
// photo et description vivent dans l'annuaire seul. Une mise à jour ne re-signe
// donc rien : elle régénère la fiche (mêmes github/role/status_index) et l'emit
// reproduit un credential byte-identique. Un champ laissé vide = inchangé.
import { parseIssueFormBody, clean } from './issue-form.mjs';
import { extractImageUrl } from './photo-url.mjs';
import { parseMemberYaml } from './credential.mjs';
import { recordPathFor, photoPathFor } from './member-paths.mjs';
import {
  HEADING, LIMIT, RequestError, omitNoResponse,
  requireSingleLine, requireUnderLimit, isHttpsUrl, parseHandle, toMemberYaml,
} from './certification-request.mjs';

/** Valeur d'un champ du formulaire, vidée du placeholder « _No response_ ». */
const field = (fields, key) => omitNoResponse(clean(fields[key] ?? ''));

/** Nom : si fourni, une ligne non vide sous la limite ; sinon on garde l'existant. */
function updateName(fields, current) {
  const value = field(fields, HEADING.name);
  if (!value) return current;
  const name = requireUnderLimit(requireSingleLine(value, 'Nom'), 'Nom', LIMIT.name);
  if (!name) return current;
  return name;
}

/** LinkedIn : si fourni, URL https linkedin.com sous la limite ; sinon inchangé. */
function updateLinkedin(fields, current) {
  const value = field(fields, HEADING.linkedin);
  if (!value) return current;
  requireUnderLimit(requireSingleLine(value, 'LinkedIn'), 'LinkedIn', LIMIT.linkedin);
  if (!isHttpsUrl(value) || !/linkedin\.com/i.test(value)) {
    throw new RequestError('LinkedIn doit être une URL https linkedin.com');
  }
  return value;
}

/** Site : si fourni, URL https sous la limite ; sinon inchangé. */
function updateWebsite(fields, current) {
  const value = field(fields, HEADING.website);
  if (!value) return current;
  requireUnderLimit(requireSingleLine(value, 'Site'), 'Site', LIMIT.website);
  if (!isHttpsUrl(value)) throw new RequestError('Site doit être une URL https');
  return value;
}

/** Description : si fournie, une ligne sous la limite ; sinon inchangée. */
function updateDescription(fields, current) {
  const value = field(fields, HEADING.description);
  if (!value) return current;
  return requireUnderLimit(requireSingleLine(value, 'Description'), 'Description', LIMIT.description);
}

/**
 * Transforme une issue de mise à jour + la fiche existante en fiche régénérée.
 * @param {object} issue         objet event.issue (auteur = membre)
 * @param {string} existingYaml  contenu actuel de data/members/<handle>/record.yml
 * Lève RequestError si un champ fourni est invalide.
 */
export function buildMemberUpdate(issue, existingYaml) {
  const handle = parseHandle(issue?.user?.login);
  const current = parseMemberYaml(existingYaml);

  const statusIndex = Number(current.status_index);
  if (!Number.isInteger(statusIndex) || statusIndex < 0) {
    throw new RequestError(`status_index invalide dans la fiche de @${handle}`);
  }

  const fields = parseIssueFormBody(issue?.body || '');
  const before = {
    name: current.name ?? '',
    linkedin: current.linkedin ?? '',
    website: current.website ?? '',
    description: current.description ?? '',
  };
  const after = {
    name: updateName(fields, before.name),
    linkedin: updateLinkedin(fields, before.linkedin),
    website: updateWebsite(fields, before.website),
    description: updateDescription(fields, before.description),
  };

  // Photo : ne change que si une image est déposée dans le champ.
  const photoUrl = extractImageUrl(field(fields, HEADING.photo)) || '';

  const changed =
    photoUrl !== '' ||
    after.name !== before.name ||
    after.linkedin !== before.linkedin ||
    after.website !== before.website ||
    after.description !== before.description;

  const yaml = toMemberYaml({
    handle,
    name: after.name,
    linkedin: after.linkedin,
    website: after.website,
    description: after.description,
    statusIndex,
    role: current.role || 'certifie',        // préservé (niveau 2 « habilite » à venir, #8)
    renewedOn: current.renewed_on,           // préservé : sinon la date d'émission dériverait (#27)
  });

  return {
    handle,
    ...after,
    before,
    changed,
    statusIndex,
    photoUrl,
    photoChanged: photoUrl !== '',
    photoPath: photoPathFor(handle),
    issueNumber: issue.number,
    path: recordPathFor(handle),
    branch: `maj/${handle}-${issue.number}`,
    yaml,
  };
}
