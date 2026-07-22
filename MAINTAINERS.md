# Guide des mainteneurs

Ce que fait un mainteneur, étape par étape. Rien d'autre n'est requis au quotidien.

## Valider une inscription

1. Une PR **« Inscription : … »** s'ouvre toute seule (le membre a rempli le formulaire).
2. Ouvrir la PR → lire le **commentaire de modération** : nom, LinkedIn, site, description, **photo**.
3. Vérifier : photo correcte, infos cohérentes, le compte est bien un membre certifié.
4. **Merger** la PR. → le badge est émis et publié automatiquement. Fin.

> Rien n'est public tant que la PR n'est pas mergée. Le merge **est** l'autorisation.

## Traiter un retrait (RGPD)

1. Une PR **« Retrait RGPD : @… »** s'ouvre (le membre a demandé le retrait).
2. **Merger** la PR. → la fiche et la photo sont supprimées, le badge est révoqué. Fin.

> Une preuve déjà téléchargée par le membre apparaîtra **révoquée** à la vérification.

## Faire tourner la clé de signature

À faire rarement (compromission suspectée, rotation périodique).

1. Onglet **Actions** → **« Cérémonie de clé »** → **Run workflow**.
2. Le job se met en pause → **approuver** le déploiement (review Habilité).
3. Une **PR de clé publique** s'ouvre → la **merger**.

> Les anciennes clés publiques restent publiées : les badges déjà émis restent vérifiables.

## Refuser / corriger

- Une PR pas conforme : la **fermer** (ne pas merger). Le membre peut rouvrir une demande.
- Un souci sur la photo/les infos : commenter, fermer, demander une nouvelle inscription.

---

## Setup initial (une seule fois)

À faire au démarrage du dépôt. Détails et checklists :

- **Deux GitHub Apps** (moindre privilège) : `key-writer` (écrit le secret de clé) et
  `intake-bot` (ouvre les PR). Voir les secrets `KEY_WRITER_*` / `INTAKE_BOT_*`.
- **Première clé** : lancer la « Cérémonie de clé » une fois.
- **DNS** : `verify.ai-driven-dev.fr` → le **site (VPS)**. Les **données** restent sur
  `ai-driven-dev.github.io/badges` (Pages, rien à faire).
- **Dépôt public** obligatoire (verrous de confiance, CT-14).
