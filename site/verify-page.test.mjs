import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { render, mount, credentialUrl, memberBase } from './verify-page.mjs';
import { STATE } from './verify.mjs';

describe('memberBase', () => {
  it('rend la base sans slash final (URL du badge LinkedIn)', () => {
    assert.equal(memberBase('/u/octocat'), '/u/octocat');
  });

  it('retire le slash final', () => {
    assert.equal(memberBase('/u/octocat/'), '/u/octocat');
  });

  it('retombe sur le répertoire courant si le chemin est vide', () => {
    assert.equal(memberBase(''), '.');
  });
});

describe('credentialUrl', () => {
  it('pointe vers la preuve du membre, avec ou sans slash final', () => {
    assert.equal(credentialUrl('/u/octocat'), '/u/octocat/credential.jwt');
    assert.equal(credentialUrl('/u/octocat/'), '/u/octocat/credential.jwt');
  });
});

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

  it('propose le téléchargement de la preuve et du QR, sans afficher le QR (pas de boucle)', () => {
    const root = fakeElement();

    render(root, { state: STATE.VALID, details: { handle: 'jd' } });

    assert.doesNotMatch(root.innerHTML, /<img[^>]*qr\.svg/); // pas de QR affiché (il boucle)
    assert.match(root.innerHTML, /href="\.\/qr\.svg" download/);
    assert.match(root.innerHTML, /href="\.\/credential\.jwt" download/);
  });

  it('expose l\'URL publique absolue de la preuve (pour un vérificateur tiers)', () => {
    const root = fakeElement();

    render(root, { state: STATE.VALID, details: { handle: 'jd' } }, '/u/jd', 'https://verify.ai-driven-dev.fr');

    assert.match(root.innerHTML, /href="\/u\/jd\/credential\.jwt" download/);
    assert.match(root.innerHTML, /<code>https:\/\/verify\.ai-driven-dev\.fr\/u\/jd\/credential\.jwt<\/code>/);
    assert.match(root.innerHTML, /vc\.1ed\.tech/);
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
