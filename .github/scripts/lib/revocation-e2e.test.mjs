// Régression du split de host sur le kid du status list.
// Signe un credential + un BitstringStatusListCredential avec la MÊME clé, puis
// vérifie via verifyBadge (fetchers injectés). Pages ne sert les clés que sous
// DATA_BASE : si le kid du status list pointe ailleurs, sa signature n'est pas
// vérifiable -> révocation non concluante -> un badge révoqué passerait pour valide.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateKeyPair, exportJWK, calculateJwkThumbprint, SignJWT,
} from 'jose';
import { buildCredential, keyUrl } from './credential.mjs';
import { buildStatusListCredential } from './status-list.mjs';
import { verifyBadge, STATE } from '../../../site/verify.mjs';

async function keypairKid() {
  const { publicKey, privateKey } = await generateKeyPair('RS256', { modulusLength: 2048, extractable: true });
  const kid = await calculateJwkThumbprint(await exportJWK(privateKey));
  return { privateKey, publicJwk: await exportJWK(publicKey), kid };
}

async function signCredential(member, certifiedOn, privateKey, kid) {
  const c = buildCredential(member, { certifiedOn });
  return new SignJWT(c)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: keyUrl(kid) })
    .setIssuer(c.issuer.id).setSubject(c.credentialSubject.id).setJti(c.id)
    .setExpirationTime(Math.floor(new Date(c.validUntil).getTime() / 1000))
    .sign(privateKey);
}

async function signStatus(revoked, privateKey, kidHeaderUrl) {
  const s = await buildStatusListCredential(revoked, { issuedOn: new Date('2026-02-01T00:00:00Z') });
  return new SignJWT(s)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: kidHeaderUrl })
    .setIssuer(s.issuer.id).setIssuedAt(Math.floor(Date.parse('2026-02-01T00:00:00Z') / 1000))
    .sign(privateKey);
}

describe('révocation de bout en bout (status list + verifyBadge)', () => {
  const member = { handle: 'jrevoke', name: 'J Revoke', statusIndex: 3 };
  const certifiedOn = new Date('2026-01-01T00:00:00Z');
  const now = new Date('2026-06-01T00:00:00Z'); // dans la fenêtre de validité

  it('détecte REVOKED quand le status list utilise le même helper que le credential (DATA_BASE)', async () => {
    const { privateKey, publicJwk, kid } = await keypairKid();
    const credJwt = await signCredential(member, certifiedOn, privateKey, kid);
    const statusJwt = await signStatus([3], privateKey, keyUrl(kid));
    // Pages ne sert les clés que sous DATA_BASE.
    const fetchKey = async (url) => { if (url === keyUrl(kid)) return publicJwk; throw new Error('404'); };
    const fetchStatus = async () => statusJwt;

    const res = await verifyBadge(credJwt, { fetchKey, fetchStatus, now });

    assert.equal(res.state, STATE.REVOKED);
  });

  it('révocation NON concluante si le kid du status list pointe un autre host (forme du bug)', async () => {
    const { privateKey, publicJwk, kid } = await keypairKid();
    const credJwt = await signCredential(member, certifiedOn, privateKey, kid);
    const statusJwt = await signStatus([3], privateKey, `https://verify.ai-driven-dev.fr/keys/${kid}.json`);
    const fetchKey = async (url) => { if (url === keyUrl(kid)) return publicJwk; throw new Error('404'); };
    const fetchStatus = async () => statusJwt;

    const res = await verifyBadge(credJwt, { fetchKey, fetchStatus, now });

    // Signature du credential OK (pas INVALID), mais révocation invérifiable :
    // c'est le fail-open que le consommateur DOIT traiter (statusUnknown -> état prudent).
    assert.equal(res.state, STATE.VALID);
    assert.equal(res.statusUnknown, true);
  });
});
