// Registre de révocation (#36) : data/revoked.json = les status_index révoqués.
// C'est la SEULE donnée qui survit à un retrait RGPD — un entier n'est pas une
// donnée personnelle. Le dossier du membre, lui, est entièrement supprimé.
// La révocation est réservée au retrait (CT-5), donc « révoqué » == « retiré ».

export const LEDGER_PATH = 'data/revoked.json';

/** Parse le registre (tolérant : objet {revoked:[...]}, tableau, ou vide). */
export function parseLedger(text) {
  if (!text || !text.trim()) return [];
  let data;
  try { data = JSON.parse(text); } catch { return []; }
  const list = Array.isArray(data) ? data : (data.revoked ?? []);
  return normalize(list);
}

/** Indices entiers positifs, dédupliqués et triés. */
export function normalize(list) {
  return [...new Set((list || []).map(Number).filter((n) => Number.isInteger(n) && n >= 0))].sort((a, b) => a - b);
}

/** Ajoute un index au registre (idempotent). */
export function addIndex(indices, index) {
  return normalize([...indices, index]);
}

/** Sérialise le registre pour écriture. */
export function serializeLedger(indices) {
  return JSON.stringify({ revoked: normalize(indices) }, null, 2) + '\n';
}
