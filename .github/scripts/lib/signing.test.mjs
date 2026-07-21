// Test d'intégration : le credential construit par la lib, signé en RS256, se
// vérifie avec la clé publique correspondante (roundtrip jose). Prouve que la
// forme produite est signable et vérifiable — le format conforme 1EdTech est,
// lui, prouvé par le spike SP4.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateKeyPair, exportJWK, calculateJwkThumbprint, SignJWT, jwtVerify, importJWK, decodeProtectedHeader,
} from 'jose';
import { buildCredential, keyUrl } from './credential.mjs';

async function signFor(member, certifiedOn) {
  const { publicKey, privateKey } = await generateKeyPair('RS256', { modulusLength: 2048, extractable: true });
  const kid = await calculateJwkThumbprint(await exportJWK(privateKey));
  const credential = buildCredential(member, { certifiedOn });
  const jwt = await new SignJWT(credential)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: keyUrl(kid) })
    .setIssuer(credential.issuer.id)
    .setSubject(credential.credentialSubject.id)
    .setJti(credential.id)
    .setExpirationTime(Math.floor(new Date(credential.validUntil).getTime() / 1000))
    .sign(privateKey);
  return { jwt, publicJwk: await exportJWK(publicKey), kid };
}

describe('signature du credential', () => {
  const member = { handle: 'jdupont', name: 'Jean Dupont' };
  const certifiedOn = new Date('2026-07-21T10:00:00Z');

  it('produit un JWT vérifiable avec la clé publique', async () => {
    const { jwt, publicJwk } = await signFor(member, certifiedOn);

    const { payload } = await jwtVerify(jwt, await importJWK(publicJwk, 'RS256'));

    assert.equal(payload.credentialSubject.id, 'https://github.com/jdupont');
  });

  it('place dans le header un kid déréférençable vers la clé publique', async () => {
    const { jwt, kid } = await signFor(member, certifiedOn);

    const header = decodeProtectedHeader(jwt);

    assert.equal(header.alg, 'RS256');
    assert.equal(header.kid, `https://verify.ai-driven-dev.fr/keys/${kid}.json`);
  });

  it('rejette un JWT altéré', async () => {
    const { jwt, publicJwk } = await signFor(member, certifiedOn);
    const tampered = jwt.slice(0, -3) + (jwt.slice(-3) === 'AAA' ? 'BBB' : 'AAA');

    await assert.rejects(() => jwtVerify(tampered, importJWK(publicJwk, 'RS256')));
  });
});
