# SP4 — Conformité 1EdTech bout-en-bout

**Statut : levé.** Un Open Badge 3.0 émis en **VC-JWT signé RS256** est accepté par le validateur public 1EdTech. Le cœur crypto d'E3 est dé-risqué avant construction.

## Verdict

Soumission au validateur officiel **`https://vc.1ed.tech`** (verifier `OB30Inspector`, 14 sondes) :

| Chemin de clé | Découverte | Résultat |
|---|---|---|
| `jwk` embarqué dans le header JOSE | aucune (clé dans le token) | **VALID** — 14/14, 0 fatal |
| `kid` = URL HTTPS -> JWK nu hébergé | GET de l'URL du `kid` | **VALID** — 14/14, 0 fatal |

Le second est le **chemin de production** (rotation de clés, CT-7). Testé réellement : clé publique servie sur une URL, récupérée par le validateur, signature vérifiée. `validator-report.json` = rapport de la variante embarquée.

## Ce qu'il faut respecter (contraintes vérifiées, pas supposées)

Tirées du code du validateur (`inspector-vc/.../ExternalProofProbe.java`) et confirmées empiriquement.

1. **JWT nu, pas d'enveloppe `vc`.** Le corps du credential (VCDM 2.0) EST le payload JWT. Les tutoriels VC-JWT 1.1 (`{"vc": {...}}`) sont **faux** pour OB 3.0.
2. **`@context`** dans cet ordre : `https://www.w3.org/ns/credentials/v2`, puis `https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json`. Dates en **`validFrom` / `validUntil`**, jamais `issuanceDate` (v1 = rejet par le schéma JSON).
3. **`type`** : credential `["VerifiableCredential","OpenBadgeCredential"]` ; issuer `Profile` ; sujet `AchievementSubject` ; achievement `Achievement`.
4. **Header JOSE** : `alg` ∈ {`RS256`,`ES256`} (rien d'autre), et **`jwk` OU `kid`** présent.
5. **Chemin `kid` (production)** : le `kid` est une **URL HTTPS déréférençable**, et le corps servi DOIT être **un JWK nu** (`{"kty":...,"n":...,"e":...}`), **pas** une enveloppe JWKS `{"keys":[...]}`. Le validateur lit `.kty` à la racine de la réponse. → conséquence directe pour **SP1** : publier un document JWK par clé (ex. `/keys/<kid>.json`), pas un unique fichier JWKS. Un fragment `#<kid>` dans l'URL est toléré (non transmis au serveur).
6. **Découverte de clé = header, pas profil issuer.** Le chemin `iss -> profil -> publicKey` est celui d'OB 2.0. En OB 3.0 la clé vient du header (`jwk`/`kid`). Le profil issuer doit seulement résoudre et porter `type: Profile`.

## Piège coûteux

**Aucun `\n` final** dans le JWT servi/soumis. Le validateur lit tout le contenu comme un seul token ; un saut de ligne atterrit dans le segment signature et casse la vérif avec un `FATAL` trompeur (« signature resulted invalid »). Coûté ~30 min ici. Le générateur écrit sans newline final.

## Reproduire

```bash
npm i jose            # bibliothèque auditée (CT-9)
node generate.mjs     # signe 2 variantes, auto-vérifie (sign/verify/tamper), écrit out/
curl -s -X POST "https://vc.1ed.tech/api/validate?validatorId=OB30Inspector" \
  -F "file=@out/credential.embedded-jwk.jwt" | jq .summary
# -> {"outcome":"VALID", ...}
```

API du validateur : `POST /api/validate?validatorId=OB30Inspector`, multipart `file=`. Liste des verifiers : `GET /api/validators`.

## Reste à couvrir dans E3 (hors périmètre du spike)

- **`credentialStatus`** en Bitstring Status List v1.0 (`type: BitstringStatusListEntry`) pour la révocation (CT-4). Omis ici (minimal) ; le `statusListCredential` référencé doit lui-même être un `BitstringStatusListCredential` résolvable → à héberger (SP1).
- **`credentialSchema`** (`1EdTechJsonSchemaValidator2019`) recommandé pour l'interop. Non requis : le validateur applique le schéma JSON OB3 de toute façon.
- **Clé réelle** : RSA 2048 en secret GitHub Actions, jamais commit (CT-7/CT-13). Ici la clé est régénérée à chaque run, jetable.

## Fichiers

| Fichier | Rôle |
|---|---|
| `generate.mjs` | Générateur de référence : clé RS256, credential OB3, 2 variantes signées, auto-vérif |
| `credential.reference.json` | Corps du credential de référence (avant signature) |
| `validator-report.json` | Rapport `OB30Inspector` : `outcome: VALID` |
