# Processus

Les flux du système, en clair. Détail des contraintes : `PRD.md`.

## Architecture (deux dépôts)

Ce dépôt = la **machinerie + les données** (signature, vérif, flux). Le site
`ai-driven-dev.fr` = l'**affichage** (`/communaute`). La génération est de la CI,
pas un serveur — seul `verify.ai-driven-dev.fr` (Pages, statique) a une URL publique.

```mermaid
flowchart LR
  Membre["Membre / LinkedIn"]
  subgraph badges["repo ai-driven-dev/badges"]
    CI["GitHub Actions<br/>signe + build"]
  end
  Pages["verify.ai-driven-dev.fr<br/>(GitHub Pages, statique)"]
  subgraph site["repo ai-driven-dev.fr (VPS, Astro)"]
    Comm["page /communaute"]
  end
  CI -->|"deploy"| Pages
  Pages -->|"directory.json + photos"| Comm
  Membre -->|"clic badge"| Pages
```

## Inscription → émission

Le formulaire crée une issue ; le bot en fait une PR (fiche + photo normalisée + commentaire de
modération). **Le merge par un mainteneur est le point d'autorité** : il déclenche l'émission signée.

```mermaid
sequenceDiagram
  participant M as Membre
  participant B as Bot (GitHub App)
  participant R as Mainteneur
  participant CI as CI (env signing)
  M->>B: Issue Form (inscription + photo)
  B->>B: parse, photo WebP + strip EXIF (LFS)
  B->>R: PR + commentaire de modération
  R->>CI: merge sur main (autorité)
  CI->>CI: signe le credential (RS256, déterministe)
  CI->>Pages: publie /u/handle, QR, clés, directory.json
```

## Vérification (côté navigateur, indépendante)

La page charge la preuve, récupère la clé via le `kid`, **vérifie la signature dans le
navigateur**, puis contrôle révocation et expiration. Aucun serveur AIDD n'intervient.

```mermaid
flowchart TD
  A["Employeur ouvre /u/handle"] --> B["JS charge credential.jwt"]
  B --> C["Récupère la clé via le kid"]
  C --> D{"Signature valide ?"}
  D -->|non| INV["Invalide"]
  D -->|oui| E{"Révoqué ? (status list)"}
  E -->|oui| REV["Révoqué"]
  E -->|non| F{"Expiré ?"}
  F -->|oui| EXP["Expiré"]
  F -->|non| OK["Valide"]
```

## Retrait RGPD

Le retrait **supprime tout le dossier** du membre (fiche + photo LFS) et inscrit son
`status_index` au registre `revoked.json` — le badge reste révoqué à vie. Une preuve
déjà exportée apparaît **révoquée** à la vérif (seule voie).

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

## Cérémonie de clé (init / rotation)

Manuelle, rare, gatée par une review Habilité. La clé privée est générée dans le runner,
déposée en secret, jamais vue ni committée. Les clés publiques passées restent publiées à vie.

```mermaid
flowchart LR
  Admin["Admin"] -->|"Run workflow"| Gate["env key-ceremony<br/>(review Habilité)"]
  Gate --> Gen["génère la paire RS256"]
  Gen -->|"clé privée"| Secret["secret env signing"]
  Gen -->|"clé publique"| PR["PR keys/&lt;kid&gt;.json"]
```
