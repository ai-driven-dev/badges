# SP2 — Faisabilité du pipeline photo

**Statut : levé.** Le pipeline « image d'issue → resize → WebP → strip EXIF → LFS »
est faisable en CI avec `sharp`, prouvé bout-en-bout. Débloque #21.

## Décision

| Sujet | Décision |
|---|---|
| **Bibliothèque** | **`sharp`** (libvips). Resize + conversion WebP + strip EXIF en un seul passage. Binaire prébuilt pour linux-x64 → `npm i sharp` marche sur les runners GitHub. |
| **Strip EXIF** | **Par défaut** : sharp ne recopie PAS les métadonnées en sortie sauf `withMetadata()`. On ne l'appelle jamais → EXIF (GPS, etc.) supprimé. `.rotate()` applique d'abord l'orientation puis la jette. |
| **Format de sortie** | WebP carré **512×512**, `fit: cover`, qualité 82. ~5 Ko/photo. |
| **Source de l'URL** | Champ photo de l'Issue Form : markdown `![alt](url)` (ou URL nue). Regex d'extraction. |
| **Garde-fous** | `content-type` doit commencer par `image/` ; taille max 10 Mo ; rejet sinon. |
| **Stockage** | `data/members/photos/<handle>.webp` routé vers **Git LFS** (#16 déjà en place). |

## Prouvé (sur pièces)

- `proof-transform.mjs` : JPEG **avec EXIF (222 o, GPS)** → **WebP 512×512, EXIF absent**. Le strip fonctionne.
- `proof-e2e.mjs` : parse d'URL markdown → **téléchargement réel** d'une image publique → normalisation WebP 512×512 sans EXIF → **rejet** d'une réponse non-image (HTML).

```
ENTRÉE : format=jpeg 1200x1600 exif=présent (222o)
SORTIE : format=webp 512x512 exif=absent taille=548o
PASS
```

## À valider à l'implémentation (#21)

- **Auth de téléchargement.** Les images collées dans une issue sont hébergées sur
  `github.com/user-attachments/assets/<uuid>` (dépôt public : redirection vers un
  blob signé). Le fetch suit les redirections ; passer le **token du bot d'intake**
  en `Authorization` couvre le cas où l'accès est restreint. À confirmer avec une
  vraie pièce jointe (non reproductible hors issue réelle).
- **Écriture LFS en CI.** Le job commite le `.webp` ; `.gitattributes` (#16) le route
  en pointeur. Le checkout du job doit activer `lfs: true`.
- **Absence de photo.** Champ vide → pas d'écriture, pas d'échec (scénario #21).

## Reproduire

```bash
npm i sharp@0.33
node proof-transform.mjs   # strip EXIF
node proof-e2e.mjs         # parse + download + normalize + rejet
```

## Fichiers

| Fichier | Rôle |
|---|---|
| `pipeline.mjs` | Fonctions réutilisables : `extractImageUrl`, `downloadImage`, `normalize` (base de #21) |
| `proof-transform.mjs` | Preuve du strip EXIF + resize + WebP |
| `proof-e2e.mjs` | Preuve bout-en-bout (parse → download réel → normalize → rejet) |
