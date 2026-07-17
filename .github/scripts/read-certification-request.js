// Lit une demande de certification déposée via l'Issue Form et émet les valeurs
// consommées par le workflow (record YAML + métadonnées de PR).
// Calqué sur ai-driven-dev/manifest/.github/scripts/read-signature-request.js.
//
// Le handle GitHub vient de l'AUTEUR de l'issue (issue.user.login), jamais d'un
// champ saisi : c'est ce qui prouve le contrôle du compte à l'émission (PRD CT-3).

const { readFileSync, writeFileSync } = require('node:fs');

const MEMBER_DIR = 'data/members';
const NO_RESPONSE = '_No response_';
const ROLES = Object.freeze(['certifie', 'habilite']);

const LIMIT = Object.freeze({
  github: 39,
  name: 120,
  linkedin: 200,
});

// Libellés des champs de l'Issue Form (doivent correspondre à certification.yml).
const FIELD = Object.freeze({
  role: 'role',
  name: 'nom affiche',
  linkedin: 'profil linkedin',
  photo: 'photo',
});

const GITHUB_HANDLE_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
// GitHub réécrit une image collée en markdown : ![alt](https://.../image.png)
const IMAGE_URL_RE = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)|<img[^>]+src="(https?:\/\/[^"]+)"/i;

function clean(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').trim();
}

function normalizeHeading(value) {
  // Retire les accents (les labels de l'Issue Form sont en français : « Rôle »,
  // « Nom affiché »), sinon la normalisation transforme « ô » en espace.
  return clean(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseIssueFormBody(body) {
  const fields = {};
  let heading = null;
  for (const line of clean(body).split('\n')) {
    const match = line.match(/^###\s+(.+?)\s*$/);
    if (match) {
      heading = normalizeHeading(match[1]);
      fields[heading] = [];
    } else if (heading) {
      fields[heading].push(line);
    }
  }
  return Object.fromEntries(
    Object.entries(fields).map(([key, lines]) => [
      key,
      clean(lines.join('\n').replace(/<!--[\s\S]*?-->/g, '')),
    ]),
  );
}

function checkOneLine(value, field) {
  if (value.includes('\n')) throw new Error(`${field} doit tenir sur une ligne`);
  return value;
}
function checkLength(value, field) {
  if (LIMIT[field] && value.length > LIMIT[field]) throw new Error(`${field} : ${LIMIT[field]} caractères maximum`);
  return value;
}
function requiredText(value, field) {
  const text = clean(value);
  if (!text || text === NO_RESPONSE) throw new Error(`${field} est requis`);
  return checkLength(checkOneLine(text, field), field);
}
function optionalText(value, field) {
  const text = clean(value);
  if (!text || text === NO_RESPONSE) return '';
  return checkLength(checkOneLine(text, field), field);
}

function validateGithubHandle(value) {
  const github = clean(value);
  if (!GITHUB_HANDLE_RE.test(github)) throw new Error('handle GitHub invalide');
  return github;
}
function validateRole(value) {
  const role = clean(value).toLowerCase();
  if (!ROLES.includes(role)) throw new Error(`role doit être l'un de : ${ROLES.join(', ')}`);
  return role;
}
function validateLinkedIn(value) {
  const url = optionalText(value, 'linkedin');
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (['http:', 'https:'].includes(parsed.protocol)) return url;
  } catch {}
  throw new Error('linkedin doit être une URL valide');
}
// Extrait l'URL de la première image collée dans le champ photo. Le
// téléchargement + conversion WebP + strip EXIF + écriture LFS se font dans le
// workflow, pas ici (ce script reste sans effet de bord réseau).
function extractPhotoUrl(value) {
  const text = clean(value);
  if (!text || text === NO_RESPONSE) return '';
  const m = text.match(IMAGE_URL_RE);
  return m ? (m[1] || m[2] || '') : '';
}

function validateRequest(fields) {
  const github = validateGithubHandle(fields.github);
  return {
    github,
    role: validateRole(fields.role),
    name: requiredText(fields.name, 'name'),
    linkedin: validateLinkedIn(fields.linkedin),
    photoUrl: extractPhotoUrl(fields.photo),
    path: `${MEMBER_DIR}/${github}.yml`,
  };
}

function readIssueRequest(issue) {
  const fields = parseIssueFormBody(issue.body);
  return validateRequest({
    github: issue.user?.login,
    role: fields[FIELD.role],
    name: fields[FIELD.name],
    linkedin: fields[FIELD.linkedin],
    photo: fields[FIELD.photo],
  });
}

function yamlString(value) {
  return value ? JSON.stringify(value) : '';
}

function buildRequestOutputs(event) {
  if (!event.issue) throw new Error('événement issue requis');
  const req = readIssueRequest(event.issue);
  return {
    github: req.github,
    role: req.role,
    name: req.name,
    path: req.path,
    photo_url: req.photoUrl,
    branch: `certification/${req.github}-${event.issue.number}`,
    issue_number: event.issue.number,
    name_yaml: yamlString(req.name),
    linkedin_yaml: yamlString(req.linkedin),
  };
}

function writeOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`, { flag: 'a' });
}
function writeOutputs(outputs) {
  for (const [name, value] of Object.entries(outputs)) writeOutput(name, value);
}

function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const dryRun = process.argv.includes('--dry-run') || process.env.CERT_PR_DRY_RUN === '1';
  if (!eventPath) throw new Error('GITHUB_EVENT_PATH requis');
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  const outputs = buildRequestOutputs(event);
  if (dryRun) {
    console.log(JSON.stringify({ status: 'dry-run', ...outputs }, null, 2));
    return;
  }
  writeOutputs(outputs);
  console.log(JSON.stringify({ github: outputs.github, role: outputs.role, issue: outputs.issue_number, path: outputs.path }));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { buildRequestOutputs, validateRequest, extractPhotoUrl };
