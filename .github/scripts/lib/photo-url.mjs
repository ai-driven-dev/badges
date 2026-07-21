// Extraction d'URL d'image — pur, sans dépendance (pas de sharp).
// Le chemin de la photo sur disque vit dans member-paths.mjs.

/** Extrait l'URL d'image d'un champ Issue Form (markdown ![alt](url) ou URL nue). */
export function extractImageUrl(field) {
  const text = String(field ?? '');
  const md = text.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/);
  if (md) return md[1];
  const bare = text.match(/https?:\/\/\S+/);
  return bare ? bare[0] : null;
}
