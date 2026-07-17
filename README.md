# aidd-badges

Certification vérifiable des membres de la communauté AI-Driven Development.

Chaque membre certifié reçoit un badge dont l'authenticité est **vérifiable par un tiers de façon indépendante** (Open Badges 3.0), affichable sur LinkedIn, en signature email, sur un site, et dans un annuaire public. Deux rôles : **Certifié** (niveau 1, v1) et **Habilité** (niveau 2, v2).

## Comment ça marche

Intake git-natif, calqué sur [`ai-driven-dev/manifest`](https://github.com/ai-driven-dev/manifest) :

1. Un membre remplit l'**Issue Form** → une issue est ouverte.
2. Un bot (GitHub App) lit la demande, écrit son enregistrement, traite sa photo, et ouvre une **pull request**.
3. Un mainteneur **relit et merge**. Ce merge est le **point d'autorité d'émission** : rien n'est émis sans lui.
4. Le merge déclenche la génération du **badge Open Badges 3.0 signé** (à ajouter — job d'émission), la mise à jour de la liste de statuts, et le déploiement de l'annuaire.

## Structure

| Chemin | Contenu |
|---|---|
| `docs/PRD.md` | Spécification produit + contraintes techniques (CT-1 → CT-13) + feuille de route |
| `design/` | Kit de badges importé depuis Claude Design |
| `data/members/` | Registre des certifiés (un YAML par personne). Voir son README pour le schéma |
| `.github/` | Issue Form + workflow d'ouverture de PR (calqué sur manifest) |

## État du pipeline

| Pièce | État |
|---|---|
| Issue Form (`certification.yml`) | Squelette |
| Script de lecture (`read-certification-request.js`) | Écrit, **non testé** |
| Workflow d'ouverture de PR | Écrit, **non testé** |
| Traitement photo (download → WebP → strip EXIF → LFS) | **À éprouver** — le manifest n'a pas cet équivalent |
| Job d'émission au merge (signature RS256) | **À écrire** |
| Annuaire + page de vérification | À écrire |

## Setup requis (manuel, hors code)

Ces étapes ne peuvent pas être scriptées depuis le dépôt :

1. **Créer une GitHub App « badge-bot »** (droits : issues RW, contents RW, pull requests RW). Renseigner :
   - variable `BADGE_BOT_APP_ID`
   - secret `BADGE_BOT_PRIVATE_KEY`
2. **Générer la clé de signature RS256** et la mettre en **secret CI** (jamais dans le dépôt — CT-7/CT-13). Publier la clé publique en JWKS.
3. **Activer Git LFS** sur le dépôt (`git lfs install`) — les photos y sont routées par `.gitattributes`.
4. **Réserver le sous-domaine de vérification** (permanent, 5 ans min — CT-11 infra).

## ⚠️ Garde-fous — à lire avant tout commit

Dépôt **privé**, mais un dépôt privé n'est pas un coffre-fort, et Git n'oublie rien.

1. **La clé privée de signature ne DOIT jamais être commitée** (ni Git, ni LFS). Secret CI uniquement. Sa fuite = badges AIDD forgés indétectables (CT-7, CT-13).
2. **Aucune donnée personnelle effaçable ne DOIT aller dans l'historique Git ordinaire.** `git rm` n'efface pas le passé. Le modèle sépare donc les données (CT-12) :
   - **Publiques et durables** (handle, nom, LinkedIn, rôle, dates) → Git.
   - **Photos** → **Git LFS** (effacement = suppression de l'objet LFS).
   - **Email** → **non collecté** : l'identité repose sur le compte GitHub (CT-3).

## Statut

Amorçage. Le PRD (`docs/PRD.md`) est la source de vérité. Le pipeline d'intake est scaffoldé mais non testé ; l'émission signée reste à écrire. Stack du site non tranchée.
