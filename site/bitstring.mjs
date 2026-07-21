// Bitstring Status List v1.0 (W3C) — encodage/décodage partagés navigateur + Node.
// Le bitstring est indexé de gauche à droite : le bit 0 est le bit de poids fort
// du premier octet. Compressé gzip puis encodé en base64url (champ `encodedList`).
// Utilise CompressionStream/DecompressionStream (globaux en navigateur et Node 18+).

// Taille minimale imposée par la spec : 16 Kio = 131072 bits (anti-corrélation).
export const MIN_BITS = 16 * 1024 * 8;

/** Alloue un bitset d'au moins `bits` bits (multiple d'octet), tout à zéro. */
export function newBitset(bits = MIN_BITS) {
  const size = Math.max(bits, MIN_BITS);
  return new Uint8Array(Math.ceil(size / 8));
}

/** Position d'un index : octet + masque (bit de poids fort = index le plus bas). */
function locate(index) {
  return { byte: index >> 3, mask: 1 << (7 - (index & 7)) };
}

/** Écrit le bit à `index` (true = révoqué). */
export function setBit(bytes, index, value = true) {
  const { byte, mask } = locate(index);
  if (byte >= bytes.length) throw new RangeError(`index ${index} hors du bitset`);
  if (value) bytes[byte] |= mask;
  else bytes[byte] &= ~mask;
  return bytes;
}

/** Lit le bit à `index`. */
export function getBit(bytes, index) {
  const { byte, mask } = locate(index);
  if (byte >= bytes.length) return false;
  return (bytes[byte] & mask) !== 0;
}

/** Uint8Array -> base64url. */
export function bytesToBase64url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** base64url -> Uint8Array. */
export function base64urlToBytes(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes, stream) {
  const writer = stream.writable.getWriter();
  writer.write(bytes);
  writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

/** bitset -> encodedList (gzip + base64url). */
export async function encodeBitstring(bytes) {
  return bytesToBase64url(await pipe(bytes, new CompressionStream('gzip')));
}

/** encodedList -> bitset (base64url + gunzip). */
export async function decodeBitstring(encoded) {
  return pipe(base64urlToBytes(encoded), new DecompressionStream('gzip'));
}

/** Construit l'encodedList à partir de la liste des index révoqués. */
export async function encodeRevoked(revokedIndices, bits = MIN_BITS) {
  const bytes = newBitset(bits);
  for (const i of revokedIndices) setBit(bytes, i, true);
  return encodeBitstring(bytes);
}
