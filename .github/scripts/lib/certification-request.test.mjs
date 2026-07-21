import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  RequestError,
  buildMemberRecord,
  parseHandle,
  parseName,
  parseLinkedin,
  parseWebsite,
  parsePhotoUrl,
  parseDescription,
  toMemberYaml,
} from './certification-request.mjs';

const PHOTO_MD = '![moi](https://github.com/user-attachments/assets/abc)';

function issueBody({ name = 'Jean Dupont', linkedin = 'https://www.linkedin.com/in/jd', website = '', description = '', photo = PHOTO_MD } = {}) {
  return [
    `### Nom complet\n\n${name}`,
    `### Profil LinkedIn\n\n${linkedin}`,
    `### Site web\n\n${website || '_No response_'}`,
    `### Description\n\n${description || '_No response_'}`,
    `### Photo\n\n${photo || '_No response_'}`,
  ].join('\n\n');
}

function issue(overrides = {}) {
  return { number: 7, user: { login: 'jdupont' }, body: issueBody(), ...overrides };
}

describe('parseHandle', () => {
  it('accepte un handle GitHub valide', () => {
    assert.equal(parseHandle('octo-cat'), 'octo-cat');
  });

  it('rejette un handle contenant un caractère interdit', () => {
    assert.throws(() => parseHandle('bad/handle'), RequestError);
  });

  it('rejette un handle vide', () => {
    assert.throws(() => parseHandle(''), RequestError);
  });
});

describe('parseName', () => {
  it('rend le nom quand il est présent sur une ligne', () => {
    const name = parseName({ 'nom complet': 'Marie Curie' });
    assert.equal(name, 'Marie Curie');
  });

  it('rejette un nom manquant', () => {
    assert.throws(() => parseName({ 'nom complet': '' }), RequestError);
  });

  it('rejette un nom au-delà de la limite de caractères', () => {
    const tooLong = 'x'.repeat(121);
    assert.throws(() => parseName({ 'nom complet': tooLong }), RequestError);
  });
});

describe('parseLinkedin', () => {
  it('accepte une URL https linkedin.com', () => {
    const url = parseLinkedin({ 'profil linkedin': 'https://linkedin.com/in/jd' });
    assert.equal(url, 'https://linkedin.com/in/jd');
  });

  it('rejette une URL qui n\'est pas sur linkedin.com', () => {
    assert.throws(() => parseLinkedin({ 'profil linkedin': 'https://example.com/jd' }), RequestError);
  });

  it('rejette une URL non https', () => {
    assert.throws(() => parseLinkedin({ 'profil linkedin': 'http://linkedin.com/in/jd' }), RequestError);
  });

  it('rejette un LinkedIn manquant', () => {
    assert.throws(() => parseLinkedin({ 'profil linkedin': '' }), RequestError);
  });
});

describe('parseWebsite', () => {
  it('rend une chaîne vide quand le champ est laissé à _No response_', () => {
    const site = parseWebsite({ 'site web': '_No response_' });
    assert.equal(site, '');
  });

  it('accepte une URL https fournie', () => {
    const site = parseWebsite({ 'site web': 'https://jd.fr' });
    assert.equal(site, 'https://jd.fr');
  });

  it('rejette une URL non https fournie', () => {
    assert.throws(() => parseWebsite({ 'site web': 'http://jd.fr' }), RequestError);
  });
});

describe('parsePhotoUrl', () => {
  it('extrait l\'URL d\'une image collée en markdown', () => {
    const url = parsePhotoUrl({ photo: '![x](https://github.com/user-attachments/assets/abc)' });
    assert.equal(url, 'https://github.com/user-attachments/assets/abc');
  });

  it('rejette une demande sans photo', () => {
    assert.throws(() => parsePhotoUrl({ photo: '_No response_' }), RequestError);
  });
});

