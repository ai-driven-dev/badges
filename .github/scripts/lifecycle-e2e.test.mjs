// Cycle de vie de bout en bout, au niveau des vraies fonctions (les workflows
// GitHub — events/Apps — ne sont pas exécutables en local, mais toute la LOGIQUE
// qu'ils enveloppent l'est). On déroule le parcours réel :
//   formulaire rempli -> record -> émission signée -> affichage (valide / expiré /
//   pas encore) -> révocation -> retrait RGPD (annuaire + preuve exportée) ->
//   preuve falsifiée -> statut injoignable -> validations du formulaire.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, calculateJwkThumbprint, SignJWT } from 'jose';
import { buildMemberRecord, toMemberYaml, RequestError } from './lib/certification-request.mjs';
import { buildCredential, keyUrl, parseMemberYaml } from './lib/credential.mjs';
import { buildStatusListCredential } from './lib/status-list.mjs';
import { addIndex, parseLedger, serializeLedger } from './lib/revocation.mjs';
import { buildDirectory } from './lib/directory.mjs';
import { verifyBadge, STATE } from '../../site/verify.mjs';
import { render } from '../../site/verify-page.mjs';

const YEAR_MS = 365 * 24 * 3600 * 1000;

// --- Fabrique de formulaire d'inscription (rendu Issue Form) ---
function issueForm({ login, name, linkedin, website = '_No response_', description = '_No response_', photo }) {
  const body = [
    '### Nom complet', name, '',
    '### Profil LinkedIn', linkedin, '',
    '### Site web', website, '',
    '### Description', description, '',
    '### Photo', photo, '',
  ].join('\n');
  return { user: { login }, body, number: 42 };
}

// --- Signature (mêmes helpers/base que la prod : keyUrl) ---
async function keypair() {
  const { publicKey, privateKey } = await generateKeyPair('RS256', { modulusLength: 2048, extractable: true });
  const kid = await calculateJwkThumbprint(await exportJWK(privateKey));
  return { privateKey, publicJwk: await exportJWK(publicKey), kid };
}
async function signCredential(member, certifiedOn, privateKey, kid) {
  const c = buildCredential(member, { certifiedOn });
  const jwt = await new SignJWT(c)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: keyUrl(kid) })
    .setIssuer(c.issuer.id).setSubject(c.credentialSubject.id).setJti(c.id)
    .setNotBefore(Math.floor(new Date(c.validFrom).getTime() / 1000))
    .setExpirationTime(Math.floor(new Date(c.validUntil).getTime() / 1000))
    .sign(privateKey);
  return { jwt, credential: c };
}
async function signStatus(revoked, privateKey, kidHeaderUrl) {
  const s = await buildStatusListCredential(revoked, { issuedOn: new Date('2026-02-01T00:00:00Z') });
  return new SignJWT(s)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: kidHeaderUrl })
    .setIssuer(s.issuer.id).setIssuedAt(Math.floor(Date.parse('2026-02-01T00:00:00Z') / 1000))
    .sign(privateKey);
}
// Pages ne sert les clés que sous DATA_BASE ; verifyBadge s'appuie dessus.
const keyServer = (publicJwk, kid) => async (url) => {
  if (url === keyUrl(kid)) return publicJwk;
  throw new Error(`404 ${url}`);
};
function display(result) {
  const root = {};
  render(root, result, '/u/jdupont', 'https://verify.ai-driven-dev.fr');
  return root.innerHTML;
}

