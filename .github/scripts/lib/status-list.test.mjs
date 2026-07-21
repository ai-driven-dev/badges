import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildStatusListCredential } from './status-list.mjs';
import { decodeBitstring, getBit } from '../../../site/bitstring.mjs';

const issuedOn = new Date('2026-07-21T10:00:00Z');

describe('buildStatusListCredential', () => {
  it('type le credential comme BitstringStatusListCredential', async () => {
    const credential = await buildStatusListCredential([], { issuedOn });
    assert.deepEqual(credential.type, ['VerifiableCredential', 'BitstringStatusListCredential']);
  });

  it('déclare un objet de statut de révocation avec un encodedList', async () => {
    const credential = await buildStatusListCredential([], { issuedOn });
    assert.equal(credential.credentialSubject.type, 'BitstringStatusList');
    assert.equal(credential.credentialSubject.statusPurpose, 'revocation');
    assert.ok(typeof credential.credentialSubject.encodedList === 'string');
  });

  it('encode à un les seuls index révoqués', async () => {
    const credential = await buildStatusListCredential([3, 100], { issuedOn });

    const bytes = await decodeBitstring(credential.credentialSubject.encodedList);

    assert.equal(getBit(bytes, 3), true);
    assert.equal(getBit(bytes, 100), true);
    assert.equal(getBit(bytes, 4), false);
  });

  it('porte l\'identifiant stable de la liste de statuts', async () => {
    const credential = await buildStatusListCredential([], { issuedOn });
    assert.equal(credential.id, 'https://verify.ai-driven-dev.fr/status/1');
  });

  it('rejette une date d\'émission invalide', async () => {
    await assert.rejects(() => buildStatusListCredential([], { issuedOn: new Date('x') }), /Date valide/);
  });
});
