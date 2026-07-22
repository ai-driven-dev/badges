// QR code de la page de vérification (#60). Généré au build (SVG, sans réseau).
// Il encode la belle page de vérif (le site, SITE_BASE) : scanner -> ouvre la fiche.
import QRCode from 'qrcode';
import { SITE_BASE, siteVerifyUrl } from './credential.mjs';

/** URL de vérification publique d'un membre (la belle page, sur le site). */
export function verifyUrlFor(handle, base = SITE_BASE) {
  return siteVerifyUrl(handle, base);
}

/** SVG du QR encodant l'URL de vérification du membre. */
export function generateQrSvg(handle, base = SITE_BASE) {
  return QRCode.toString(verifyUrlFor(handle, base), { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
}
