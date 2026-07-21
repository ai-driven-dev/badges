import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseLedger, normalize, addIndex, serializeLedger } from './revocation.mjs';

describe('parseLedger', () => {
  it('lit la forme { revoked: [...] }', () => {
    assert.deepEqual(parseLedger('{"revoked":[3,1]}'), [1, 3]);
  });

  it('lit un tableau nu', () => {
    assert.deepEqual(parseLedger('[2,2,0]'), [0, 2]);
  });

  it('rend une liste vide pour un contenu vide ou invalide', () => {
    assert.deepEqual(parseLedger(''), []);
    assert.deepEqual(parseLedger('pas du json'), []);
  });
});

describe('normalize', () => {
  it('déduplique, trie et écarte les valeurs non entières/négatives', () => {
    assert.deepEqual(normalize([5, 5, 1, -1, 'x', 2.5, 3]), [1, 3, 5]);
  });
});

describe('addIndex', () => {
  it('ajoute un index absent', () => {
    assert.deepEqual(addIndex([1, 2], 5), [1, 2, 5]);
  });

  it('est idempotent pour un index déjà présent', () => {
    assert.deepEqual(addIndex([1, 2], 2), [1, 2]);
  });
});

describe('serializeLedger', () => {
  it('sérialise sous la forme { revoked: [...] } normalisée', () => {
    assert.equal(serializeLedger([3, 1, 1]), '{\n  "revoked": [\n    1,\n    3\n  ]\n}\n');
  });
});
