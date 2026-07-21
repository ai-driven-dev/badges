// Couche I/O (#21) : télécharge la photo de l'inscription, la normalise (WebP 512,
// sans EXIF) et l'écrit à son chemin LFS. Échoue fermé : une photo requise mais
// intraitable bloque l'intake (retryable), plutôt que de publier sans photo.
//
// Env : PHOTO_URL, PHOTO_PATH, GH_TOKEN (token du bot pour les pièces jointes privées).
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { downloadImage, normalizeToWebp } from './lib/photo.mjs';

function fail(m) { console.error(m); process.exit(1); }

async function main() {
  const url = process.env.PHOTO_URL;
  const path = process.env.PHOTO_PATH;
  if (!url) fail('PHOTO_URL absent');
  if (!path) fail('PHOTO_PATH absent');

  const raw = await downloadImage(url, { token: process.env.GH_TOKEN }).catch((e) => fail(`téléchargement : ${e.message}`));
  const webp = await normalizeToWebp(raw).catch((e) => fail(`normalisation : ${e.message}`));

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, webp);
  console.log(`Photo normalisée : ${path} (${webp.length} o, WebP 512×512, sans EXIF)`);
}

main();
