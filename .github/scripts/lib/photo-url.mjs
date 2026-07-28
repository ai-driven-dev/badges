// Extraction d'URL d'image — pur, sans dépendance (pas de sharp).
// Le chemin de la photo sur disque vit dans member-paths.mjs.

/** Extrait l'URL d'image d'un champ Issue Form.
 *  Gère les trois formes : markdown `![alt](url)`, balise HTML `<img ... src="url">`
 *  (le drag-drop GitHub insère désormais ça), et URL nue. */
export function extractImageUrl(field) {
  const text = String(field ?? '');
  const md = text.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/);
  if (md) return md[1];
  const html = text.match(/<img[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
  if (html) return html[1];
  // URL nue : s'arrête aux délimiteurs (guillemets, chevrons, parenthèses) pour ne pas
  // capter un caractère de fin de balise/markdown collé à l'URL.
  const bare = text.match(/https?:\/\/[^\s"'<>)]+/);
  return bare ? bare[0] : null;
}
