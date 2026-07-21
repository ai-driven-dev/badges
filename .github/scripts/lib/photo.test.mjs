import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { downloadImage, normalizeToWebp, MAX_BYTES } from './photo.mjs';

// Réponse fetch factice.
function fakeResponse({ ok = true, status = 200, type = 'image/jpeg', body = new Uint8Array([1, 2, 3]) }) {
  return {
    ok, status,
    headers: { get: (h) => (h.toLowerCase() === 'content-type' ? type : null) },
    arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
  };
}

async function jpegWithExif() {
  return sharp({ create: { width: 800, height: 1000, channels: 3, background: '#336699' } })
    .jpeg()
    .withExif({ IFD0: { ImageDescription: 'x' }, GPS: { GPSLatitude: '48/1 0/1 0/1' } })
    .toBuffer();
}

describe('downloadImage', () => {
  it('rend les octets pour une réponse image', async () => {
    const bytes = await downloadImage('https://x/i.jpg', { fetchImpl: async () => fakeResponse({ body: new Uint8Array([9, 9]) }) });
    assert.deepEqual([...bytes], [9, 9]);
  });

  it('passe le token en Authorization quand il est fourni', async () => {
    let seen;
    await downloadImage('https://x/i.jpg', { token: 'T', fetchImpl: async (_u, opts) => { seen = opts.headers.Authorization; return fakeResponse({}); } });
    assert.equal(seen, 'Bearer T');
  });

  it('rejette une réponse non-image', async () => {
    await assert.rejects(
      () => downloadImage('https://x', { fetchImpl: async () => fakeResponse({ type: 'text/html' }) }),
      /pas une image/,
    );
  });

  it('rejette une réponse en erreur HTTP', async () => {
    await assert.rejects(
      () => downloadImage('https://x', { fetchImpl: async () => fakeResponse({ ok: false, status: 404 }) }),
      /HTTP 404/,
    );
  });

  it('rejette une image trop lourde', async () => {
    const big = new Uint8Array(MAX_BYTES + 1);
    await assert.rejects(
      () => downloadImage('https://x/i.jpg', { fetchImpl: async () => fakeResponse({ body: big }) }),
      /trop lourde/,
    );
  });
});

describe('normalizeToWebp', () => {
  it('rend un WebP 512×512 sans EXIF à partir d\'un JPEG avec EXIF', async () => {
    const input = await jpegWithExif();
    assert.ok((await sharp(input).metadata()).exif, 'précondition : EXIF présent en entrée');

    const out = await normalizeToWebp(input);

    const meta = await sharp(out).metadata();
    assert.equal(meta.format, 'webp');
    assert.equal(meta.width, 512);
    assert.equal(meta.height, 512);
    assert.equal(meta.exif, undefined);
  });
});
