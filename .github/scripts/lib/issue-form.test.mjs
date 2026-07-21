import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clean, normalizeHeading, parseIssueFormBody } from './issue-form.mjs';

describe('clean', () => {
  it('normalise les retours chariot Windows en sauts de ligne simples', () => {
    const normalized = clean('a\r\nb');
    assert.equal(normalized, 'a\nb');
  });

  it('retire les espaces de début et de fin', () => {
    const trimmed = clean('  bonjour  ');
    assert.equal(trimmed, 'bonjour');
  });

  it('rend une chaîne vide pour une valeur nulle ou indéfinie', () => {
    assert.equal(clean(null), '');
    assert.equal(clean(undefined), '');
  });
});

describe('normalizeHeading', () => {
  it('met en minuscules et réduit la ponctuation à des espaces simples', () => {
    const key = normalizeHeading('Profil LinkedIn :');
    assert.equal(key, 'profil linkedin');
  });

  it('fusionne les séparateurs multiples en un seul espace', () => {
    const key = normalizeHeading('Nom---complet');
    assert.equal(key, 'nom complet');
  });
});

describe('parseIssueFormBody', () => {
  it('associe chaque heading à la valeur qui le suit', () => {
    const body = '### Nom complet\n\nJean Dupont\n\n### Profil LinkedIn\n\nhttps://linkedin.com/in/jd';

    const fields = parseIssueFormBody(body);

    assert.equal(fields['nom complet'], 'Jean Dupont');
    assert.equal(fields['profil linkedin'], 'https://linkedin.com/in/jd');
  });

  it('retire les commentaires HTML de métadonnées du formulaire', () => {
    const body = '### Nom complet\n\n<!-- meta -->\nMarie Curie';

    const fields = parseIssueFormBody(body);

    assert.equal(fields['nom complet'], 'Marie Curie');
  });

  it('ignore le texte présent avant le premier heading', () => {
    const body = 'préambule ignoré\n### Nom complet\n\nAda';

    const fields = parseIssueFormBody(body);

    assert.deepEqual(Object.keys(fields), ['nom complet']);
    assert.equal(fields['nom complet'], 'Ada');
  });

  it('rend un objet vide pour un corps vide', () => {
    const fields = parseIssueFormBody('');
    assert.deepEqual(fields, {});
  });
});
