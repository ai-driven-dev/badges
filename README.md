<div align="center">

# AIDD Badges 🇫🇷

## Certification vérifiable des membres de la communauté AI-Driven Development.

<p>
  <kbd>Open Badges 3.0</kbd> · <kbd>VC-JWT RS256</kbd> · <kbd>Git-natif</kbd> · <kbd>Sans email</kbd>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://github.com/ai-driven-dev/badges/actions/workflows/scripts-tests.yml/badge.svg?branch=main)](https://github.com/ai-driven-dev/badges/actions/workflows/scripts-tests.yml)
[![Made in France](https://img.shields.io/badge/made%20in-France-0055A4?labelColor=EF4135)](https://www.ai-driven-dev.fr/)

</div>

---

Chaque membre certifié reçoit un **badge Open Badges 3.0** (signé RS256) dont
l'authenticité se **vérifie par un tiers, indépendamment de nos serveurs**,
affichable sur LinkedIn et ailleurs.

## Le process

1. **S'inscrire** — un membre remplit un formulaire (issue GitHub). Son identité = son compte GitHub.
2. **Générer** — un bot en fait une pull request (fiche + photo normalisée + aperçu de modération).
3. **Émettre** — un mainteneur **merge** : c'est le point d'autorité. Le badge est signé et publié.
4. **Vérifier** — la page du badge contrôle la signature **dans le navigateur** (QR, preuve téléchargeable).
5. **Retirer** — une demande de retrait supprime la fiche + la photo et révoque le badge (RGPD).

Détail des flux : **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.
Guide des mainteneurs : **[MAINTAINERS.md](MAINTAINERS.md)**.

## Tester en local (sans DNS)

```bash
cd .github/scripts && npm ci
npm test      # ~140 tests
npm run demo  # signe un badge de démo et le sert -> http://localhost:8000/u/demo
```

## Structure

| Chemin | Contenu |
|---|---|
| `docs/ARCHITECTURE.md` | L'architecture et les flux (diagrammes) |
| `MAINTAINERS.md` | Guide des mainteneurs, étape par étape |
| `docs/PRD.md` | Spécification + contraintes techniques (CT-1…CT-14) |
| `docs/rgpd/` | Information (art. 13) + justification non-AIPD |
| `.github/scripts/` | Intake, émission, révocation, annuaire (+ tests) |
| `site/` | Code de vérification navigateur (+ tests) |
| `data/members/<handle>/` | Fiche + photo d'un membre (photo en Git LFS) |

## Garde-fous (non négociables)

1. **La clé privée de signature ne va jamais dans le dépôt** — secret CI. Sa fuite = badges forgés.
2. **Aucune donnée personnelle effaçable dans l'historique Git** — photos en LFS, retrait = suppression d'objet.
3. **Le dépôt reste public** — les verrous de confiance l'exigent au plan gratuit (CT-14).
