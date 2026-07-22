import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMemberYaml,
  isoSeconds,
  addYears,
  deterministicUuid,
  buildCredential,
  keyUrl,
  resolveEmissionDate,
} from './credential.mjs';

describe('parseMemberYaml', () => {
  it('lit une paire clé/valeur entre guillemets', () => {
    const record = parseMemberYaml('name: "Jean Dupont"');
    assert.equal(record.name, 'Jean Dupont');
  });

  it('désérialise les échappements JSON de la valeur', () => {
    const record = parseMemberYaml('name: "Evil: \\"x\\""');
    assert.equal(record.name, 'Evil: "x"');
  });

  it('ignore les lignes qui ne sont pas des paires clé/valeur', () => {
    const record = parseMemberYaml('# commentaire\ngithub: "jd"\n');
    assert.deepEqual(record, { github: 'jd' });
  });
});

describe('isoSeconds', () => {
  it('rend une date ISO sans millisecondes', () => {
    const iso = isoSeconds(new Date('2026-07-21T10:00:00.123Z'));
    assert.equal(iso, '2026-07-21T10:00:00Z');
  });
});

describe('addYears', () => {
  it('ajoute des années sans muter la date d\'origine', () => {
    const origin = new Date('2026-07-21T00:00:00Z');
    const later = addYears(origin, 1);
    assert.equal(isoSeconds(later), '2027-07-21T00:00:00Z');
    assert.equal(isoSeconds(origin), '2026-07-21T00:00:00Z');
  });
});

describe('deterministicUuid', () => {
  it('rend le même urn:uuid pour un même handle et une même date', () => {
    const date = new Date('2026-07-21T10:00:00Z');
    assert.equal(deterministicUuid('jd', date), deterministicUuid('jd', date));
  });

  it('rend des urn:uuid différents pour des handles différents', () => {
    const date = new Date('2026-07-21T10:00:00Z');
    assert.notEqual(deterministicUuid('jd', date), deterministicUuid('mc', date));
  });

  it('respecte le format urn:uuid v4', () => {
    const uuid = deterministicUuid('jd', new Date('2026-07-21T10:00:00Z'));
    assert.match(uuid, /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('resolveEmissionDate', () => {
  it('utilise la date de première certification en l\'absence de renouvellement', () => {
    const d = resolveEmissionDate(undefined, '2026-01-01T00:00:00Z');
    assert.equal(isoSeconds(d), '2026-01-01T00:00:00Z');
  });

  it('donne priorité à renewed_on quand il est présent', () => {
    const d = resolveEmissionDate('2027-03-01T00:00:00Z', '2026-01-01T00:00:00Z');
    assert.equal(isoSeconds(d), '2027-03-01T00:00:00Z');
  });

  it('ignore un renewed_on vide et retombe sur la première certification', () => {
    const d = resolveEmissionDate('   ', '2026-01-01T00:00:00Z');
    assert.equal(isoSeconds(d), '2026-01-01T00:00:00Z');
  });

  it('rejette l\'absence totale de date', () => {
    assert.throws(() => resolveEmissionDate(undefined, undefined), /aucune date/);
  });

  it('rejette une date invalide', () => {
    assert.throws(() => resolveEmissionDate('pas une date', undefined), /invalide/);
  });
});

describe('keyUrl', () => {
  it('construit une URL déréférençable par kid sous le domaine permanent', () => {
    assert.equal(keyUrl('ABC'), 'https://ai-driven-dev.github.io/badges/keys/ABC.json');
  });
});

describe('buildCredential', () => {
  const member = { handle: 'jdupont', name: 'Jean Dupont', statusIndex: 0 };
  const certifiedOn = new Date('2026-07-21T10:00:00Z');

  it('déclare les deux contextes OB3 dans l\'ordre attendu (v2 en premier)', () => {
    const credential = buildCredential(member, { certifiedOn });
    assert.equal(credential['@context'][0], 'https://www.w3.org/ns/credentials/v2');
    assert.equal(credential['@context'][1], 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json');
  });

  it('type le credential comme VerifiableCredential et OpenBadgeCredential', () => {
    const credential = buildCredential(member, { certifiedOn });
    assert.deepEqual(credential.type, ['VerifiableCredential', 'OpenBadgeCredential']);
  });

  it('lie le sujet au compte GitHub du membre', () => {
    const credential = buildCredential(member, { certifiedOn });
    assert.equal(credential.credentialSubject.id, 'https://github.com/jdupont');
  });

  it('fixe l\'expiration à un an après la date de certification', () => {
    const credential = buildCredential(member, { certifiedOn });
    assert.equal(credential.validFrom, '2026-07-21T10:00:00Z');
    assert.equal(credential.validUntil, '2027-07-21T10:00:00Z');
  });

  it('déclare un émetteur de type Profile', () => {
    const credential = buildCredential(member, { certifiedOn });
    assert.deepEqual(credential.issuer.type, ['Profile']);
  });

  it('produit un credential identique pour des entrées identiques (déterminisme)', () => {
    const a = buildCredential(member, { certifiedOn });
    const b = buildCredential(member, { certifiedOn });
    assert.deepEqual(a, b);
  });

  it('référence la Bitstring Status List via credentialStatus', () => {
    const credential = buildCredential({ ...member, statusIndex: 42 }, { certifiedOn });
    assert.equal(credential.credentialStatus.type, 'BitstringStatusListEntry');
    assert.equal(credential.credentialStatus.statusPurpose, 'revocation');
    assert.equal(credential.credentialStatus.statusListIndex, '42');
    assert.equal(credential.credentialStatus.statusListCredential, 'https://ai-driven-dev.github.io/badges/status/1');
  });

  it('rejette une date de certification invalide', () => {
    assert.throws(() => buildCredential(member, { certifiedOn: new Date('pas une date') }), /Date valide/);
  });

  it('rejette un membre sans handle', () => {
    assert.throws(() => buildCredential({ name: 'X', statusIndex: 0 }, { certifiedOn }), /handle requis/);
  });

  it('rejette un statusIndex absent ou négatif', () => {
    assert.throws(() => buildCredential({ handle: 'x', name: 'X' }, { certifiedOn }), /statusIndex/);
    assert.throws(() => buildCredential({ handle: 'x', name: 'X', statusIndex: -1 }, { certifiedOn }), /statusIndex/);
  });
});
