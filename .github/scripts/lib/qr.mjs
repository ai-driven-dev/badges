// QR code de la page de vérification (#60). Généré au build (SVG, sans réseau),
// il encode l'URL publique de vérification du membre. Affiché et téléchargeable
// depuis la page ; le scan mène à la vérification.
import QRCode from 'qrcode';
import { DEFAULT_BASE } from './credential.mjs';

/** URL de vérification publique d'un membre. */
export function verifyUrlFor(handle, base = DEFAULT_BASE) {
  return `${base}/u/${handle}`;
}

/** SVG du QR encodant l'URL de vérification du membre. */
export function generateQrSvg(handle, base = DEFAULT_BASE) {
  return QRCode.toString(verifyUrlFor(handle, base), { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
}
