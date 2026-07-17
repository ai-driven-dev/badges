# Revue de cohérence — repo + backlog

Revue de l'ensemble produit (PRD, design, backlog GitHub) sur quatre axes : cohérence, dépendances, fichiers, détail suffisant pour implémenter.

## Verdict

Base saine. Les défauts trouvés ont été corrigés (voir plus bas). Les inconnues lourdes sont correctement isolées dans des spikes.

## Confirmé sain

- **Structure** : 8 Epics + 4 Spikes + 27 stories (types natifs GitHub `Epic`/`Spike`/`Feature`).
- **Parenté** : chaque story rattachée en sub-issue native à son epic (E1→5, E2→5, E3→6, E4→5, E5→3, E7→3).
- **Graphe de dépendances** : aucune référence morte, **aucun cycle**.
- **Couverture PRD** : les **13 contraintes techniques (CT-1…CT-13)** sont toutes ancrées à une story ou un epic. Les critères d'acceptation du PRD (intake, vérif réelle, vérif indépendante, identité, annuaire/modération, cycle de vie) ont chacun leur story.
- **Détail** : fonctionnel dans chaque story (Gherkin + DoD), technique via le pont `Réf PRD: CT-X` vers l'annexe du PRD.

## Défauts trouvés et corrigés

| # | Défaut | Correction |
|---|---|---|
| 1 | 14 dépendances inter-stories écrites en ID interne (« 3.1 ») sans `#`, non résolues | **Dépendances natives GitHub** (`blocked_by`) posées pour toutes les arêtes (43 relations) |
| 2 | Affirmation erronée qu'un champ Dependencies natif existait dans le Project | Vérifié : Projects v2 n'a pas ce champ. Adoption des **dépendances d'issues natives** (REST `issues/{n}/dependencies/blocked_by`), disponibles sur l'org |
| 3 | Schéma d'enregistrement absent du PRD (perdu avec le scaffold retiré) | Section **« Modèle de données »** ajoutée au PRD (champs, valeurs générées au merge, photo LFS) |
| 4 | Design contredit la promesse centrale (« validé par le serveur AIDD » vs vérif indépendante), non tracké | Story créée sous E4 : « Aligner la copie de vérification » |

## Points résiduels (non bloquants)

- **Convention texte + natif** : les corps de stories gardent une ligne « Dépend: … » lisible ; la source de vérité est désormais la dépendance native. Redondance assumée, pas de contradiction.
- **Domaine** (`verify.aidd.community` design vs `certs.ai-driven.dev` PRD) : tranché par le spike SP1 avant toute émission (irréversible).
- **Inconnues techniques** (hébergement, format status list, tooling photo, conformité 1EdTech) : portées par les spikes SP1–SP4, à lever avant de bâtir dessus.

## Méthode

Vérifications faites sur pièces via l'API GitHub : extraction du graphe de dépendances (références + cycles), parenté sub-issues, couverture CT, champs du Project. Pas d'assertion de mémoire.
