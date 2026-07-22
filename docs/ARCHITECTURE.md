# Architecture

## Deux couches

| Couche | Où | Rôle |
|---|---|---|
| **Données** | GitHub **Pages** (`ai-driven-dev.github.io/badges`) | Clés, statut, issuer, preuves, photos. L'**ancre permanente** (uptime GitHub) et le **fallback**. |
| **Affichage** | Le **site** (VPS, Astro : `verify.ai-driven-dev.fr`) | La **belle** page de vérif + le badge visuel + l'annuaire `/communaute`. Lit les données depuis Pages. |

Le badge (et son QR) pointent vers la belle page du **site**. Si le site tombe, la
preuve reste vérifiable via Pages — c'est le fallback. La **génération/signature** est
de la CI GitHub (la clé privée n'est jamais sur un serveur).

```mermaid
flowchart LR
  subgraph gh["GitHub"]
    CI["CI : signe (clé privée)"]
    Pages["Pages : clés, statut, preuves<br/>(ancre + fallback)"]
  end
  subgraph vps["Site — VPS, Astro"]
    UI["/u/handle (belle vérif) + /communaute"]
  end
  Visiteur["Visiteur"]
  CI -->|"publie"| Pages
  Visiteur -->|"clic badge"| UI
  UI -->|"lit les données"| Pages
```

## Inscription → émission

Le merge par un mainteneur **est** le point d'autorité : il déclenche la signature.

```mermaid
sequenceDiagram
  participant M as Membre
  participant B as Bot (GitHub App)
  participant R as Mainteneur
  participant CI as CI (env signing)
  M->>B: Issue Form (inscription + photo)
  B->>B: parse, photo WebP + strip EXIF (LFS)
  B->>R: PR + aperçu de modération
  R->>CI: merge sur main (autorité)
  CI->>CI: signe le credential (RS256, déterministe)
  CI->>Pages: publie clés, preuve, QR, annuaire
```

## Vérification (dans le navigateur, indépendante)

```mermaid
flowchart TD
  A["Ouvre la page du badge"] --> B["charge credential.jwt (Pages)"]
  B --> C["récupère la clé via le kid (Pages)"]
  C --> D{"Signature valide ?"}
  D -->|non| INV["Invalide"]
  D -->|oui| E{"Révoqué ? (status list)"}
  E -->|oui| REV["Révoqué"]
  E -->|non| F{"Expiré ?"}
  F -->|oui| EXP["Expiré"]
  F -->|non| OK["Valide"]
```

## Retrait RGPD

```mermaid
sequenceDiagram
  participant M as Membre
  participant B as Bot
  participant R as Mainteneur
  participant CI as CI
  M->>B: Issue Form (retrait)
  B->>B: rm -rf data/members/handle + index vers revoked.json
  B->>R: PR de retrait
  R->>CI: merge
  CI->>Pages: status list révoque, annuaire retire, photo supprimée
```

## Données d'un membre

`data/members/<handle>/record.yml` (fiche) + `photo.webp` (objet Git LFS). L'effacement
RGPD = `rm -rf data/members/<handle>/`. La révocation survit dans `data/revoked.json`
(juste des entiers, non personnels). Schéma des champs : `PRD.md`.

## Clé de signature

Une paire RS256. La **privée** vit en secret d'environnement CI (`signing`), utilisée
seulement au merge ; jamais dans le dépôt. La **publique** est publiée à vie
(`keys/<kid>.json`) : retirer une ancienne clé rendrait ses badges invérifiables.
Rotation : un workflow manuel gaté par une review Habilité (`key-ceremony`).
