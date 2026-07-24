# Cartographie des URLs

Deux hôtes, deux rôles. Ne jamais confondre : les uns sont **gravés à vie** dans les
badges, les autres sont juste de la **présentation** remplaçable.

| Base | Rôle | Hébergement |
| --- | --- | --- |
| `DATA_BASE` = `https://ai-driven-dev.github.io/badges` | **Ancre permanente** : clés, statut, issuer, preuves, annuaire, photos. Doit vivre à vie. | GitHub Pages (statique, dispo max) |
| `SITE_BASE` = `https://verify.ai-driven-dev.fr` | **Présentation** : la belle page de vérif, le kit, les images dérivées. | VPS (Astro SSR) |

> `DATA_BASE`/`SITE_BASE` sont définis dans `.github/scripts/lib/credential.mjs`.
> En **prod**, la signature grave `DATA_BASE` (Pages) dans chaque credential — donc un
> badge reste **vérifiable même si le VPS tombe**. Le VPS ne fait que lire Pages et l'habiller.
> En **local**, `npm run demo` (`.github/scripts/demo.mjs`) signe un badge de démo et le sert
> pour tester sans DNS ; ce n'est PAS le schéma de prod.

## 1. Permanent — gravé dans chaque badge (immuable, à vie)

Changer une seule de ces URLs **invalide tous les badges déjà émis**. Servi sous `DATA_BASE`.

| URL | Contenu |
| --- | --- |
| `/issuer.json` | Profil de l'émetteur (`type: Profile`) — `issuer.id` du credential. |
| `/keys/<kid>.json` | 1 JWK **nu** par clé (pas de JWKS array). Publié à vie, même après rotation (CT-7). |
| `/status/1` | Bitstring Status List (révocation, CT-4). Référencé par `credentialStatus`. |
| `/achievements/certified-member` | Définition de l'achievement. |
| `/u/<handle>/credential.jwt` | La preuve VC-JWT signée, téléchargeable (CT-6). |

## 2. Flux public — régénéré par la CI (pas gravé, mais public)

Servi sous `DATA_BASE`. Reconstruit à chaque émission / retrait.

| URL | Contenu |
| --- | --- |
| `/directory.json` | Annuaire des certifiés **actifs** (révoqués exclus, cf. `directory.mjs` `isActive`). Consommé par le site (`/communaute`). |
| `/photos/<handle>.webp` | Photo du membre (copiée depuis LFS au build). |

## 3. Présentation — le site (remplaçable, non gravé)

Servi sous `SITE_BASE` (VPS). Lit les données ci-dessus et les rend au design. Peut évoluer
librement sans toucher aux badges. Les images sont rendues serveur (sharp).

| URL | Contenu | Params |
| --- | --- | --- |
| `/u/<handle>` | Page de vérification publique (vérif crypto **dans le navigateur**). | — |
| `/u/<handle>/kit` | Kit self-service du membre (assets à copier / télécharger). | — |
| `/u/<handle>/badge.png` | Sceau **générique** (favicon, avatar). | `size` (16–1024), `role` (`certifie`\|`habilite`) |
| `/u/<handle>/og.png` | Carte d'aperçu de lien (Open Graph, 1200×630) — déplie le lien collé en carte de marque. Sert aussi de média certificat. | — |
| `/u/<handle>/linkedin.png` | Photo du membre cerclée de l'anneau + pastille de vérification. | `size` (120–1200), `check` (`0` = sans pastille) |
| `/u/<handle>/banner.png` | Coin « certifié » transparent à poser sur SA bannière. | — |
| `/u/<handle>/qr.png` | QR code vers la page de preuve. | `size` |
| `/u/<handle>/photo.png` | Photo du membre en rond, même origine (aperçus, signature email). | `size` (48–1024) |

## Règle d'or

- Une URL de la **section 1** est **irréversible** : `issuer.id`, les URLs de `kid`, les ids
  d'achievement et de statut sont fixés à l'émission. Le domaine `DATA_BASE` doit être renouvelé
  indéfiniment.
- Les URLs de la **section 3** sont **cosmétiques** : on peut changer le rendu, ajouter des
  formats, migrer d'hôte — aucun badge n'en dépend pour être vérifié.
