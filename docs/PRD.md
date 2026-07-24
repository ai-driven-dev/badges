# Badges AIDD — certification vérifiable des membres

Un système qui délivre aux membres certifiés d'AIDD une preuve vérifiable par un tiers, affichable sur LinkedIn et dans un annuaire public, pour que le titre cesse d'être une simple auto-déclaration. L'intake et l'émission sont git-natifs, sur le modèle du dépôt `manifest`.

## Overview

AIDD décerne un titre à ses membres : **Certifié** (niveau 1) après une masterclass évaluée, et — plus tard — **Habilité** (niveau 2). Ce titre atteste qu'ils savent appliquer le flow AIDD et ses concepts.

Hors de la communauté, ce titre ne vaut rien : un recruteur qui le lit sur un CV n'a aucun moyen de savoir s'il est réel. Sans preuve, la certification n'est qu'une décoration.

Ce projet donne à chaque certifié une preuve que **n'importe qui peut vérifier de façon indépendante**, sans avoir à croire AIDD sur parole, et un badge affichable sur LinkedIn, en signature email, sur un site, et dans un **annuaire public des certifiés**. Petit périmètre : moins de 100 certifications par an.

Le mécanisme reprend le modèle éprouvé du dépôt `ai-driven-dev/manifest` : une demande ouvre une **issue**, un bot ouvre une **pull request**, un mainteneur **merge**, et le merge déclenche la génération du badge signé. Le merge par un mainteneur *est* le point d'autorité d'émission.

## Problem Statement

N'importe qui peut écrire « Certified Member AIDD » sur son profil LinkedIn. Rien ne distingue un vrai certifié d'un imposteur.

- **Pour le membre certifié** : son titre n'a aucun poids face à un employeur. L'effort de la masterclass ne se convertit pas en signal reconnaissable.
- **Pour l'employeur** : il ne peut ni vérifier le titre, ni s'y fier. Il l'ignore donc.
- **Pour AIDD** : le titre décerné ne construit aucune valeur externe, et n'importe qui peut l'usurper sans risque.

Le besoin : qu'un tiers puisse **confirmer lui-même** qu'un badge est authentique, qu'il a bien été émis par AIDD, et qu'il appartient bien à la personne qui le présente.

## Goals

- Un membre certifié dispose d'une **preuve exportable** de sa certification, affichable sur LinkedIn et ailleurs.
- Un tiers peut **vérifier l'authenticité d'un badge avec un outil indépendant**, sans dépendre du verdict d'AIDD ni de la disponibilité de ses serveurs.
- Un tiers peut **confirmer que le badge appartient à la personne** qui le lui présente, et pas seulement qu'il a été émis à quelqu'un du même nom.
- Un badge falsifié, forgé ou altéré est **rejeté**, y compris par un vérificateur tiers.
- Le titre **conserve sa valeur dans le temps** : il expire, et ne prétend donc jamais attester une compétence périmée.
- Les certifiés sont présentés dans un **annuaire public**.
- AIDD reste **maître de l'outil** : auto-hébergé, standards ouverts, aucune dépendance à un fournisseur payant.

## Non-Goals

- **Émettre sans revue humaine.** La demande est initiée par le membre, mais aucun badge n'est émis sans le merge d'un mainteneur. C'est une revue, pas du self-service auto-appliqué.
- **Révoquer un badge pour non-paiement.** Qui cesse de payer conserve son badge jusqu'à son échéance.
- **Détecter la triche** ou gérer une contestation de certification.
- **Archiver les notes ou rendus** de la masterclass — hors de ce système.
- **Émettre le badge « Habilité »** en v1 — le niveau 2 est prévu ultérieurement ; le modèle de données l'anticipe (le type de rôle est une donnée).
- **Collecter l'email** des membres — l'identité repose sur le compte GitHub (voir CT-3).
- **La création du visuel du badge** — produite à part (voir `design/`), simplement intégrée ici.

## User Stories

