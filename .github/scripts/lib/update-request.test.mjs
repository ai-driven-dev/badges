import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RequestError, toMemberYaml } from './certification-request.mjs';
import { parseMemberYaml } from './credential.mjs';
import { buildMemberUpdate } from './update-request.mjs';

const PHOTO_MD = '![moi](https://github.com/user-attachments/assets/abc)';

// Fiche existante, écrite dans la forme canonique (comme l'intake la produit).
function existingRecord(overrides = {}) {
  return toMemberYaml({
    handle: 'jdupont',
    name: 'Jean Dupont',
    linkedin: 'https://www.linkedin.com/in/jd',
    website: '',
    description: '',
    statusIndex: 5,
    ...overrides,
  });
}

// Corps d'issue de mise à jour : chaque champ non fourni = « _No response_ » (inchangé).
function issueBody({ name, linkedin, website, description, photo } = {}) {
  return [
    `### Nom complet\n\n${name || '_No response_'}`,
    `### Profil LinkedIn\n\n${linkedin || '_No response_'}`,
    `### Site web\n\n${website || '_No response_'}`,
    `### Description\n\n${description || '_No response_'}`,
    `### Photo\n\n${photo || '_No response_'}`,
  ].join('\n\n');
}

function issue(body = {}, overrides = {}) {
  return { number: 12, user: { login: 'jdupont' }, body: issueBody(body), ...overrides };
}

describe('buildMemberUpdate — champs', () => {
  it('met à jour uniquement le champ fourni, garde les autres', () => {
    const u = buildMemberUpdate(issue({ description: 'Nouvelle bio.' }), existingRecord());
    assert.equal(u.description, 'Nouvelle bio.');
    assert.equal(u.name, 'Jean Dupont');       // inchangé
    assert.equal(u.linkedin, 'https://www.linkedin.com/in/jd');
    assert.equal(u.changed, true);
    assert.equal(u.photoChanged, false);
  });

  it('un formulaire entièrement vide ne change rien (changed=false)', () => {
    const u = buildMemberUpdate(issue({}), existingRecord({ description: 'Bio' }));
    assert.equal(u.changed, false);
    assert.equal(u.name, 'Jean Dupont');
    assert.equal(u.description, 'Bio');
  });

  it('détecte une nouvelle photo', () => {
    const u = buildMemberUpdate(issue({ photo: PHOTO_MD }), existingRecord());
    assert.equal(u.photoChanged, true);
    assert.equal(u.photoUrl, 'https://github.com/user-attachments/assets/abc');
    assert.equal(u.changed, true);
  });

  it('rejette un LinkedIn non https/linkedin', () => {
    assert.throws(() => buildMemberUpdate(issue({ linkedin: 'http://x.com' }), existingRecord()), RequestError);
  });

  it('rejette un site non https', () => {
    assert.throws(() => buildMemberUpdate(issue({ website: 'ftp://x' }), existingRecord()), RequestError);
  });

  it('expose le diff avant/après', () => {
    const u = buildMemberUpdate(issue({ name: 'Jeanne Dupont' }), existingRecord());
    assert.equal(u.before.name, 'Jean Dupont');
    assert.equal(u.name, 'Jeanne Dupont');
  });
});

describe('buildMemberUpdate — invariants de préservation', () => {
  it('préserve status_index et role', () => {
    const u = buildMemberUpdate(issue({ name: 'X' }), existingRecord({ role: 'habilite', statusIndex: 9 }));
    assert.equal(u.statusIndex, 9);
    assert.match(u.yaml, /status_index: 9/);
    assert.match(u.yaml, /role: "habilite"/);
  });

  it('la branche est dérivée du handle + numéro d’issue', () => {
    const u = buildMemberUpdate(issue({ name: 'X' }), existingRecord());
    assert.equal(u.branch, 'maj/jdupont-12');
    assert.equal(u.path, 'data/members/jdupont/record.yml');
  });

  // Trap #2 (advisor) : la régénération ne doit perdre AUCUN champ. Round-trip
  // byte-identical d'une fiche complète prouve que credential et date d'émission
  // (qui dépendent de handle + status_index + certified_on) restent intacts.
  it('round-trip byte-identical d’une fiche complète (dont renewed_on)', () => {
    const full = toMemberYaml({
      handle: 'jdupont',
      name: 'Jean Dupont',
      linkedin: 'https://www.linkedin.com/in/jd',
      website: 'https://jd.fr',
      description: 'Bio complète.',
      statusIndex: 5,
      role: 'certifie',
      renewedOn: '2027-01-01T00:00:00Z',
    });
    // Formulaire vide -> régénération pure de l'existant.
    const u = buildMemberUpdate(issue({}), full);
    assert.equal(u.yaml, full);
    // Et la fiche reparse à l'identique.
    assert.deepEqual(parseMemberYaml(u.yaml), parseMemberYaml(full));
  });
});
