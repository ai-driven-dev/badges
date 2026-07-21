import sharp from 'sharp';

// 1) Fabrique une image JPEG AVEC métadonnées EXIF (GPS + description) — simule
//    une photo de smartphone qui fuite la position.
const withExif = await sharp({ create: { width: 1200, height: 1600, channels: 3, background: '#4488cc' } })
  .jpeg()
  .withExif({ IFD0: { ImageDescription: 'photo perso', Copyright: 'moi' }, GPS: { GPSLatitude: '48/1 51/1 0/1' } })
  .toBuffer();

const inMeta = await sharp(withExif).metadata();
console.log('ENTRÉE  : format=%s %dx%d exif=%s', inMeta.format, inMeta.width, inMeta.height, inMeta.exif ? `présent (${inMeta.exif.length}o)` : 'absent');

// 2) PIPELINE : resize carré 512, WebP, EXIF NON recopié (sharp strippe par défaut).
const processed = await sharp(withExif)
  .rotate()                       // applique l'orientation EXIF puis la jette
  .resize(512, 512, { fit: 'cover', position: 'attention' })
  .webp({ quality: 82 })
  .toBuffer();

const outMeta = await sharp(processed).metadata();
console.log('SORTIE  : format=%s %dx%d exif=%s taille=%do',
  outMeta.format, outMeta.width, outMeta.height,
  outMeta.exif ? `PRÉSENT (${outMeta.exif.length}o) !!` : 'absent', processed.length);

// 3) Assertions
const ok = outMeta.format === 'webp' && outMeta.width === 512 && outMeta.height === 512 && !outMeta.exif;
console.log(ok ? '\nPASS: WebP 512x512 sans EXIF' : '\nFAIL');
process.exit(ok ? 0 : 1);