- En tant que **membre certifié**, je veux demander mon badge via un formulaire simple, afin de ne pas avoir à manipuler du YAML ou Git à la main.
- En tant qu'**équipe AIDD**, je veux qu'aucun badge ne soit émis sans que je merge la pull request correspondante, afin de rester la seule autorité d'émission.
- En tant qu'**équipe AIDD**, je veux voir la photo et les informations dans la pull request avant publication, afin de modérer ce qui apparaît sur l'annuaire public.
- En tant que **membre certifié**, je veux recevoir mon badge et une preuve téléchargeable, afin de pouvoir la présenter à qui je veux.
- En tant que **membre certifié**, je veux ajouter mon badge à mon profil LinkedIn sans me tromper de champ, afin que les recruteurs qui me consultent puissent le vérifier.
- En tant que **membre de longue date**, je veux pouvoir repasser la certification librement, afin de renouveler mon badge quand il expire.
- En tant que **visiteur**, je veux parcourir l'annuaire public des certifiés, afin de voir qui est membre.
- En tant qu'**employeur**, je veux vérifier un badge en un clic, afin de savoir immédiatement s'il est valide.
- En tant qu'**employeur méfiant**, je veux vérifier un badge avec un outil que je choisis moi-même, afin de ne pas avoir à faire confiance à AIDD.
- En tant qu'**employeur**, je veux confirmer que le badge appartient bien au candidat en face de moi, afin qu'il ne puisse pas présenter celui d'un autre.
- En tant que **membre**, je veux pouvoir demander le retrait de mes données, afin de ne pas rester exposé après mon départ.

## Acceptance Criteria

**Intake & émission**
- Remplir le formulaire ouvre une **issue**, puis un bot ouvre automatiquement une **pull request** contenant l'enregistrement du membre.
- **Aucun badge n'est émis tant que la pull request n'est pas mergée** par un mainteneur.
- Le **merge** déclenche la génération de la preuve signée, la mise à jour de la liste de statuts, et le déploiement de l'annuaire.
- Une demande en double (personne déjà certifiée) est **détectée et arrêtée** avant d'ouvrir une seconde pull request.

**Vérification**
- Ouvrir l'URL d'un badge réel affiche **« valide »**, avec le nom du titulaire, les dates et l'émetteur.
- Un badge **altéré d'un octet** est rejeté comme **invalide**.
- Un badge **forgé sans la clé privée d'AIDD** est rejeté comme **invalide**.
- Un badge **échu** affiche une page propre « expiré ».
- La page de vérification **contrôle réellement la preuve cryptographique**. Une page qui afficherait « valide » sans le faire est un échec, pas une approximation.

**Vérification indépendante**
- Un tiers **télécharge la preuve brute**, récupère la clé publique d'AIDD, et obtient le même verdict **via un outil de vérification tiers reconnu**, sans utiliser la page d'AIDD.
- Un badge de production est **accepté par le validateur public 1EdTech**.
- L'authenticité reste vérifiable **même si les serveurs d'AIDD sont injoignables**.

**Liaison d'identité**
- Le badge est lié au **compte GitHub** du titulaire, dont le contrôle a été prouvé à l'émission (la demande émane de son compte).
- Un tiers peut confirmer que le badge correspond à la personne en vérifiant qu'elle contrôle ce compte GitHub (ou le profil LinkedIn associé).

**Annuaire & modération**
- Les certifiés apparaissent dans l'**annuaire public**.
- La **photo** d'un membre est visible dans la pull request et n'est publiée qu'après merge.
- Une demande de retrait fait **disparaître la personne de l'annuaire** et **supprime sa photo** (objet Git LFS supprimé), sans réécriture de l'historique principal.

**Cycle de vie**
- Tout badge **expire au bout d'un an**.
- Après renouvellement, l'ancien badge **reste valide jusqu'à sa propre échéance** — il n'est jamais signalé comme révoqué.

## Dependencies

- **Modèle `manifest`** (`ai-driven-dev/manifest`) : le pipeline issue → bot → pull request → merge est calqué sur ce dépôt. Réutiliser son Issue Form, son workflow et son script de lecture de demande comme point de départ.
- **Une GitHub App « bot »** (App ID + clé privée en secret CI) pour ouvrir les pull requests au nom du bot — le `GITHUB_TOKEN` par défaut ne déclenche pas les checks requis. Identique au `SIGNATURE_BOT` du manifest.
- **La clé privée de signature des badges**, stockée en **secret GitHub Actions**, jamais dans le dépôt (CT-7). C'est l'ancre de confiance.
- **Git LFS** pour les photos (CT-12).
- **Conformité Open Badges 3.0**, mesurée par l'acceptation du badge par le validateur public 1EdTech.
- **LinkedIn ne pré-remplit plus les certifications** : le membre saisit chaque champ, dont l'URL de vérification. Le produit doit compenser ce risque (CT-10).
- **Une Page LinkedIn AIDD** (`linkedin.com/company/ai-driven-dev`) pour le bouton d'ajout au profil.
- **Le sous-domaine `verify.ai-driven-dev.fr`** (décidé, SP1), renouvelé à vie, inscrit dans l'identifiant de chaque badge : le changer casse tous les badges déjà émis. Servi en **pages statiques GitHub Pages** (aucune logique serveur au runtime ; voir SP1).
- **Le visuel du badge** (`design/`), produit séparément.

