import sharp from 'sharp';

// Extrait l'URL d'image d'un champ Issue Form (markdown ![alt](url) ou URL nue).
export function extractImageUrl(field) {
  const md = field.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/);
  if (md) return md[1];
  const bare = field.match(/https?:\/\/\S+/);
  return bare ? bare[0] : null;
}

const MAX_BYTES = 10 * 1024 * 1024; // garde-fou téléchargement

export async function downloadImage(url, { token } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') || '';
  if (!type.startsWith('image/')) throw new Error(`type non-image: ${type}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error('image trop lourde');
  return buf;
}

export async function normalize(buf) {
  return sharp(buf).rotate().resize(512, 512, { fit: 'cover', position: 'attention' }).webp({ quality: 82 }).toBuffer();
}
