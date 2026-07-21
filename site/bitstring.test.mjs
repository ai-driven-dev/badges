import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_BITS, newBitset, setBit, getBit,
  bytesToBase64url, base64urlToBytes,
  encodeBitstring, decodeBitstring, encodeRevoked,
} from './bitstring.mjs';

describe('newBitset', () => {
  it('alloue au moins la taille minimale imposée par la spec', () => {
    const bytes = newBitset(8);
    assert.equal(bytes.length, MIN_BITS / 8);
  });

  it('initialise tous les bits à zéro', () => {
    const bytes = newBitset();
    assert.ok(bytes.every((b) => b === 0));
  });
});

describe('setBit / getBit', () => {
  it('lit false pour un bit non écrit', () => {
    const bytes = newBitset();
    assert.equal(getBit(bytes, 42), false);
  });

  it('lit true après avoir écrit le bit', () => {
    const bytes = newBitset();
    setBit(bytes, 42, true);
    assert.equal(getBit(bytes, 42), true);
  });

  it('traite le bit 0 comme le bit de poids fort du premier octet', () => {
    const bytes = newBitset();
    setBit(bytes, 0, true);
    assert.equal(bytes[0], 0b1000_0000);
  });

  it('efface un bit remis à false', () => {
    const bytes = newBitset();
    setBit(bytes, 5, true);
    setBit(bytes, 5, false);
    assert.equal(getBit(bytes, 5), false);
  });

  it('lève hors des bornes en écriture', () => {
    const bytes = newBitset();
    assert.throws(() => setBit(bytes, MIN_BITS + 1, true), RangeError);
  });
});

describe('base64url', () => {
  it('fait un aller-retour sans perte', () => {
    const bytes = new Uint8Array([0, 1, 250, 255, 128]);
    assert.deepEqual(base64urlToBytes(bytesToBase64url(bytes)), bytes);
  });
});

describe('encodeBitstring / decodeBitstring', () => {
  it('fait un aller-retour gzip+base64url en préservant les bits révoqués', async () => {
    const bytes = newBitset();
    setBit(bytes, 3, true);
    setBit(bytes, 9000, true);

    const decoded = await decodeBitstring(await encodeBitstring(bytes));

    assert.equal(getBit(decoded, 3), true);
    assert.equal(getBit(decoded, 9000), true);
    assert.equal(getBit(decoded, 4), false);
  });

  it('compresse fortement un bitset presque vide', async () => {
    const encoded = await encodeBitstring(newBitset());
    // 16 Kio de zéros -> quelques dizaines d'octets une fois gzippés/encodés.
    assert.ok(encoded.length < 200, `encodedList trop long: ${encoded.length}`);
  });
});

describe('encodeRevoked', () => {
  it('produit un encodedList où seuls les index révoqués sont à un', async () => {
    const encoded = await encodeRevoked([7, 8191]);

    const bytes = await decodeBitstring(encoded);

    assert.equal(getBit(bytes, 7), true);
    assert.equal(getBit(bytes, 8191), true);
    assert.equal(getBit(bytes, 0), false);
  });
});
