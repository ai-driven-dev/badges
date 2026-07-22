# Déploiement sur le VPS (au lieu de GitHub Pages)

Aujourd'hui la vérif est servie par **GitHub Pages** (`emit-and-deploy.yml`). Cette
note décrit comment basculer sur le **VPS**, en calquant `ai-driven-dev.fr`.

## Principe (sécurité)

La **signature reste en cloud GitHub** : le job `build-and-push` tourne sur un runner
GitHub-hosted, dans l'environnement `signing`. La clé privée **ne touche jamais le VPS**.
Seule l'**image nginx** (sortie publique : `_site` signé) est poussée sur GHCR, puis le
runner self-hosted fait `docker compose pull && up`. GitHub n'est jamais sollicité par un
visiteur.

```
GitHub (build + signe) → image GHCR → VPS (docker compose) → verify.ai-driven-dev.fr
```

## Ce que le workflow fait déjà

`deploy-vps.yml` (gaté `workflow_dispatch`) :
1. build + signe `_site`, construit l'image (Dockerfile nginx), pousse sur `ghcr.io/ai-driven-dev/badges` ;
2. sur le runner `[self-hosted, aidd-central]` : `docker compose pull && up`, healthcheck, smoke test.

L'image sert sur le port **8080** ; `docker-compose.yml` le publie sur `${PORT:-8092}`.

## Étapes côté VPS (à faire une fois)

1. **Placer `docker-compose.yml`** du repo dans un dossier de déploiement, ex.
   `/opt/infrastructure/services/aidd-badges/` (= la variable `DEPLOY_PATH`).
2. **Reverse proxy** : router `verify.ai-driven-dev.fr` → `http://127.0.0.1:<PORT>`
   (le port publié par le compose), avec TLS. Même mécanisme que pour le site principal.
3. **DNS** : `verify.ai-driven-dev.fr` → l'IP du VPS.
4. **Variables du repo** (Settings → Actions → Variables) si les défauts ne conviennent
   pas : `DEPLOY_PATH`, `PORT`.
5. **Environnement `production-vps`** : créer l'environnement (protections au choix).

## Basculer Pages → VPS

Une fois le VPS servi et le DNS en place :
1. Dans `deploy-vps.yml`, ajouter le trigger `push` (branche `main`, mêmes `paths` que
   `emit-and-deploy.yml`) en plus de `workflow_dispatch`.
2. Désactiver / supprimer `emit-and-deploy.yml` (Pages) et retirer le fichier `CNAME`.
3. Repointer le DNS de `verify.*` de Pages vers le VPS.

Réversible : les badges référencent le **domaine**, pas l'hébergeur. Repasser sur Pages =
réactiver `emit-and-deploy.yml` et repointer le DNS.

## Tester l'image en local

```bash
# produire un _site de démo puis builder/lancer l'image
node .github/scripts/demo.mjs   # écrit .demo-site (Ctrl+C après "servie")
cp -r .demo-site _site
docker build -t badges-verify .
docker run --rm -p 8092:8080 badges-verify
# -> http://localhost:8092/issuer.json, /u/demo, etc.
```
