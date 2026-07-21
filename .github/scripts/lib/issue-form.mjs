// Parsing d'un corps d'issue GitHub Issue Form : chaque champ y est rendu comme
// `### <label>` suivi de sa valeur. Fonctions pures, sans I/O.

/** Normalise fins de ligne et espaces de bord. */
export function clean(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').trim();
}

/** Réduit un heading à une clé stable : minuscules, alphanumérique + espaces simples. */
export function normalizeHeading(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Découpe le corps d'un Issue Form en { heading normalisé -> valeur nettoyée }.
 * Les commentaires HTML (métadonnées du form) sont retirés.
 */
export function parseIssueFormBody(body) {
  const sections = {};
  let current = null;

  for (const line of clean(body).split('\n')) {
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      current = normalizeHeading(heading[1]);
      sections[current] = [];
    } else if (current) {
      sections[current].push(line);
    }
  }

  return Object.fromEntries(
    Object.entries(sections).map(([key, lines]) => [
      key,
      clean(lines.join('\n').replace(/<!--[\s\S]*?-->/g, '')),
    ]),
  );
}
