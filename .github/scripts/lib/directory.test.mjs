import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDirectory, toDirectoryEntry, isActive, photoUrlFor } from './directory.mjs';

const member = (over = {}) => ({
  github: 'jd', name: 'Jean Dupont', role: 'certifie',
  linkedin: 'https://linkedin.com/in/jd', ...over,
});

describe('photoUrlFor', () => {
  it('pointe vers la photo servie sur le domaine de vérif', () => {
    assert.equal(photoUrlFor('jd'), 'https://verify.ai-driven-dev.fr/photos/jd.webp');
  });
});

describe('toDirectoryEntry', () => {
  it('expose les champs publics d\'affichage', () => {
    const e = toDirectoryEntry(member());
    assert.equal(e.handle, 'jd');
    assert.equal(e.name, 'Jean Dupont');
    assert.equal(e.linkedin, 'https://linkedin.com/in/jd');
    assert.equal(e.photo, 'https://verify.ai-driven-dev.fr/photos/jd.webp');
    assert.equal(e.verify, 'https://verify.ai-driven-dev.fr/u/jd');
  });

  it('omet site et description quand absents', () => {
    const e = toDirectoryEntry(member());
    assert.ok(!('website' in e));
    assert.ok(!('description' in e));
  });

  it('inclut site et description quand fournis', () => {
    const e = toDirectoryEntry(member({ website: 'https://jd.fr', description: 'Dev IA' }));
    assert.equal(e.website, 'https://jd.fr');
    assert.equal(e.description, 'Dev IA');
  });
});

describe('isActive', () => {
  it('considère actif un membre sans marqueur de révocation', () => {
    assert.equal(isActive(member()), true);
  });

  it('considère inactif un membre révoqué', () => {
    assert.equal(isActive(member({ revoked: 'true' })), false);
  });
});

describe('buildDirectory', () => {
  it('trie les membres actifs par nom', () => {
    const dir = buildDirectory([
      member({ github: 'z', name: 'Zoé' }),
      member({ github: 'a', name: 'Ada' }),
    ]);
    assert.deepEqual(dir.members.map((m) => m.name), ['Ada', 'Zoé']);
    assert.equal(dir.count, 2);
  });

  it('exclut les membres révoqués (retrait, #35)', () => {
    const dir = buildDirectory([
      member({ github: 'a', name: 'Ada' }),
      member({ github: 'b', name: 'Bob', revoked: 'true' }),
    ]);
    assert.deepEqual(dir.members.map((m) => m.handle), ['a']);
    assert.equal(dir.count, 1);
  });

  it('reporte l\'horodatage de génération fourni', () => {
    const dir = buildDirectory([], { generatedAt: '2026-07-21T10:00:00Z' });
    assert.equal(dir.generatedAt, '2026-07-21T10:00:00Z');
  });
});
