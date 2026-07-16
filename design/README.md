# Design — Badges AIDD

Source : projet Claude Design **« Badge de certification communauté »**
`https://claude.ai/design/p/1a46ce33-ef04-435c-8a71-76f115cdfc87`

Kit de badges pour deux rôles — **Certifié** (niveau 1) et **Habilité** (niveau 2) — couvrant : sceau, anneau de photo LinkedIn + coin de bannière, badge intégrable web, signature email, et la maquette de la page de vérification.

## Fichiers importés (via le MCP Claude Design)

| Fichier | État |
|---|---|
| `Badges AIDD.dc.html` | ✅ complet — la maquette principale (source `.dc.html`) |
| `support.js` | ✅ complet — runtime Design Canvas requis |
| `image-slot.js` | ✅ complet — composant de dépôt d'image |
| `Seal.dc.html` | ❌ **manquant** — dépasse le plafond de lecture du MCP (256 Kio ; il inline le PNG du sceau). À récupérer par export |
| `assets/logo.png`, `Badge AIDD - standalone.html`, `screenshots/` | ❌ **manquants** — mêmes raisons (binaires / bundle > 256 Kio) |

⚠️ `Badges AIDD.dc.html` importe `Seal.dc.html` (`<dc-import name="Seal">`). **La maquette ne s'affiche pas tant que `Seal.dc.html` n'est pas présent.**

## Compléter l'import

Le MCP lit fichier par fichier avec un plafond de 256 Kio ; le sceau et les binaires le dépassent. Pour récupérer le design complet fidèlement : **exporter le projet en ZIP depuis Claude Design** (bouton Download/Export) et déposer les fichiers manquants ici. C'est le seul chemin fidèle pour les fichiers qui inline des images.

## Notes de cohérence avec le PRD

- Le design nomme la page de vérification `verify.aidd.community/u/<user>` ; le PRD proposait `certs.ai-driven.dev`. **Domaine à unifier.**
- Le design affiche « Signature cryptographique validée par le serveur AIDD » ; le PRD insiste au contraire sur une vérification **indépendante du serveur** (CT-2, CT-6). Copie marketing à réaligner sur la promesse réelle.
- Le design traite **Habilité** à parité avec Certifié ; le PRD scope Habilité en v2. Cohérent tant que la v1 n'émet que Certifié.
