#!/usr/bin/env bash
# Construit le site statique complet dans _site/ : émet les credentials signés,
# la Bitstring Status List, le flux annuaire, puis assemble tout (clés, preuves,
# pages de vérif, code navigateur, photos). Partagé par les workflows Pages et VPS.
#
# Requiert : SIGNING_PRIVATE_KEY (env), un dépôt checkout avec historique + LFS,
# et les deps des scripts installées (.github/scripts). Ne fabrique PAS le CNAME
# (spécifique à Pages) : le workflow appelant l'ajoute si besoin.
set -euo pipefail
shopt -s nullglob

echo "== Émission des credentials (déterministe) =="
count=0
for d in data/members/*/; do
  f="${d}record.yml"
  [ -f "$f" ] || continue
  certified_on="$(git log --diff-filter=A --format=%aI -- "$f" | tail -1)"
  if [ -z "$certified_on" ]; then
    echo "::warning::pas de commit d'ajout pour $f, ignoré"; continue
  fi
  CERTIFIED_ON="$certified_on" node .github/scripts/sign-credential.mjs "$f"
  handle="$(basename "$d")"
  cp site/badge-page.html "u/$handle/index.html"
  count=$((count + 1))
done
echo "émis: $count credential(s)"

echo "== Bitstring Status List =="
STATUS_ISSUED_ON="$(git show -s --format=%aI HEAD)" node .github/scripts/sign-status-list.mjs

echo "== Flux annuaire =="
DIRECTORY_GENERATED_AT="$(git show -s --format=%aI HEAD)" node .github/scripts/build-directory.mjs

echo "== Assemblage de _site =="
mkdir -p _site/keys _site/u _site/status _site/photos
cp public/issuer.json _site/issuer.json
cp site/verify.mjs site/verify-page.mjs site/bitstring.mjs _site/
cp site/verify.html _site/index.html
cp directory.json _site/directory.json
if [ -d keys ]; then cp keys/*.json _site/keys/ 2>/dev/null || true; fi
if [ -d u ]; then cp -r u/* _site/u/ 2>/dev/null || true; fi
for p in data/members/*/photo.webp; do
  [ -f "$p" ] || continue
  h="$(basename "$(dirname "$p")")"; cp "$p" "_site/photos/$h.webp"
done
if [ -f status/1 ]; then cp status/1 _site/status/1; fi
echo "== _site prêt =="
