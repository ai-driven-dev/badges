import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { render, mount } from './verify-page.mjs';
import { STATE } from './verify.mjs';

const fakeElement = () => ({ className: '', innerHTML: '' });

describe('render', () => {
  it('affiche le titulaire et le ton ok pour un badge valide', () => {
    const root = fakeElement();

    render(root, { state: STATE.VALID, details: { handle: 'jdupont', issuer: 'AI-Driven Development', achievement: 'Certified Member' } });

    assert.match(root.className, /\bok\b/);
    assert.match(root.innerHTML, /Badge valide/);
    assert.match(root.innerHTML, /@jdupont/);
  });

  it('affiche le ton warn et le libellé expiré', () => {
    const root = fakeElement();

    render(root, { state: STATE.EXPIRED, details: { handle: 'jdupont' } });

    assert.match(root.className, /\bwarn\b/);
    assert.match(root.innerHTML, /expiré/i);
  });

  it('affiche la raison et le ton bad pour un badge invalide', () => {
    const root = fakeElement();

    render(root, { state: STATE.INVALID, reason: 'signature invalide' });

    assert.match(root.className, /\bbad\b/);
    assert.match(root.innerHTML, /signature invalide/);
  });

  it('annonce une vérification indépendante du serveur AIDD', () => {
    const root = fakeElement();

    render(root, { state: STATE.VALID, details: {} });

    assert.match(root.innerHTML, /sans dépendre d'un serveur AIDD/);
    assert.match(root.innerHTML, /vc\.1ed\.tech/);
  });

  it('affiche le QR code et les téléchargements pour un badge authentifié', () => {
    const root = fakeElement();

    render(root, { state: STATE.VALID, details: { handle: 'jd' } });

    assert.match(root.innerHTML, /src="\.\/qr\.svg"/);
    assert.match(root.innerHTML, /href="\.\/qr\.svg" download/);
    assert.match(root.innerHTML, /href="\.\/credential\.jwt" download/);
  });

  it('n\'affiche ni QR ni téléchargements pour un badge invalide', () => {
    const root = fakeElement();

    render(root, { state: STATE.INVALID, reason: 'signature invalide' });

    assert.doesNotMatch(root.innerHTML, /qr\.svg/);
    assert.doesNotMatch(root.innerHTML, /credential\.jwt/);
  });
});

describe('mount', () => {
  it('rend un état invalide quand aucune preuve n\'est trouvée', async () => {
    const root = fakeElement();
    const doc = { getElementById: () => root };
    const failingFetch = async () => { throw new Error('404'); };

    await mount(doc, failingFetch);

    assert.match(root.className, /\bbad\b/);
    assert.match(root.innerHTML, /Aucune preuve/);
  });
});
