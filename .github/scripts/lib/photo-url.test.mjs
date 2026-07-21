import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractImageUrl } from './photo-url.mjs';

describe('extractImageUrl', () => {
  it('extrait l\'URL d\'une image markdown', () => {
    const url = extractImageUrl('voici\n\n![tete](https://example.com/a.png)');
    assert.equal(url, 'https://example.com/a.png');
  });

  it('extrait une URL nue si pas de markdown', () => {
    const url = extractImageUrl('https://example.com/b.jpg');
    assert.equal(url, 'https://example.com/b.jpg');
  });

  it('rend null en l\'absence d\'URL', () => {
    assert.equal(extractImageUrl('pas de lien'), null);
    assert.equal(extractImageUrl(''), null);
    assert.equal(extractImageUrl(null), null);
  });

  it('préfère l\'URL markdown à une éventuelle URL nue autour', () => {
    const url = extractImageUrl('texte https://autre.com ![x](https://vrai.com/i.webp)');
    assert.equal(url, 'https://vrai.com/i.webp');
  });
});