## Open Questions

- **Rendu de l'annuaire et de la photo** : quel générateur pour le site (le manifest utilise Astro) ? *(SP3)*
- **Effacement d'une photo dans LFS** : procédure exacte de suppression de l'objet LFS côté GitHub, à documenter et tester.
- **Aucun juriste n'a validé le dispositif.** Le risque RGPD est faible et documenté (voir annexe), pas levé.

---

# Annexe — Spécification technique

*Cette annexe sort du périmètre « solution-agnostic » du PRD. Elle fixe les contraintes non négociables. Le framework du site, l'ORM éventuel et l'hébergement applicatif restent libres.*

**Conventions.** « DOIT », « NE DOIT PAS », « PEUT » au sens RFC 2119. Chaque contrainte est normative ; justification et source sont fournies pour permettre de la contester sur pièces.

## CT-1 — Format de preuve : VC-JWT signé en RS256

Les credentials DOIVENT être émis au format **VC-JWT**, signés en **RS256**, clés publiées en **JSON Web Key**. **JWT + EdDSA NE DOIT PAS être utilisé.** Open Badges 3.0 ne reconnaît que deux formats conformes : *Linked Data Proofs en EdDSA*, ou *JWT en RS256*. La combinaison JWT + EdDSA n'est aucun des deux et est rejetée par les vérificateurs tiers — silencieusement (tout marche en local). Le chemin JWT est retenu pour éviter la canonicalisation JSON-LD ; son prix est RSA.
> [OB 3.0 Implementation Guide](https://www.imsglobal.org/spec/ob/v3p0/impl)

## CT-2 — La vérification cryptographique DOIT être effective

La vérification DOIT résoudre la clé publique et **contrôler la signature**. Un contrôle limité à la présence des champs NE constitue PAS une vérification. Mode de défaillance documenté : l'émetteur open source Certo (`main`, `bd8a840`) signe correctement mais sa vérification est un stub — `return { valid: true }` après contrôle des seuls champs, sans jamais vérifier la signature. Une page de vérification qui ment est pire que pas de page : elle légitime les contrefaçons.

## CT-3 — Liaison d'identité : compte GitHub, prouvé à l'émission

Le badge DOIT être lié au **compte GitHub** du titulaire. Le contrôle de ce compte est **prouvé à l'émission** : la demande (l'issue, puis la pull request) émane du compte GitHub de la personne, et le merge par un mainteneur atteste cette provenance. Aucun email n'est collecté.

