# Photos des membres (Git LFS)

Les photos vivent ici, routées vers **Git LFS** par `.gitattributes`
(`data/members/photos/** filter=lfs`). Le dépôt ne contient qu'un **pointeur** ;
le binaire est stocké comme objet LFS, hors de l'historique Git principal.

## Pourquoi LFS (CT-12)

L'identité et les champs publics durables (nom, LinkedIn) vivent en Git. La photo,
elle, doit pouvoir être **effacée** sur demande (RGPD). `git rm` ne purge pas le
passé de Git ; supprimer un **objet LFS** retire le binaire sans réécrire l'historique.

## Convention

- Un fichier par membre : `data/members/photos/<handle>.webp`.
- Format normalisé au **WebP**, EXIF retiré (pipeline d'intake, #21 / SP2).

## Effacement (retrait RGPD)

1. Retirer le pointeur du dépôt (`git rm data/members/photos/<handle>.webp`) et le
   champ `photo` de l'enregistrement du membre.
2. Purger l'objet LFS côté GitHub (l'objet n'est plus référencé ; suivre la
   procédure GitHub de suppression d'objets LFS pour l'ôter du stockage).

Le retrait révoque aussi le badge et sort la personne de l'annuaire (voir #36).

## CI

Tout job qui lit les photos doit activer LFS au checkout
(`actions/checkout` avec `lfs: true`). Les runners GitHub incluent `git-lfs`.
