// Construction du credential Open Badges 3.0 (forme prouvée conforme au validateur
// 1EdTech, spike SP4). Fonctions pures : la signature est faite ailleurs (jose).

export const DEFAULT_BASE = 'https://verify.ai-driven-dev.fr';

/** Parse un enregistrement YAML plat `clé: "valeur"` (valeurs échappées en JSON). */
export function parseMemberYaml(text) {
  const record = {};
  for (const line of String(text ?? '').replace(/\r\n/g, '\n').split('\n')) {
    const match = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (value.startsWith('"')) {
      try { value = JSON.parse(value); } catch { /* garde la valeur brute */ }
    }
    record[match[1]] = value;
  }
  return record;
}

/** Date ISO sans millisecondes (forme attendue dans validFrom/validUntil). */
export function isoSeconds(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Ajoute des années à une date sans muter l'entrée. */
export function addYears(date, years) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

/** urn:uuid déterministe dérivé du handle et de la date d'émission. */
export function deterministicUuid(handle, date) {
  const seed = `${handle}:${date.getTime()}`;
  let x = 0;
  for (const ch of seed) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  const hex = (n) => (n >>> 0).toString(16).padStart(8, '0');
  const a = hex(x);
  const b = hex(x * 2654435761);
  const c = hex(x ^ 0x9e3779b9);
  const e = hex(x * 40503);
  // Dernier nœud = 12 hex : c.slice(4) (4) + e (8).
  return `urn:uuid:${a}-${b.slice(0, 4)}-4${b.slice(5, 8)}-8${c.slice(1, 4)}-${c.slice(4)}${e}`;
}

/** URL de la Bitstring Status List (révocation, CT-4). */
export function statusListUrl(base = DEFAULT_BASE) {
  return `${base}/status/1`;
}

/**
 * Assemble le credential OB3 pour un membre.
 * @param {{handle,name,statusIndex}} member
 * @param {{certifiedOn: Date, base?: string}} options
 */
export function buildCredential(member, { certifiedOn, base = DEFAULT_BASE }) {
  if (!member?.handle) throw new Error('handle requis');
  if (!member?.name) throw new Error('name requis');
  if (!(certifiedOn instanceof Date) || Number.isNaN(certifiedOn.getTime())) {
    throw new Error('certifiedOn doit être une Date valide');
  }
  if (!Number.isInteger(member.statusIndex) || member.statusIndex < 0) {
    throw new Error('statusIndex doit être un entier positif');
  }

  const expiresOn = addYears(certifiedOn, 1); // CT-8 / #24
  const subject = {
    id: `https://github.com/${member.handle}`, // liaison identité GitHub (CT-3 / #26)
    type: ['AchievementSubject'],
    achievement: {
      id: `${base}/achievements/certified-member`,
      type: ['Achievement'],
      name: 'Certified Member',
      description: 'Membre certifié de la communauté AI-Driven Development.',
      criteria: { narrative: 'Décerné après réussite de la masterclass évaluée et validation par la Core Team.' },
    },
  };

  return {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: deterministicUuid(member.handle, certifiedOn),
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: `${base}/issuer.json`, type: ['Profile'], name: 'AI-Driven Development', url: 'https://ai-driven-dev.fr' },
    validFrom: isoSeconds(certifiedOn),
    validUntil: isoSeconds(expiresOn),
    credentialStatus: {
      id: `${statusListUrl(base)}#${member.statusIndex}`,
      type: 'BitstringStatusListEntry',
      statusPurpose: 'revocation',
      statusListIndex: String(member.statusIndex),
      statusListCredential: statusListUrl(base),
    },
    credentialSubject: subject,
  };
}

/** URL déréférençable de la clé publique (JWK nu par kid, contrainte SP4). */
export function keyUrl(kid, base = DEFAULT_BASE) {
  return `${base}/keys/${kid}.json`;
}