**Justification.** La preuve est exportable (CT-6) ; un badge qui ne porterait qu'un nom serait un **titre au porteur**. Le manifest résout cela par l'authentification GitHub à l'intake plutôt que par un secret vérifié après coup. Le handle GitHub est public, mais le **contrôle** est établi au moment de l'émission, et reste vérifiable a posteriori (le titulaire prouve qu'il contrôle le compte GitHub, ou le profil LinkedIn associé). Cela supprime le besoin d'un magasin d'emails privé.

*Nuance assumée.* Cette liaison est plus faible qu'une preuve cryptographique de possession côté titulaire (un DID lié). Elle est cohérente avec le modèle communautaire et suffisante ici. Un `credentialSubject.id` de type DID reste une évolution possible.

## CT-4 — Révocation par Bitstring Status List v1.0

Le statut de révocation DOIT être publié via une **Bitstring Status List v1.0**, référencée depuis chaque credential. Un format propriétaire NE DOIT PAS être utilisé : il n'est lisible par aucun vérificateur conforme, et un badge révoqué continuerait d'apparaître valide partout ailleurs.

## CT-5 — Le canal de révocation est réservé au retrait

Le `statusPurpose: revocation` NE DOIT servir **qu'**à honorer une demande de retrait de données. Il NE DOIT PAS signaler une supersession : la liste de statuts n'a pas d'état « remplacé », un vérificateur y lirait « révoqué » = invalide. Un badge remplacé **reste valide** jusqu'à son échéance ; la supersession est affichée sur la page, pas publiée dans la liste.

## CT-6 — Exportabilité de la preuve

La preuve brute (JWT signé) DOIT être téléchargeable depuis la page du credential. La procédure de vérification indépendante DOIT être documentée publiquement, en désignant un outil tiers conforme (validateur public 1EdTech). La vérification n'est indépendante que si elle peut s'opérer hors de l'infrastructure d'AIDD, et survivre à la disparition du service.

## CT-7 — Gestion et rotation des clés

Chaque JWT DOIT porter un `kid` **égal à une URL HTTPS déréférençable**. Cette URL DOIT résoudre vers **un document JWK nu** (`{"kty","n","e",…}`) — **pas** une enveloppe JWKS `{"keys":[…]}` : le validateur 1EdTech lit `kty` à la racine de la réponse (vérifié empiriquement, SP4). Concrètement, publier **un fichier JWK par clé** (ex. `/keys/<kid>.json`) ; un index JWKS agrégé PEUT être publié en plus pour d'autres consommateurs, mais n'est pas ce que le `kid` déréférence. Après rotation, **les clés publiques antérieures DOIVENT rester publiées indéfiniment** (les retirer rend invérifiables tous les badges signés avec elles). **La clé privée de signature DOIT être un secret GitHub Actions, jamais commitée**, ni en Git ni en LFS. Elle n'est utilisée qu'au **build** (au merge, en CI) ; le runtime de vérification ne lit que la clé publique. Sa fuite permet de forger des badges AIDD indétectables.

## CT-8 — Cycle de vie

Tout credential DOIT expirer **un an** après l'émission. Toute page de credential — valide, expiré, remplacé, révoqué, inconnu — DOIT retourner une page explicite (jamais un 404). La page d'un credential révoqué NE DOIT divulguer **aucune donnée personnelle**.

## CT-9 — Primitives cryptographiques

Signature et vérification DOIVENT reposer sur une bibliothèque auditée couvrant RS256, JWKS et `kid`. Aucune primitive NE DOIT être réimplémentée. En JavaScript, [`jose`](https://github.com/panva/jose) convient (`SignJWT`, `jwtVerify`, `createRemoteJWKSet`) — vérifié. Tout équivalent dans un autre langage DOIT être vérifié sur ces trois points avant adoption.

## CT-10 — Intégration LinkedIn

La page du credential et le message de livraison DOIVENT présenter les valeurs à reporter dans LinkedIn, champ par champ, dont la **Credential URL**. LinkedIn ne pré-remplit plus les certifications (le microsite `addtoprofile.linkedin.com` redirige vers l'aide : « it will no longer autofill and members must enter the relevant information directly »). La Credential URL étant l'unique lien entre le profil et la preuve, une entrée sans elle est indiscernable d'une auto-déclaration.
> [LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/a528030). Prérequis : une Page LinkedIn.

## CT-11 — Pipeline d'intake git-natif

L'intake DOIT suivre le modèle `manifest` : un **Issue Form** pose un label infalsifiable côté serveur ; un workflow, agissant sous une **GitHub App** (pas le `GITHUB_TOKEN` par défaut), lit la demande, écrit l'enregistrement, ouvre une **pull request** et ferme l'issue. **L'émission (signature) n'a lieu qu'au merge sur `main`.** Le merge par un mainteneur EST le point d'autorité (CT-3, E0). Aucune voie NE DOIT permettre d'émettre un badge sans ce merge.

## CT-12 — Séparation du magasin de données

Les données DOIVENT être scindées selon leur effaçabilité :
- **Publiques et durables** (handle GitHub, nom, LinkedIn, rôle, dates, identifiant de badge) → fichiers versionnés dans Git. Publiées par conception, destinées à persister ; base légale = exécution du contrat.
- **Photos** → **Git LFS**. Le binaire vit comme objet LFS hors de l'historique principal ; Git ne garde qu'un pointeur. L'effacement DOIT être la **suppression de l'objet LFS**, sans réécriture d'historique. Les photos DOIVENT être **redimensionnées, converties en WebP/AVIF et débarrassées de leurs métadonnées EXIF** (géolocalisation) avant publication. L'original n'est pas conservé.
- **Aucune donnée personnelle effaçable NE DOIT être écrite dans l'historique Git ordinaire** (il est append-only ; `git rm` n'efface pas le passé).

## CT-13 — Aucun secret dans le dépôt

La clé privée de signature (CT-7) et la clé privée de la GitHub App (CT-11) NE DOIVENT jamais être commitées, ni en Git ni en LFS. Elles vivent en secrets GitHub Actions. Le `.gitignore` DOIT bloquer les extensions de clés et les fichiers d'environnement.

## CT-14 — Dépôt public

Le dépôt DOIT être **public**. Les verrous de confiance dont dépend tout le dispositif — protection de branche (le merge par un mainteneur = point d'autorité, CT-11) et protection d'environnement (le gate de review sur la signature, CT-7) — **ne sont pas disponibles sur un dépôt privé au plan gratuit** (vérifié : `403`/`422` de l'API GitHub). Les rendre effectifs impose soit le public (gratuit), soit un plan payant (écarté, cf. « aucune dépendance payante »). Le public est sans risque ici : la clé privée est un secret hors dépôt (CT-7/CT-13), aucune donnée effaçable ne vit en Git (CT-12), et les données des membres sont de toute façon destinées à l'annuaire public. Le public renforce aussi l'intake : tout titulaire d'un compte GitHub peut déposer sa demande (CT-11). Repasser le dépôt en privé désactiverait les verrous et casserait le modèle de confiance.

## Modèle de données

**Un dossier par membre**, nommé d'après son handle GitHub : `data/members/<handle>/record.yml` (la fiche) + `data/members/<handle>/photo.webp` (objet Git LFS). L'effacement RGPD est alors `rm -rf data/members/<handle>/`. Ces champs sont **publics et durables** (CT-12) et vivent dans Git.

```yaml
github: <handle>          # requis — identité du badge (CT-3), = auteur de l'issue de demande
role: certifie            # requis — certifie | habilite
name: Prénom Nom          # requis — nom public
linkedin: https://...     # requis — URL de profil
photo: <chemin LFS>       # requis — data/members/<handle>/photo.webp (objet Git LFS), normalisé WebP sans EXIF
status_index: <entier>    # requis — index permanent dans la Bitstring Status List (CT-4), assigné à l'intake
website: https://...      # optionnel — site personnel
description: <une ligne>  # optionnel — présentation affichée dans l'annuaire (≤ 280)
renewed_on: <date ISO>    # optionnel — renouvellement (#27) : prime sur la date de 1re certif
```

**Renouvellement (#27).** Par défaut, la date d'émission = date du commit qui a
ajouté le record (1re certification). Un renouvellement fixe `renewed_on` dans le
record : l'émission repart de cette date (nouvelle fenêtre de 1 an). Une preuve
déjà exportée garde son ancienne échéance et reste valide jusque-là.

**Retrait RGPD (#36).** Un retrait **supprime tout le dossier** `data/members/<handle>/` (fiche + photo LFS) — l'effacement, pas une réécriture d'historique. Pour que le badge reste révoqué à vie malgré la disparition de la fiche, son `status_index` est inscrit dans un **registre de révocation** `data/revoked.json` (une liste d'entiers — pas de donnée personnelle). La liste de statuts (CT-4) se construit à partir de ce registre. Une preuve déjà exportée reste présentable mais apparaît **révoquée** à la vérification (CT-5, seule voie).

Le site public `ai-driven-dev.fr` (`/communaute`) affiche l'annuaire ; il consomme le flux **`directory.json`** publié par la CI sur l'ancre Pages `ai-driven-dev.github.io/badges` (nom, LinkedIn, photo, site, description, URL de vérif). Les photos sont servies sur `ai-driven-dev.github.io/badges/photos/<handle>.webp`. Les membres révoqués sont exclus du flux. (Hôtes : cf. `ARCHITECTURE.md`.)

**Généré à l'émission, pas saisi** (calculé par la CI pour qu'un demandeur ne fixe pas lui-même sa validité) :

- `badge_id` — identifiant unique du credential ;
- `certified_on` — date d'émission = **date du commit qui a ajouté le record** (déterministe ; `renewed_on` prime au renouvellement) ;
- `expires_on` — `certified_on` + 1 an (CT-8).

Ces valeurs ne figurent pas dans le YAML d'intake : elles sont scellées dans le credential signé et exposées par la page de vérification.

**Photo** : jamais le binaire dans le YAML — seulement un chemin vers un objet **Git LFS** (CT-12). L'effacement est la suppression de l'objet LFS, sans réécriture d'historique.

**Aucune donnée effaçable (email) n'est stockée** — l'identité repose sur le compte GitHub (CT-3).

## Validation de conformité

Le validateur public [`1EdTech/digital-credentials-public-validator`](https://github.com/1EdTech/digital-credentials-public-validator) fait référence : un credential qu'il rejette n'est pas conforme, quel que soit le verdict de notre page.

## Solutions évaluées et écartées

| Solution | Motif |
|---|---|
| **Credly** | Tarification sur devis, ~3 000 $/an rapportés pour 500 credentials (estimation indirecte). Lock-in. |
| **Accredible** | Pas d'offre gratuite pérenne (~45 $/mois, engagement 12 mois). |
| **Badgr / Canvas** | Émission gratuite arrêtée le 31/12/2025. |
| **Certifier.io** | SaaS ; conformité OB 3.0 réelle non confirmée. |
| **Certo** | Vérification non implémentée (CT-2). |
| **Modèle manifest pur (sans crypto)** | Abandonnerait la vérifiabilité tierce, jugée critique. Retenu pour l'intake, pas pour la preuve. |
| **Linked Data Proofs / EdDSA** | Impose la canonicalisation JSON-LD (CT-1). |

---

# Annexe — Feuille de route de construction

*Séquence indicative. L'ordre suit les dépendances : chaque phase produit un résultat vérifiable.*

## Surfaces

| Surface | Rôle | Accès |
|---|---|---|
| Formulaire / Issue Form | Demande de certification | Public (membre) |
| Bot + workflow PR | Écrit l'enregistrement, ouvre la PR | GitHub App |
| Merge (mainteneur) | Point d'autorité → déclenche l'émission | Équipe AIDD |
| Job de signature (CI) | Génère le VC-JWT signé au merge | Secret CI |
| Annuaire + page de vérification | Affichage public, vérification réelle | Public |
| JWKS + Bitstring Status List | Clés publiques, statuts | Public |

## Phase 0 — Socle de confiance
- Réserver le sous-domaine permanent + TLS.
- Générer la paire RSA ; clé privée en **secret GitHub Actions** (jamais commitée).
- Publier le JWKS avec `kid`, conservation des anciennes clés prévue.
- Créer la GitHub App « bot » (App ID + clé privée en secret).
- Activer **Git LFS** pour `*.webp`/`*.avif`.

## Phase 1 — Intake (calqué sur manifest)
- Issue Form (rôle, handle déduit du compte, nom, LinkedIn, photo).
- Workflow sous GitHub App : lecture de la demande, dédup, écriture de l'enregistrement + photo (LFS, WebP + strip EXIF), ouverture de la PR, fermeture de l'issue.
- **Vérifiable :** une demande ouvre une PR contenant l'enregistrement et la photo, visible en revue.

## Phase 2 — Émission au merge
- Au merge sur `main` : générer le credential OB 3.0 signé (RS256, `kid`, expiration 1 an, `credentialStatus`, liaison au handle GitHub), publier la preuve téléchargeable.
- Ré-émission : l'ancien badge reste valide jusqu'à échéance (pas de révocation).
- **Vérifiable :** un badge émis est **accepté par le validateur public 1EdTech**. Jalon de conformité.

## Phase 3 — Vérification & annuaire
- Page de vérification : signature + `exp` + statut, réellement contrôlés ; états valide/expiré/remplacé/révoqué/invalide, toujours en page propre.
- Téléchargement de la preuve brute + doc de vérification indépendante.
- Bitstring Status List publiée.
- Annuaire public des certifiés (photo, nom, rôle, lien de vérification).
- **Vérifiable :** test adverse (badge forgé + badge altéré rejetés par la page **et** par le validateur tiers) ; authenticité vérifiable serveur de statut injoignable.

## Phase 4 — LinkedIn & partage
- Bouton Add-to-Profile + bloc de valeurs à copier (page + email).
- Kits de partage (anneau LinkedIn, signature email, badge embed) issus de `design/`.

## Phase 5 — Retrait & RGPD
- Procédure de retrait : révocation dans la liste de statuts + retrait de l'annuaire + **suppression de l'objet LFS de la photo**.
- Vérifier que les CGU décrivent ce traitement (information art. 13, pas de consentement).
- Rédiger et archiver la justification de non-réalisation d'une AIPD.
