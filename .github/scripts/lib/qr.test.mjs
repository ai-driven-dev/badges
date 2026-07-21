import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifyUrlFor, generateQrSvg } from './qr.mjs';

describe('verifyUrlFor', () => {
  it('construit l\'URL de vérification publique du membre', () => {
    assert.equal(verifyUrlFor('octocat'), 'https://verify.ai-driven-dev.fr/u/octocat');
  });
});

describe('generateQrSvg', () => {
  it('rend un SVG', async () => {
    const svg = await generateQrSvg('octocat');
    assert.match(svg, /<svg/);
    assert.match(svg, /<\/svg>/);
  });

  it('produit le même SVG pour le même handle (déterministe)', async () => {
    assert.equal(await generateQrSvg('octocat'), await generateQrSvg('octocat'));
  });

  it('produit des SVG différents pour des handles différents', async () => {
    assert.notEqual(await generateQrSvg('octocat'), await generateQrSvg('adalovelace'));
  });
});
