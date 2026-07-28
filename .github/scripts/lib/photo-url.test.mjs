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

  it('extrait l\'URL d\'une balise <img> HTML (drag-drop GitHub actuel), sans le guillemet', () => {
    const field = '<img width="800" height="800" alt="Image" src="https://github.com/user-attachments/assets/6451b1af-c883-4151-9836-acfd1dae5d25" />';
    assert.equal(extractImageUrl(field), 'https://github.com/user-attachments/assets/6451b1af-c883-4151-9836-acfd1dae5d25');
  });

  it('n\'attrape pas un guillemet/chevron collé à une URL nue', () => {
    assert.equal(extractImageUrl('src="https://example.com/c.png"'), 'https://example.com/c.png');
  });
});
