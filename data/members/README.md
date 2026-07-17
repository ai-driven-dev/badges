# Registre des membres certifiés

Un fichier YAML par membre, nommé d'après son **handle GitHub** : `<handle>.yml`.

Ces fichiers sont écrits par le bot depuis une demande (Issue Form), puis relus
et mergés par un mainteneur. Le merge déclenche l'émission du badge signé.

## Schéma

```yaml
github: ton-handle            # requis — identité du badge (PRD CT-3), = auteur de l'issue
role: certifie                # requis — certifie | habilite
name: Prénom Nom              # requis — nom public
linkedin: https://...         # optionnel — URL de profil
photo: data/members/photos/ton-handle.webp   # optionnel — chemin LFS (WebP, sans EXIF)
```

Les données ci-dessus sont **publiques et durables** (base légale : exécution du
contrat) et vivent dans Git. Aucune donnée effaçable (email) n'est stockée ici.

## Dates et identifiant de badge

`certified_on`, `expires_on` (échéance = +1 an) et l'identifiant de badge **ne
sont pas** dans ce fichier : ils sont générés au **merge**, par le job de
signature, à partir de la date de merge. Cela évite qu'un demandeur ne fixe
lui-même sa date de validité.

## Photos

Le binaire n'est jamais dans ce YAML — seulement un **chemin** vers un objet
**Git LFS** sous `photos/`. Effacement RGPD = suppression de l'objet LFS (PRD
CT-12), sans réécriture de l'historique.
