// Construit le BitstringStatusListCredential (révocation, CT-4 / #25). Le corps
// suit la forme VC 2.0 ; il est signé RS256 comme les badges. L'encodage du
// bitstring est partagé avec le code de vérif navigateur (site/bitstring.mjs).
import { encodeRevoked } from '../../../site/bitstring.mjs';
import { DEFAULT_BASE, statusListUrl, isoSeconds } from './credential.mjs';

/**
 * Assemble le credential de liste de statuts.
 * @param {number[]} revokedIndices
 * @param {{ issuedOn: Date, base?: string }} options
 */
export async function buildStatusListCredential(revokedIndices, { issuedOn, base = DEFAULT_BASE }) {
  if (!(issuedOn instanceof Date) || Number.isNaN(issuedOn.getTime())) {
    throw new Error('issuedOn doit être une Date valide');
  }
  const encodedList = await encodeRevoked(revokedIndices);
  const url = statusListUrl(base);
  return {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: url,
    type: ['VerifiableCredential', 'BitstringStatusListCredential'],
    issuer: { id: `${base}/issuer.json`, type: ['Profile'], name: 'AI-Driven Development' },
    validFrom: isoSeconds(issuedOn),
    credentialSubject: {
      id: `${url}#list`,
      type: 'BitstringStatusList',
      statusPurpose: 'revocation',
      encodedList,
    },
  };
}
