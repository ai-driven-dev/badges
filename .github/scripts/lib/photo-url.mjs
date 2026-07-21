// Extraction d'URL et chemin de photo — pur, sans dépendance (pas de sharp).
// Séparé de photo.mjs pour que le parsing d'intake n'entraîne pas libvips.

export const PHOTO_DIR = 'data/members/photos';

/** Chemin LFS de la photo d'un membre. */
export function photoPathFor(handle) {
  return `${PHOTO_DIR}/${handle}.webp`;
}

/** Extrait l'URL d'image d'un champ Issue Form (markdown ![alt](url) ou URL nue). */
export function extractImageUrl(field) {
  const text = String(field ?? '');
  const md = text.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/);
  if (md) return md[1];
  const bare = text.match(/https?:\/\/\S+/);
  return bare ? bare[0] : null;
}
