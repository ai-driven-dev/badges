import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkStatusIndices } from './member-indices.mjs';

describe('checkStatusIndices', () => {
  it('accepte des index distincts hors registre', () => {
    const r = checkStatusIndices(
      [{ github: 'a', status_index: 1 }, { github: 'b', status_index: 2 }],
      [0],
    );
    assert.deepEqual(r, { ok: true });
  });

  it('rejette deux membres au même index', () => {
    const r = checkStatusIndices(
      [{ github: 'a', status_index: 3 }, { github: 'b', status_index: 3 }],
      [],
    );
    assert.equal(r.ok, false);
    assert.match(r.error, /partagé par @a et @b/);
  });

  it('rejette un membre actif sur un index révoqué (le bug blafourcade)', () => {
    const r = checkStatusIndices([{ github: 'blafourcade', status_index: 0 }], [0]);
    assert.equal(r.ok, false);
    assert.match(r.error, /révoqué à vie/);
  });

  it('rejette un status_index non entier ou négatif', () => {
    assert.equal(checkStatusIndices([{ github: 'a', status_index: 'x' }]).ok, false);
    assert.equal(checkStatusIndices([{ github: 'a', status_index: -1 }]).ok, false);
  });

  it('accepte une liste vide', () => {
    assert.deepEqual(checkStatusIndices([], [0, 1, 2]), { ok: true });
  });
});
