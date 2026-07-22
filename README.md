# badges

Certification vérifiable des membres de la communauté AI-Driven Development.

Chaque membre certifié reçoit un badge **Open Badges 3.0** (VC-JWT signé RS256) dont
l'authenticité se **vérifie par un tiers, indépendamment de nos serveurs**, affichable
sur LinkedIn et ailleurs.

## En bref

- **S'inscrire** : un formulaire ouvre une issue → un bot en fait une PR (fiche + photo
  normalisée + commentaire de modération). Le **merge par un mainteneur émet le badge**.
- **Vérifier** : la page `/u/<handle>` contrôle la signature **dans le navigateur** ;
  QR code et preuve téléchargeable inclus. Le validateur public 1EdTech confirme.
- **Révoquer / retirer** : une demande de retrait supprime le dossier (fiche + photo) et
  révoque le badge à vie via une liste de statuts.

Les flux détaillés (avec diagrammes) : **[`docs/PROCESS.md`](docs/PROCESS.md)**.

## Pourquoi ces choix

- **Open Badges 3.0, pas une image.** Un badge doit prouver *qui l'a émis*. Une image se
  copie ; une signature cryptographique, non. On émet une preuve signée, pas un joli PNG.
- **Vérification indépendante.** Un employeur méfiant ne devrait pas avoir à *nous* faire
  confiance. La signature se vérifie dans son navigateur, ou avec un outil tiers (validateur
  public 1EdTech), sans passer par nos serveurs.
- **Git-natif.** Pas d'appli à héberger : le registre est des fichiers, l'autorité est le
  *merge* d'un mainteneur, l'audit est l'historique Git. Simple, transparent, durable.
- **Aucun email.** L'identité, c'est le compte GitHub (prouvé à l'inscription). Pas de
  magasin d'emails à sécuriser ni à effacer — moins de données, moins de risque RGPD.
- **La clé privée ne bouge pas.** Elle ne sert qu'à signer, en CI, dans un environnement
  gaté. Jamais dans le dépôt, jamais sur un serveur exposé. Sa fuite = badges forgés.

## Architecture

Deux dépôts. **Celui-ci** = la machinerie et les données (signature, vérif, flux) ;
tout est de la CI + des fichiers statiques servis sur `verify.ai-driven-dev.fr` (GitHub
Pages). Le site **`ai-driven-dev.fr`** (VPS) affiche l'annuaire sur `/communaute` en
consommant `directory.json`.

## Structure

| Chemin | Contenu |
|---|---|
| `docs/PRD.md` | Spécification + contraintes techniques (CT-1…CT-14) |
| `docs/PROCESS.md` | Les flux, en diagrammes |
| `docs/verification.md` | Vérifier un badge sans nous faire confiance |
| `docs/rgpd/` | Information (art. 13) + justification non-AIPD |
| `docs/spikes/` | Décisions de-risquées (conformité, domaine, photo, site) |
| `.github/scripts/` | Intake, émission, révocation, annuaire (+ tests) |
| `site/` | Code de vérification navigateur (+ tests) |
| `data/members/<handle>/` | Fiche + photo d'un membre (photo en Git LFS) |
| `design/` | Kit visuel des badges (v2) |

## Garde-fous (non négociables)

1. **La clé privée de signature ne va jamais dans le dépôt** — secret d'environnement CI.
   Sa fuite = badges AIDD forgés indétectables.
2. **Aucune donnée personnelle effaçable dans l'historique Git** — les photos vivent en
   LFS, le retrait est une suppression d'objet, pas une réécriture d'historique.
3. **Le dépôt reste public** — les verrous de confiance (protection de branche +
   environnement) l'exigent au plan gratuit (CT-14).

## Tester en local (sans DNS)

```bash
cd .github/scripts && npm ci
npm test        # ~140 tests (intake, émission, vérif, révocation, annuaire)
npm run demo    # signe un badge de démo et sert tout en localhost
```

`npm run demo` ouvre `http://localhost:8000/u/demo` : la **page de vérification réelle**,
qui contrôle la signature dans le navigateur — sans domaine ni DNS.

## Statut

v1 en place : inscription → émission → vérification → révocation → retrait, signé et testé.
Reste : le domaine de vérification (DNS) et le rendu `/communaute` (autre dépôt).
