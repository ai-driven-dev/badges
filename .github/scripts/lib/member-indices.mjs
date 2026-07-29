// Intégrité des index de statut (Bitstring Status List). Fonction pure, testable.
// Invariants tenus par l'intake mais vérifiés à l'émission (défense en profondeur) :
//  - chaque status_index est un entier >= 0 ;
//  - deux membres actifs ne partagent JAMAIS un index (sinon ils partagent un bit de
//    statut : révoquer l'un révoquerait l'autre) ;
//  - aucun membre actif n'est sur un index présent dans le registre de révocation
//    (un index révoqué est brûlé à vie -> le badge naîtrait « révoqué »).

/**
 * @param {Array<{github?: string, status_index: any}>} members
 * @param {Array<number>|Set<number>} revoked  index révoqués (registre)
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function checkStatusIndices(members, revoked = []) {
  const revokedSet = revoked instanceof Set ? revoked : new Set([...revoked].map(Number));
  const seen = new Map();
  for (const m of members) {
    const who = m.github ? `@${m.github}` : '(membre sans handle)';
    const idx = Number(m.status_index);
    if (!Number.isInteger(idx) || idx < 0) {
      return { ok: false, error: `status_index invalide pour ${who} : ${m.status_index}` };
    }
    if (seen.has(idx)) {
      return { ok: false, error: `status_index ${idx} partagé par @${seen.get(idx)} et ${who} — deux membres au même bit de statut` };
    }
    seen.set(idx, m.github);
    if (revokedSet.has(idx)) {
      return { ok: false, error: `${who} est à l'index ${idx}, révoqué à vie — son badge naîtrait « révoqué »` };
    }
  }
  return { ok: true };
}
