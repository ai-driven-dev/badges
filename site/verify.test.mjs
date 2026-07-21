// Vérifie le module de vérification navigateur, exécuté en Node (Web Crypto global).
// On signe avec jose, puis on vérifie avec notre module — la clé publique est
// fournie via fetchKey injecté (pas de réseau).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, calculateJwkThumbprint, SignJWT } from 'jose';
import { verifyBadge, decodeJwt, evaluateValidity, STATE } from './verify.mjs';

const BASE = 'https://verify.ai-driven-dev.fr';

async function issue({ exp, nbf } = {}) {
  const { publicKey, privateKey } = await generateKeyPair('RS256', { modulusLength: 2048, extractable: true });
  const jwk = await exportJWK(publicKey);
  const kid = await calculateJwkThumbprint(await exportJWK(privateKey));
  const kidUrl = `${BASE}/keys/${kid}.json`;
  let builder = new SignJWT({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: `${BASE}/issuer.json`, type: ['Profile'], name: 'AI-Driven Development' },
    credentialSubject: { id: 'https://github.com/jdupont', type: ['AchievementSubject'], achievement: { name: 'Certified Member' } },
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2027-01-01T00:00:00Z',
  }).setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: kidUrl });
  if (exp) builder = builder.setExpirationTime(exp);
  if (nbf) builder = builder.setNotBefore(nbf);
  const jwt = await builder.sign(privateKey);
  return { jwt, jwk, kidUrl, fetchKey: async () => jwk };
}

describe('decodeJwt', () => {
  it('rejette un JWT qui n\'a pas trois segments', () => {
    assert.throws(() => decodeJwt('a.b'), /malformé/);
  });

  it('expose le header et le payload décodés', async () => {
    const { jwt } = await issue();
    const decoded = decodeJwt(jwt);
    assert.equal(decoded.header.alg, 'RS256');
    assert.equal(decoded.payload.credentialSubject.id, 'https://github.com/jdupont');
  });
});

describe('evaluateValidity', () => {
  it('rend VALID à l\'intérieur de la fenêtre temporelle', () => {
    const state = evaluateValidity({ exp: 2000, nbf: 1000 }, new Date(1500 * 1000));
    assert.equal(state, STATE.VALID);
  });

  it('rend EXPIRED une fois exp atteint', () => {
    const state = evaluateValidity({ exp: 1000 }, new Date(1000 * 1000));
    assert.equal(state, STATE.EXPIRED);
  });

  it('rend NOT_YET_VALID avant nbf', () => {
    const state = evaluateValidity({ nbf: 2000 }, new Date(1000 * 1000));
    assert.equal(state, STATE.NOT_YET_VALID);
  });
});

describe('verifyBadge', () => {
  it('rend VALID pour un badge authentique dans sa fenêtre', async () => {
    const { jwt, fetchKey } = await issue({ exp: 4102444800 }); // 2100

    const result = await verifyBadge(jwt, { fetchKey, now: new Date('2026-06-01T00:00:00Z') });

    assert.equal(result.state, STATE.VALID);
    assert.equal(result.details.handle, 'jdupont');
    assert.equal(result.details.issuer, 'AI-Driven Development');
  });

  it('rend INVALID pour un badge altéré d\'un caractère', async () => {
    const { jwt, fetchKey } = await issue({ exp: 4102444800 });
    const tampered = jwt.slice(0, -4) + (jwt.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA');

    const result = await verifyBadge(tampered, { fetchKey, now: new Date('2026-06-01T00:00:00Z') });

    assert.equal(result.state, STATE.INVALID);
  });

  it('rend INVALID quand la clé publique est introuvable', async () => {
    const { jwt } = await issue({ exp: 4102444800 });
    const failingFetch = async () => { throw new Error('404'); };

    const result = await verifyBadge(jwt, { fetchKey: failingFetch });

    assert.equal(result.state, STATE.INVALID);
    assert.equal(result.reason, 'clé publique introuvable');
  });

  it('rend INVALID pour une preuve illisible plutôt que de lever', async () => {
    const result = await verifyBadge('pas-un-jwt', { fetchKey: async () => ({}) });
    assert.equal(result.state, STATE.INVALID);
  });

  it('rend EXPIRED pour un badge dont la signature est bonne mais échu', async () => {
    const { jwt, fetchKey } = await issue({ exp: 1735689600 }); // 2025-01-01

    const result = await verifyBadge(jwt, { fetchKey, now: new Date('2026-06-01T00:00:00Z') });

    assert.equal(result.state, STATE.EXPIRED);
  });
});
