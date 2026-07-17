# badges

Certification vérifiable des membres de la communauté AI-Driven Development.

Chaque membre certifié reçoit un badge dont l'authenticité est **vérifiable par un tiers de façon indépendante** (Open Badges 3.0), affichable sur LinkedIn et ailleurs. Deux rôles : **Certifié** (niveau 1) et **Habilité** (niveau 2).

## Structure

| Chemin | Contenu |
|---|---|
| `docs/PRD.md` | Spécification produit + contraintes techniques + feuille de route |
| `design/` | Kit de badges (sceau, LinkedIn, embed, signature, page de vérif) importé depuis Claude Design |

## Garde-fous (pour plus tard)

Quand l'implémentation commencera, deux règles ne bougent pas :

1. **La clé privée de signature ne va jamais dans le dépôt** (ni Git, ni LFS) — secret CI uniquement. Sa fuite = badges AIDD forgés indétectables.
2. **Aucune donnée personnelle effaçable dans l'historique Git** — `git rm` n'efface pas le passé.

## Statut

Planification. Le PRD (`docs/PRD.md`) est la base de discussion, pas encore un plan d'implémentation figé. Rien n'est construit.
