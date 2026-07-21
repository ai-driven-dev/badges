// Lit une issue d'inscription au registre (#18) et en dérive l'enregistrement du
// membre (#19). Identité = auteur de l'issue (compte GitHub), jamais un champ saisi (CT-3).
// Aucune dépendance externe : parsing pur.
// La photo (#21) est traitée plus tard (SP2) — ignorée ici volontairement.
import { readFileSync, appendFileSync } from 'node:fs';

const MEMBER_DIR = 'data/members';
const NO_RESPONSE = '_No response_';
const LIMIT = Object.freeze({ github: 39, name: 120, linkedin: 200, website: 200 });
const GITHUB_HANDLE_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

// Le heading d'un champ Issue Form = son `label`, rendu en `### <label>`.
const HEADING = Object.freeze({
  name: 'nom complet',
  linkedin: 'profil linkedin',
  website: 'site web',
});

const clean = (v) => String(v ?? '').replace(/\r\n/g, '\n').trim();
const normalizeHeading = (v) => clean(v).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function parseIssueFormBody(body) {
  const fields = {};
  let heading = null;
  for (const line of clean(body).split('\n')) {
    const m = line.match(/^###\s+(.+?)\s*$/);
    if (m) { heading = normalizeHeading(m[1]); fields[heading] = []; }
    else if (heading) fields[heading].push(line);
  }
  return Object.fromEntries(
    Object.entries(fields).map(([k, lines]) => [
      k, clean(lines.join('\n').replace(/<!--[\s\S]*?-->/g, '')),
    ]),
  );
}

const optional = (v) => (v === NO_RESPONSE ? '' : v);
function oneLine(v, field) { if (v.includes('\n')) throw new Error(`${field} doit tenir sur une ligne`); return v; }
function underLimit(v, field, max) { if (v.length > max) throw new Error(`${field} dépasse ${max} caractères`); return v; }
function isHttpsUrl(v) { try { const u = new URL(v); return u.protocol === 'https:'; } catch { return false; } }
// Scalaire YAML sûr : double-quote via JSON (échappe guillemets, backslash, etc.).
const yaml = (v) => JSON.stringify(String(v));

function main() {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const issue = event.issue;

  const handle = clean(issue.user?.login);
  if (!GITHUB_HANDLE_RE.test(handle)) throw new Error(`handle GitHub invalide: ${handle}`);

  const f = parseIssueFormBody(issue.body || '');
  const name = underLimit(oneLine(clean(f[HEADING.name]), 'Nom'), 'Nom', LIMIT.name);
  if (!name) throw new Error('Nom requis');

  const linkedin = oneLine(clean(f[HEADING.linkedin]), 'LinkedIn');
  if (!linkedin) throw new Error('LinkedIn requis');
  underLimit(linkedin, 'LinkedIn', LIMIT.linkedin);
  if (!isHttpsUrl(linkedin) || !/linkedin\.com/i.test(linkedin)) throw new Error('LinkedIn doit être une URL https linkedin.com');

  const website = optional(oneLine(clean(f[HEADING.website]), 'Site'));
  if (website) { underLimit(website, 'Site', LIMIT.website); if (!isHttpsUrl(website)) throw new Error('Site doit être une URL https'); }

  const path = `${MEMBER_DIR}/${handle}.yml`;
  const branch = `certif/${handle}-${issue.number}`;

  const lines = [
    `github: ${yaml(handle)}`,
    `role: "certifie"`,
    `name: ${yaml(name)}`,
    `linkedin: ${yaml(linkedin)}`,
  ];
  if (website) lines.push(`website: ${yaml(website)}`);
  const record = lines.join('\n') + '\n';

  const out = process.env.GITHUB_OUTPUT;
  appendFileSync(out, `github=${handle}\n`);
  appendFileSync(out, `name=${name}\n`);
  appendFileSync(out, `path=${path}\n`);
  appendFileSync(out, `branch=${branch}\n`);
  appendFileSync(out, `issue_number=${issue.number}\n`);
  // Contenu multi-ligne via délimiteur.
  appendFileSync(out, `record<<__YAML__\n${record}__YAML__\n`);
  console.log(`Enregistrement prêt: ${path}`);
}

main();
