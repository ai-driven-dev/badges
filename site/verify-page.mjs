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
 * Rend le résultat dans le conteneur. `base` = dossier du membre (sans slash final) ;
 * `origin` = origine absolue (pour donner l'URL publique de la preuve). Le QR n'est
 * PAS affiché ici (il pointerait vers cette page même — boucle) : seulement en
 * téléchargement. Pur DOM, testable via une racine injectée.
 */
export function render(root, result, base = '.', origin = '') {
  const label = LABELS[result.state] || LABELS[STATE.INVALID];
  const d = result.details || {};
  const proofUrl = `${origin}${base}/credential.jwt`;
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
      <p class="downloads">
        <a href="${base}/credential.jwt" download="credential.jwt">⤓ Télécharger la preuve</a>
        <a href="${base}/qr.svg" download="qr.svg">⤓ QR code (à afficher ailleurs)</a>
      </p>
      <p class="third-party">Vérifier avec un outil indépendant :
      dépose la preuve sur <a href="https://vc.1ed.tech" rel="noopener">le validateur public 1EdTech</a>,
      ou donne-lui l'URL de la preuve :<br><code>${proofUrl}</code></p>`;

  root.className = `result ${label.tone}`;
  root.innerHTML = `
    <h1>${label.title}</h1>
    ${rows}
    <p class="independent">Signature vérifiée dans votre navigateur, sans dépendre d'un serveur AIDD.</p>`;
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
  const origin = (doc.location && doc.location.origin) || '';
  try {
    const jwt = await (await fetchImpl(`${base}/credential.jwt`)).text();
    const result = await verifyBadge(jwt.trim());
    render(root, result, base, origin);
  } catch {
    render(root, { state: STATE.INVALID, reason: 'Aucune preuve trouvée à cette adresse.' });
  }
}
