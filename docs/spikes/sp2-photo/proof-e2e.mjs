import { extractImageUrl, downloadImage, normalize } from './pipeline.mjs';
import sharp from 'sharp';

// 1) parsing markdown
const field = "voici ma photo\n\n![ma tete](https://avatars.githubusercontent.com/u/9919?s=460&v=4)";
const url = extractImageUrl(field);
console.log('URL extraite:', url);

// 2) download réel (image publique GitHub) + 3) normalisation
const raw = await downloadImage(url);
console.log('téléchargé:', raw.length, 'octets');
const webp = await normalize(raw);
const meta = await sharp(webp).metadata();
console.log('normalisé: format=%s %dx%d exif=%s taille=%do', meta.format, meta.width, meta.height, meta.exif?'PRÉSENT':'absent', webp.length);

// rejets
try { await downloadImage('https://github.com'); console.log('FAIL: html accepté'); }
catch(e){ console.log('rejet type non-image OK:', e.message); }

const ok = url && meta.format==='webp' && meta.width===512 && !meta.exif;
console.log(ok?'\nPASS bout-en-bout':'\nFAIL'); process.exit(ok?0:1);
