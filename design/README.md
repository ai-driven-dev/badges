# Design — Badges AIDD

Source : projet Claude Design **« Badge de certification communauté »**
`https://claude.ai/design/p/1a46ce33-ef04-435c-8a71-76f115cdfc87`

Kit de badges pour deux rôles — **Certifié** (niveau 1) et **Habilité** (niveau 2) — couvrant : sceau, anneau de photo LinkedIn + coin de bannière, badge intégrable web, signature email, et la maquette de la page de vérification.

## Fichiers

| Fichier | Rôle |
|---|---|
| `Badges AIDD.dc.html` | Maquette principale (source Design Canvas) |
| `Seal.dc.html` | Le sceau — cœur visuel, réutilisé partout via `<dc-import name="Seal">` |
| `Badge AIDD - standalone.html` | Bundle autonome (aperçu hors runtime) |
| `support.js` | Runtime Design Canvas requis par les `.dc.html` |
| `image-slot.js` | Composant de dépôt d'image |
| `assets/logo.png`, `uploads/` | Sources graphiques |
| `screenshots/` | Aperçus rendus |

Import complet, récupéré par export ZIP depuis Claude Design (le MCP plafonne la lecture à 256 Kio, dépassé par le sceau et le bundle qui inline des images).

## À réaligner avec le PRD

Le design est une maquette ; ces trois points sont à corriger à l'implémentation, pas dans le PRD :

1. **Domaine.** Le design montre `verify.aidd.community/u/<user>`. À unifier avec le domaine réel retenu.
2. **Promesse de vérification.** Le design affiche « Signature cryptographique validée par le **serveur AIDD** ». Le PRD garantit l'inverse — une vérification **indépendante du serveur** (CT-2, CT-6). Copie à réaligner sur la promesse réelle, sinon le design vend plus faible que le produit.
3. **Habilité.** Traité à parité avec Certifié dans le design ; le PRD le scope en v2. Cohérent tant que la v1 n'émet que Certifié — le design est simplement en avance.

Note : les données affichées (nom, identifiant `AIDD-2K7F-9QX3`, dates) sont des **exemples de maquette**, pas de vraies données.
