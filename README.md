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

## Membres certifiés

<table>
<tr>
<td align="center" width="140">
<a href="https://verify.ai-driven-dev.fr/u/doheto"><img src="data/members/doheto/photo.webp" width="72" height="72" style="border-radius:50%"/></a><br/>
<b>Gildas Avocegamou</b><br/>
<sub><a href="https://verify.ai-driven-dev.fr/u/doheto">Badge</a> · <a href="https://www.linkedin.com/in/gildas-avocegamou">LinkedIn</a></sub>
</td>
<td align="center" width="140">
<a href="https://verify.ai-driven-dev.fr/u/jdm-web"><img src="data/members/jdm-web/photo.webp" width="72" height="72" style="border-radius:50%"/></a><br/>
<b>Jeremy Desvaux de Marigny</b><br/>
<sub><a href="https://verify.ai-driven-dev.fr/u/jdm-web">Badge</a> · <a href="https://www.linkedin.com/in/jeremydesvaux/">LinkedIn</a></sub>
</td>
<td align="center" width="140">
<a href="https://verify.ai-driven-dev.fr/u/tkman59"><img src="data/members/tkman59/photo.webp" width="72" height="72" style="border-radius:50%"/></a><br/>
<b>Thierry Kwiatkowski</b><br/>
<sub><a href="https://verify.ai-driven-dev.fr/u/tkman59">Badge</a> · <a href="https://www.linkedin.com/in/thierry-kwiatkowski">LinkedIn</a></sub>
</td>
<td align="center" width="140">
<a href="https://verify.ai-driven-dev.fr/u/templth"><img src="data/members/templth/photo.webp" width="72" height="72" style="border-radius:50%"/></a><br/>
<b>Thierry Templier</b><br/>
<sub><a href="https://verify.ai-driven-dev.fr/u/templth">Badge</a> · <a href="https://www.linkedin.com/in/thierry-templier-7ba726/">LinkedIn</a></sub>
</td>
</tr>
</table>

Annuaire complet (vérifié en direct depuis les badges signés) : **[verify.ai-driven-dev.fr/communaute](https://verify.ai-driven-dev.fr/communaute)**.

---

Chaque membre certifié reçoit un **badge Open Badges 3.0** (signé RS256) dont
l'authenticité se **vérifie par un tiers, indépendamment de nos serveurs**,
affichable sur LinkedIn et ailleurs.

## Le process

1. **S'inscrire** — un membre remplit un formulaire (issue GitHub). Son identité = son compte GitHub.
2. **Générer** — un bot en fait une pull request (fiche + photo normalisée + aperçu de modération).
3. **Émettre** — un mainteneur **merge** : c'est le point d'autorité. Le badge est signé et publié.
4. **Vérifier** — la page du badge contrôle la signature **dans le navigateur** (QR, preuve téléchargeable).
5. **Mettre à jour** — un formulaire modifie nom, photo, LinkedIn, site ou description ; l'annuaire seul change, le badge signé reste identique.
6. **Retirer** — une demande de retrait supprime la fiche + la photo et révoque le badge (RGPD).

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
| `docs/ARCHITECTURE.md` | Architecture, flux et **diagrammes** (deux hôtes, émission, vérif, retrait, cycle de vie de la clé) |
| `docs/urls.md` | Cartographie des URLs (permanent gravé vs présentation) |
| `docs/verification.md` | Vérifier un badge indépendamment (page, 1EdTech, hors ligne) |
| `MAINTAINERS.md` | Guide des mainteneurs, étape par étape |
| `docs/PRD.md` | Référence : exigences + contraintes (CT-1…CT-14), rationale |
| `docs/rgpd/` | Information (art. 13) + justification non-AIPD |
| `.github/scripts/` | Intake, émission, révocation, annuaire (+ tests) |
| `site/` | Code de vérification navigateur (+ tests) |
| `data/members/<handle>/` | Fiche + photo d'un membre (photo en Git LFS) |

## Garde-fous (non négociables)

1. **La clé privée de signature ne va jamais dans le dépôt** — secret CI. Sa fuite = badges forgés.
2. **Aucune donnée personnelle effaçable dans l'historique Git** — photos en LFS, retrait = suppression d'objet.
3. **Le dépôt reste public** — les verrous de confiance l'exigent au plan gratuit (CT-14).
