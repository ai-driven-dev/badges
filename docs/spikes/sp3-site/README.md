# SP3 — Framework site + rendu annuaire

**Statut : levé.** Générateur retenu : **Astro** (aligné sur le repo `manifest`).
La faisabilité de lecture de nos enregistrements membres et du rendu de l'annuaire
est prouvée. Débloque E5 (#33/#34/#35).

## Décision

| Sujet | Décision |
|---|---|
| **Générateur** | **Astro 4** — cohérence avec `manifest`, layouts/composants, bon rendu statique. |
| **Source de données** | Les YAML plats `data/members/*.yml` existants, lus dans le frontmatter Astro (Node au build). Pas de nouveau format. |
| **Annuaire (#33)** | Page `src/pages/index.astro` : liste triée nom + photo + lien vers la fiche. |
| **Fiche → vérif (#34)** | `src/pages/u/[handle].astro` : rend la fiche et la **page de vérification** (charge `./credential.jwt`, réutilise le code de vérif navigateur existant). |
| **Retrait (#35)** | Le membre retiré n'a plus de YAML → il ne paraît plus à la régénération (déterministe). |
| **Sortie machine (#49)** | Publier aussi un `directory.json` pour l'intégration au site principal. |

## Prouvé (sur pièces)

`proof/` : projet Astro minimal qui lit deux `data/members/*.yml` et **rend l'annuaire**.

```
$ npm i && npm run build
▶ src/pages/index.astro → /index.html
[build] 1 page(s) built
$ grep -o '<li>.*</li>' dist/index.html
<li><a href="/u/octomember">Octo Member</a> — @octomember</li>
<li><a href="/u/adalovelace">Ada Lovelace</a> — @adalovelace</li>
```

Astro lit nos YAML plats sans plugin (fs + parse dans le frontmatter) et produit
un HTML statique listant les membres avec liens vers `/u/<handle>`.

## Intégration avec le pipeline de signature (point de-risqué)

Les credentials sont des **artefacts signés en CI** (clé privée, déterministe),
pas du contenu Astro. Ordre du build `emit-and-deploy` révisé pour E5 :

1. **Signer** (node, env `signing`) : credentials, `keys/<kid>.json`, `status/1`,
   `issuer.json` → écrits dans **`site/public/`** (copié verbatim par Astro).
   Les `credential.jwt` déterministes restent stables (certified_on = commit d'ajout).
2. **`astro build`** : rend l'annuaire + les fiches `/u/<handle>` (qui importent le
   code de vérif) et copie `public/` → `dist/`.
3. **Déployer** `dist/` sur Pages.

Le code de vérif navigateur actuel (`site/verify*.mjs`, `bitstring.mjs`) devient
soit un asset Astro, soit reste dans `public/` — inchangé, déjà testé.

## Migration

Le site vanilla actuel (assemblage shell dans `emit-and-deploy`) est remplacé par
un projet Astro sous `site/`. Réversible : les URLs des badges ne dépendent pas du
générateur, seulement du domaine.

## Reproduire

```bash
cd proof && npm i && npm run build
grep -o '<li>.*</li>' dist/index.html
```

## Fichiers

| Chemin | Rôle |
|---|---|
| `proof/src/pages/index.astro` | Annuaire minimal (lecture YAML → liste) |
| `proof/src/lib.mjs` | `loadMembers()` : lit et trie les enregistrements |
| `proof/data/members/*.yml` | Deux membres d'exemple |