describe('cycle de vie du badge — de bout en bout', () => {
  const filled = () => issueForm({
    login: 'jdupont',
    name: 'Jean Dupont',
    linkedin: 'https://www.linkedin.com/in/jdupont',
    description: 'Lead dev, agents en prod.',
    photo: '![photo](https://example.com/p.png)',
  });

  it('1. le formulaire rempli devient un record valide (identité = auteur)', () => {
    const record = buildMemberRecord(filled(), 0);
    assert.equal(record.handle, 'jdupont');
    assert.equal(record.name, 'Jean Dupont');
    assert.equal(record.linkedin, 'https://www.linkedin.com/in/jdupont');
    assert.equal(record.photoUrl, 'https://example.com/p.png');
    assert.equal(record.statusIndex, 0);
    // roundtrip YAML -> membre signable
    const member = parseMemberYaml(toMemberYaml(record));
    assert.equal(member.github, 'jdupont');
    assert.equal(member.status_index, '0');
  });

  it('2. émission -> affichage VALIDE', async () => {
    const { privateKey, publicJwk, kid } = await keypair();
    const member = { handle: 'jdupont', name: 'Jean Dupont', statusIndex: 0 };
    const { jwt } = await signCredential(member, new Date('2026-01-01T00:00:00Z'), privateKey, kid);
    const status = await signStatus([], privateKey, keyUrl(kid));
    const res = await verifyBadge(jwt, {
      fetchKey: keyServer(publicJwk, kid), fetchStatus: async () => status, now: new Date('2026-06-01'),
    });
    assert.equal(res.state, STATE.VALID);
    assert.equal(res.statusUnknown, false);
    assert.match(display(res), /Badge valide/);
  });

  it('3. badge EXPIRÉ (émis il y a plus d’un an)', async () => {
    const { privateKey, publicJwk, kid } = await keypair();
    const member = { handle: 'jdupont', name: 'Jean Dupont', statusIndex: 0 };
    const old = new Date(Date.parse('2026-06-01') - 400 * 24 * 3600 * 1000);
    const { jwt } = await signCredential(member, old, privateKey, kid);
    const status = await signStatus([], privateKey, keyUrl(kid));
    const res = await verifyBadge(jwt, {
      fetchKey: keyServer(publicJwk, kid), fetchStatus: async () => status, now: new Date('2026-06-01'),
    });
    assert.equal(res.state, STATE.EXPIRED);
    assert.match(display(res), /expiré/i);
  });

  it('4. badge PAS ENCORE VALIDE (émis dans le futur)', async () => {
    const { privateKey, publicJwk, kid } = await keypair();
    const member = { handle: 'jdupont', name: 'Jean Dupont', statusIndex: 0 };
    const { jwt } = await signCredential(member, new Date('2027-01-01T00:00:00Z'), privateKey, kid);
    const status = await signStatus([], privateKey, keyUrl(kid));
    const res = await verifyBadge(jwt, {
      fetchKey: keyServer(publicJwk, kid), fetchStatus: async () => status, now: new Date('2026-06-01'),
    });
    assert.equal(res.state, STATE.NOT_YET_VALID);
  });

  it('5. RÉVOCATION -> affichage RÉVOQUÉ', async () => {
    const { privateKey, publicJwk, kid } = await keypair();
    const member = { handle: 'jdupont', name: 'Jean Dupont', statusIndex: 7 };
    const { jwt } = await signCredential(member, new Date('2026-01-01T00:00:00Z'), privateKey, kid);
    // le registre passe l'index à révoqué, le status list est re-signé
    const ledger = serializeLedger(addIndex(parseLedger('{"revoked":[]}'), 7));
    const status = await signStatus(parseLedger(ledger), privateKey, keyUrl(kid));
    const res = await verifyBadge(jwt, {
      fetchKey: keyServer(publicJwk, kid), fetchStatus: async () => status, now: new Date('2026-06-01'),
    });
    assert.equal(res.state, STATE.REVOKED);
    assert.match(display(res), /révoqué/i);
  });

  it('6. RETRAIT RGPD : hors annuaire, preuve exportée révoquée, aucune donnée perso', async () => {
    const { privateKey, publicJwk, kid } = await keypair();
    const member = { handle: 'jdupont', name: 'Jean Dupont', statusIndex: 7 };
    // preuve déjà exportée par le membre AVANT le retrait
    const { jwt: exported } = await signCredential(member, new Date('2026-01-01T00:00:00Z'), privateKey, kid);

    // retrait = index ajouté au registre + fiche supprimée (ici : absente de la liste)
    const ledger = parseLedger(serializeLedger(addIndex([], 7)));
    const remainingMembers = [
      { github: 'autre', name: 'Autre Membre', role: 'certifie', status_index: 0 },
    ]; // jdupont n'a plus de record
    const directory = buildDirectory(remainingMembers.map((m) => ({ ...m })));
    assert.equal(directory.members.some((e) => e.handle === 'jdupont'), false); // hors annuaire

    // la preuve exportée qui circule encore : révoquée
    const status = await signStatus(ledger, privateKey, keyUrl(kid));
    const res = await verifyBadge(exported, {
      fetchKey: keyServer(publicJwk, kid), fetchStatus: async () => status, now: new Date('2026-06-01'),
    });
    assert.equal(res.state, STATE.REVOKED);
    // la page de vérif ne divulgue aucune donnée perso : @handle, pas le nom
    const html = display(res);
    assert.match(html, /@jdupont/);
    assert.doesNotMatch(html, /Jean Dupont/);
  });

  it('7. preuve FALSIFIÉE -> INVALIDE', async () => {
    const { privateKey, publicJwk, kid } = await keypair();
    const member = { handle: 'jdupont', name: 'Jean Dupont', statusIndex: 0 };
    const { jwt } = await signCredential(member, new Date('2026-01-01T00:00:00Z'), privateKey, kid);
    const tampered = jwt.slice(0, -4) + (jwt.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA');
    const res = await verifyBadge(tampered, {
      fetchKey: keyServer(publicJwk, kid), fetchStatus: async () => '', now: new Date('2026-06-01'),
    });
    assert.equal(res.state, STATE.INVALID);
    assert.match(display(res), /invalide/i);
  });

  it('8. RÉVOCATION INVÉRIFIABLE (status injoignable) -> fail-safe, jamais "valide" plein', async () => {
    const { privateKey, publicJwk, kid } = await keypair();
    const member = { handle: 'jdupont', name: 'Jean Dupont', statusIndex: 0 };
    const { jwt } = await signCredential(member, new Date('2026-01-01T00:00:00Z'), privateKey, kid);
    const res = await verifyBadge(jwt, {
      fetchKey: keyServer(publicJwk, kid),
      fetchStatus: async () => { throw new Error('status injoignable'); },
      now: new Date('2026-06-01'),
    });
    assert.equal(res.state, STATE.VALID);
    assert.equal(res.statusUnknown, true);
    const html = display(res);
    assert.match(html, /révocation non vérifiée/i);
    assert.doesNotMatch(html, /^(?!.*non vérifiée).*Badge valide/s); // pas de "valide" plein sans caveat
  });

  it('9. validations du formulaire (rejets)', () => {
    const bad = (over) => issueForm({
      login: 'jdupont', name: 'Jean Dupont',
      linkedin: 'https://www.linkedin.com/in/jdupont', photo: '![p](https://x/p.png)', ...over,
    });
    assert.throws(() => buildMemberRecord(bad({ name: '' }), 0), RequestError); // nom requis
    assert.throws(() => buildMemberRecord(bad({ linkedin: 'https://twitter.com/x' }), 0), RequestError); // pas linkedin
    assert.throws(() => buildMemberRecord(bad({ photo: '_No response_' }), 0), RequestError); // photo requise
    assert.throws(() => buildMemberRecord(issueForm({ login: 'bad handle!', name: 'X', linkedin: 'https://www.linkedin.com/in/x', photo: '![p](https://x/p.png)' }), 0), RequestError); // handle invalide
  });
});
