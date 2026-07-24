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
  D -->|oui| S{"Statut vérifiable ?<br/>(status list joignable + signée)"}
  S -->|non| UNK["Signature valide,<br/>révocation non vérifiée (prudence)"]
  S -->|oui| E{"Révoqué ?"}
  E -->|oui| REV["Révoqué"]
  E -->|non| F{"Expiré ?"}
  F -->|oui| EXP["Expiré"]
  F -->|non| OK["Valide"]
```

> Fail-safe : on n'affirme jamais « valide » sans avoir écarté une révocation. Si le
> status list est injoignable ou non authentifiable, l'état est **prudent**, pas valide.

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

## Clé de signature — cycle de vie

Une paire RS256. Le `kid` = thumbprint RFC 7638 de la clé publique, donc il ne peut
jamais diverger de la clé (l'émission le re-dérive à chaque build).

```mermaid
flowchart LR
  Gen["Cérémonie de clé<br/>(workflow manuel, gate Habilité)"]
  Gen -->|"privée (PKCS8)"| Priv["secret env 'signing'<br/>(jamais dans le dépôt)"]
  Gen -->|"publique (JWK nu)"| Pub["keys/&lt;kid&gt;.json<br/>publiée par PR"]
  Priv -->|"au merge, en CI"| Sign["signe credentials + status list<br/>kid = URL Pages de la clé"]
  Pub -->|"à vie — CT-7"| Verif["déréférencée par le kid des badges"]
  Gen -. "rotation = re-run" .-> New["nouvelle kid<br/>l'ancienne publique RESTE publiée"]
```

- **Génération** : workflow manuel `key-ceremony`, gaté par une review *Habilité*. La
  privée part en secret `SIGNING_PRIVATE_KEY` (env `signing`) ; la publique est publiée
  par une PR de clé. L'émission ne se fait qu'après le merge de cette PR.
- **Rotation** : re-jouer la cérémonie. Une nouvelle `kid` sert les émissions suivantes.
- **Révoquer une clé — nuance** : on ne supprime **jamais** `keys/<kid>.json`. Retirer
  une clé publique rendrait invérifiables **tous** les badges signés avec (CT-7). Donc :
  - « retirer » une clé = **rotation** (arrêter de signer avec l'ancienne) ;
  - **compromission** = rotation **et** révocation, via la status list, de **tous** les
    badges signés par la clé compromise (un attaquant pourrait forger avec elle), puis
    ré-émission des membres légitimes sous la nouvelle clé.
