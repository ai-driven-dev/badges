// Téléchargement gardé + normalisation WebP 512×512 sans EXIF (sharp).
// Décision de faisabilité : SP2. L'extraction d'URL / le chemin sont dans photo-url.mjs.
import sharp from 'sharp';

export const MAX_BYTES = 10 * 1024 * 1024; // garde-fou téléchargement
export { PHOTO_DIR, photoPathFor, extractImageUrl } from './photo-url.mjs';

/**
 * Télécharge une image, en refusant ce qui n'est pas une image ou est trop lourd.
 * @param {string} url
 * @param {{ token?: string, fetchImpl?: typeof fetch }} deps
 * @returns {Promise<Uint8Array>}
 */
export async function downloadImage(url, { token, fetchImpl = fetch } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetchImpl(url, { headers, redirect: 'follow' });
  if (!res.ok) throw new Error(`téléchargement échoué : HTTP ${res.status}`);
  const type = res.headers.get('content-type') || '';
  if (!type.startsWith('image/')) throw new Error(`la réponse n'est pas une image (${type})`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error('image trop lourde');
  return bytes;
}

/**
 * Normalise en WebP 512×512, orientation appliquée puis jetée, EXIF non recopié
 * (sharp ne conserve pas les métadonnées sans withMetadata()).
 * @param {Uint8Array|Buffer} input
 * @returns {Promise<Buffer>}
 */
export function normalizeToWebp(input) {
  return sharp(input)
    .rotate()
    .resize(512, 512, { fit: 'cover', position: 'attention' })
    .webp({ quality: 82 })
    .toBuffer();
}
