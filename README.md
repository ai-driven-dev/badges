# aidd-badges

Certification vérifiable des membres de la communauté AI-Driven Development.

Chaque membre certifié reçoit un badge dont l'authenticité est **vérifiable par un tiers de façon indépendante** (Open Badges 3.0), affichable sur LinkedIn et ailleurs. Deux rôles : **Certifié** (niveau 1, v1) et **Habilité** (niveau 2, v2).

## Structure

| Chemin | Contenu |
|---|---|
| `docs/PRD.md` | Spécification produit + contraintes techniques (CT-1 → CT-10) + feuille de route |
| `design/` | Kit de badges importé depuis Claude Design (sceau, LinkedIn, embed, signature, page de vérif) |

## ⚠️ Garde-fous — à lire avant tout commit

Ce dépôt est **privé**, mais un dépôt privé n'est pas un coffre-fort, et Git n'oublie rien.

1. **La clé privée de signature ne DOIT jamais être commitée.** Elle est l'ancre de confiance : sa fuite permet de forger des badges AIDD indétectables (PRD, CT-7). Elle vit sur le VPS, hors dépôt.
2. **Aucune donnée personnelle effaçable (email brut) ne DOIT être commitée.** Git est append-only : `git rm` n'efface pas l'historique. Or le PRD promet la purge de l'email sur demande d'effacement (RGPD). Une donnée effaçable écrite dans Git rend cette promesse intenable. Voir la note d'architecture ci-dessous.

## Note d'architecture — séparer ce qui persiste de ce qui s'efface

Si une base « à plat » sert de source aux badges, elle DOIT être scindée :

- **Données publiques et durables** (nom, identifiant, dates, émetteur) → versionnables dans Git : elles sont publiées par conception et destinées à persister.
- **Données personnelles effaçables** (email ; à trancher pour photo et URL LinkedIn) → **magasin mutable séparé, jamais commité**.

Cette séparation est la condition pour concilier une source versionnée et le droit à l'effacement. Elle reste **à valider** (voir `docs/PRD.md` et les questions ouvertes).

## Statut

Amorçage. Le PRD est la source de vérité ; l'implémentation n'a pas commencé. Stack non tranchée (voir PRD).
