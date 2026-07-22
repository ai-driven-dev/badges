// Contrôleur de la page de vérification (#29/#30/#39). Charge le credential du
// membre, le vérifie côté navigateur (indépendamment du serveur), et rend l'état.
import { verifyBadge, STATE } from './verify.mjs';

const LABELS = {
  [STATE.VALID]: { title: 'Badge valide', tone: 'ok' },
  [STATE.EXPIRED]: { title: 'Badge expiré', tone: 'warn' },
  [STATE.NOT_YET_VALID]: { title: 'Badge pas encore valide', tone: 'warn' },
  [STATE.REVOKED]: { title: 'Badge révoqué', tone: 'bad' },
  [STATE.INVALID]: { title: 'Badge invalide', tone: 'bad' },
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return iso; }
};

/**
 * Rend le résultat dans le conteneur. `base` = dossier du membre (sans slash final),
 * pour que QR et téléchargements marchent que l'URL ait un slash final ou non.
 * Pur DOM, testable via une racine injectée.
 */
export function render(root, result, base = '.') {
  const label = LABELS[result.state] || LABELS[STATE.INVALID];
  const d = result.details || {};
  const rows = result.state === STATE.INVALID
    ? `<p class="reason">${result.reason || 'Ce badge n\'a pas pu être authentifié.'}</p>`
    : `
      <dl>
        <dt>Titulaire</dt><dd>@${d.handle || '—'}</dd>
        <dt>Distinction</dt><dd>${d.achievement || '—'}</dd>
        <dt>Émetteur</dt><dd>${d.issuer || '—'}</dd>
        <dt>Émis le</dt><dd>${fmtDate(d.validFrom)}</dd>
        <dt>Valable jusqu'au</dt><dd>${fmtDate(d.validUntil)}</dd>
      </dl>
      <figure class="qr">
        <img src="${base}/qr.svg" alt="QR code de vérification" width="140" height="140">
        <figcaption>Scanne pour vérifier</figcaption>
      </figure>
      <p class="downloads">
        <a href="${base}/qr.svg" download="qr.svg">⤓ QR code</a>
        <a href="${base}/credential.jwt" download="credential.jwt">⤓ Preuve brute (VC-JWT)</a>
      </p>`;

  root.className = `result ${label.tone}`;
  root.innerHTML = `
    <h1>${label.title}</h1>
    ${rows}
    <p class="independent">Signature vérifiée dans votre navigateur, sans dépendre d'un serveur AIDD.
    <a href="https://vc.1ed.tech" rel="noopener">Vérifier avec un outil tiers</a>.</p>`;
}

/**
 * Dossier du membre déduit de l'URL, robuste au slash final : /u/handle ET
 * /u/handle/ donnent tous deux la base /u/handle. (Le badge LinkedIn est sans slash.)
 */
export function memberBase(pathname) {
  return String(pathname || '').replace(/\/+$/, '') || '.';
}

/** URL de la preuve du membre. */
export function credentialUrl(pathname) {
  return `${memberBase(pathname)}/credential.jwt`;
}

/** Point d'entrée navigateur : lit la preuve, vérifie, rend dans #app. */
export async function mount(doc = document, fetchImpl = fetch) {
  const root = doc.getElementById('app');
  const base = memberBase(doc.location && doc.location.pathname);
  try {
    const jwt = await (await fetchImpl(`${base}/credential.jwt`)).text();
    const result = await verifyBadge(jwt.trim());
    render(root, result, base);
  } catch {
    render(root, { state: STATE.INVALID, reason: 'Aucune preuve trouvée à cette adresse.' });
  }
}