describe('parseDescription', () => {
  it('rend une chaîne vide quand absente', () => {
    assert.equal(parseDescription({ description: '_No response_' }), '');
  });

  it('rend la description fournie', () => {
    assert.equal(parseDescription({ description: 'Dev IA' }), 'Dev IA');
  });

  it('rejette une description au-delà de la limite', () => {
    assert.throws(() => parseDescription({ description: 'x'.repeat(281) }), RequestError);
  });
});

describe('toMemberYaml', () => {
  const base = { handle: 'jd', name: 'Jean', linkedin: 'https://linkedin.com/in/jd', website: '', statusIndex: 0 };

  it('omet la ligne site quand aucun site n\'est fourni', () => {
    const yaml = toMemberYaml(base);
    assert.ok(!yaml.includes('website'));
  });

  it('inclut la ligne site quand un site est fourni', () => {
    const yaml = toMemberYaml({ ...base, website: 'https://jd.fr' });
    assert.match(yaml, /website: "https:\/\/jd\.fr"/);
  });

  it('échappe un nom contenant guillemets et deux-points pour neutraliser l\'injection YAML', () => {
    const yaml = toMemberYaml({ ...base, name: 'Evil: "x"' });
    assert.match(yaml, /name: "Evil: \\"x\\""/);
  });

  it('inscrit l\'index de statut', () => {
    const yaml = toMemberYaml({ ...base, statusIndex: 12 });
    assert.match(yaml, /status_index: 12/);
  });

  it('inscrit le chemin LFS de la photo dans le dossier du membre', () => {
    const yaml = toMemberYaml({ ...base, handle: 'octocat' });
    assert.match(yaml, /photo: "data\/members\/octocat\/photo\.webp"/);
  });

  it('inscrit la description quand fournie', () => {
    const yaml = toMemberYaml({ ...base, description: 'Dev IA' });
    assert.match(yaml, /description: "Dev IA"/);
  });

  it('omet la description quand absente', () => {
    const yaml = toMemberYaml({ ...base, description: '' });
    assert.ok(!yaml.includes('description:'));
  });

  it('rejette un index de statut absent', () => {
    assert.throws(() => toMemberYaml({ ...base, statusIndex: undefined }), RequestError);
  });
});

describe('buildMemberRecord', () => {
  it('dérive l\'identité du compte auteur, pas d\'un champ saisi', () => {
    const record = buildMemberRecord(issue({ user: { login: 'octocat' } }), 0);
    assert.equal(record.handle, 'octocat');
    assert.equal(record.path, 'data/members/octocat/record.yml');
  });

  it('construit la branche à partir du handle et du numéro d\'issue', () => {
    const record = buildMemberRecord(issue({ number: 42, user: { login: 'octocat' } }), 0);
    assert.equal(record.branch, 'certif/octocat-42');
  });

  it('produit un YAML complet pour une demande valide avec site', () => {
    const record = buildMemberRecord(issue({ body: issueBody({ website: 'https://jd.fr' }) }), 3);
    assert.match(record.yaml, /github: "jdupont"/);
    assert.match(record.yaml, /role: "certifie"/);
    assert.match(record.yaml, /website: "https:\/\/jd\.fr"/);
  });

  it('inscrit l\'index de statut permanent assigné', () => {
    const record = buildMemberRecord(issue(), 7);
    assert.equal(record.statusIndex, 7);
    assert.match(record.yaml, /status_index: 7/);
  });

  it('expose l\'URL de la photo et son chemin LFS', () => {
    const record = buildMemberRecord(issue({ user: { login: 'octocat' } }), 0);
    assert.equal(record.photoUrl, 'https://github.com/user-attachments/assets/abc');
    assert.equal(record.photoPath, 'data/members/octocat/photo.webp');
  });

  it('rejette une demande sans photo', () => {
    assert.throws(() => buildMemberRecord(issue({ body: issueBody({ photo: '_No response_' }) }), 0), RequestError);
  });

  it('rejette une demande dont le LinkedIn est manquant', () => {
    assert.throws(() => buildMemberRecord(issue({ body: issueBody({ linkedin: '_No response_' }) }), 0), RequestError);
  });
});
