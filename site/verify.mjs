// Vérification d'un badge OB3 VC-JWT (RS256) — INDÉPENDANTE du serveur AIDD.
// Ne lit que des fichiers statiques (le JWT et la clé publique) et vérifie la
// signature avec Web Crypto. Fonctionne en navigateur et en Node (crypto.subtle,
// atob, fetch y sont globaux). Aucune dépendance.

const STATE = Object.freeze({
  VALID: 'valid',
  EXPIRED: 'expired',
  NOT_YET_VALID: 'not_yet_valid',
  REVOKED: 'revoked',
  INVALID: 'invalid',   // signature fausse, forgé, ou preuve absente
});
export { STATE };

/** base64url -> Uint8Array. */
export function base64urlToBytes(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

import { decodeBitstring, getBit } from './bitstring.mjs';

const decodeJson = (b64url) => JSON.parse(new TextDecoder().decode(base64urlToBytes(b64url)));

/** Découpe un JWT compact en header/payload/signature + entrée de signature. */
export function decodeJwt(jwt) {
  const parts = String(jwt).trim().split('.');
  if (parts.length !== 3) throw new Error('JWT malformé');
  const [h, p, s] = parts;
  return {
    header: decodeJson(h),
    payload: decodeJson(p),
    signingInput: new TextEncoder().encode(`${h}.${p}`),
    signature: base64urlToBytes(s),
  };
}

/** Vérifie la signature RS256 du JWT avec une clé publique JWK (RSA). */
export async function verifySignature({ signingInput, signature }, jwk) {
  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
  );
  return crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, signature, signingInput);
}

/** Fenêtre de validité temporelle -> VALID / EXPIRED / NOT_YET_VALID. */
export function evaluateValidity(payload, now = new Date()) {
  const t = Math.floor(now.getTime() / 1000);
  if (payload.exp && t >= payload.exp) return STATE.EXPIRED;
  if (payload.nbf && t < payload.nbf) return STATE.NOT_YET_VALID;
  return STATE.VALID;
}

/** Détails lisibles extraits du credential (pour affichage). */
export function readDetails(payload) {
  const subject = payload.credentialSubject || {};
  return {
    handle: (subject.id || '').replace('https://github.com/', ''),
    subjectId: subject.id,
    achievement: subject.achievement?.name,
    issuer: payload.issuer?.name,
    validFrom: payload.validFrom,
    validUntil: payload.validUntil,
  };
}

/**
 * Contrôle de révocation via Bitstring Status List (CT-4).
 * Récupère le credential de statut (VC-JWT signé), vérifie sa signature, décode
 * le bitstring et lit le bit du credential.
 * @returns {{ revoked: boolean, checked: boolean }}
 */
export async function checkRevocation(status, { getJwt, getKey }) {
  if (!status) return { revoked: false, checked: true }; // pas de credentialStatus -> rien à vérifier
  try {
    const jwt = (await getJwt(status.statusListCredential)).trim();
    const decoded = decodeJwt(jwt);
    const jwk = await getKey(decoded.header.kid);
    if (!(await verifySignature(decoded, jwk))) return { revoked: false, checked: false };
    const bytes = await decodeBitstring(decoded.payload.credentialSubject.encodedList);
    return { revoked: getBit(bytes, Number(status.statusListIndex)), checked: true };
  } catch {
    return { revoked: false, checked: false }; // statut injoignable -> non concluant
  }
}

/**
 * Vérifie un badge de bout en bout.
 * @param {string} jwt
 * @param {{ fetchKey?, fetchStatus?, now?: Date }} deps
 *   fetchKey/fetchStatus injectables pour les tests.
 * @returns {{ state, details, header, payload, statusUnknown? }}
 */
export async function verifyBadge(jwt, { fetchKey, fetchStatus, now = new Date() } = {}) {
  let decoded;
  try { decoded = decodeJwt(jwt); }
  catch { return { state: STATE.INVALID, reason: 'preuve illisible' }; }

  const kidUrl = decoded.header.kid;
  const getKey = fetchKey || (async (url) => (await fetch(url)).json());

  let jwk;
  try { jwk = await getKey(kidUrl); }
  catch { return { state: STATE.INVALID, reason: 'clé publique introuvable' }; }

  const signatureOk = await verifySignature(decoded, jwk).catch(() => false);
  if (!signatureOk) return { state: STATE.INVALID, reason: 'signature invalide' };

  const details = { ...readDetails(decoded.payload), kidUrl };
  const getJwt = fetchStatus || (async (url) => (await fetch(url)).text());
  const revocation = await checkRevocation(decoded.payload.credentialStatus, { getJwt, getKey });
  if (revocation.revoked) return { state: STATE.REVOKED, details, header: decoded.header, payload: decoded.payload };

  const state = evaluateValidity(decoded.payload, now);
  return { state, details, header: decoded.header, payload: decoded.payload, statusUnknown: !revocation.checked };
}
