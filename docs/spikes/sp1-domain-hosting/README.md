# SP1 — Domaine + hébergement

> **⚠️ Superseded — spike historique.** Décrit l'ancien schéma **mono-host**
> (`verify.ai-driven-dev.fr` = Pages). Le système a depuis **splitté en deux hôtes** :
> ancre permanente sur `ai-driven-dev.github.io/badges` (Pages), présentation sur
> `verify.ai-driven-dev.fr` (VPS). **Source à jour : [ARCHITECTURE.md](../../ARCHITECTURE.md)
> + [urls.md](../../urls.md).** Conservé pour la traçabilité, pas comme référence.

**Statut : tranché.** Décision écrite ci-dessous. Débloque E1 (socle/infra) et E4 (vérification).

## Décision

| Sujet | Décision |
|---|---|
| **Domaine de vérification** | **`verify.ai-driven-dev.fr`** — sous-domaine dédié du site communauté (`ai-driven-dev.fr`, déjà contrôlé). |
| **Hébergement** | **GitHub Pages statique** (repo `ai-driven-dev/badges`), build par GitHub Actions. **Pas le VPS.** |
| **Apex** | Intouché — le site principal reste sur le VPS (apex `ai-driven-dev.fr` → 57.129.133.124). Seul le sous-domaine `verify` pointe vers Pages. |

### Pourquoi Pages et pas le VPS

Ce que SP4 a établi : tout ce que la vérification exige sur HTTPS est **statique**, et rien n'a besoin de la clé privée au runtime (elle ne sert qu'au build, au merge, en CI).

- profil issuer, JWK par clé, credential de statut Bitstring, badges, pages de vérif, annuaire, photos → **fichiers statiques**.
- Le statut de révocation est un **fichier régénéré par la CI** à chaque retrait, pas un endpoint vivant.

Le VPS n'ajoute aucune capacité et crée une **dépendance de disponibilité** : s'il tombe, les URLs de clés deviennent injoignables et **tous les badges deviennent invérifiables**. Pages a une meilleure dispo, est gratuit, et calque `manifest` (Astro statique + Actions). La liveness de la vérif repose donc sur Pages, pas sur une machine auto-gérée.

## Structure de chemins (permanente — gravée dans chaque badge)

```
https://verify.ai-driven-dev.fr/issuer.json                     profil issuer (type: Profile)
https://verify.ai-driven-dev.fr/keys/<kid>.json                 1 JWK NU par clé (pas de JWKS array), à vie (CT-7)
https://verify.ai-driven-dev.fr/status/1                        Bitstring Status List credential (révocation, CT-4)
https://verify.ai-driven-dev.fr/achievements/certified-member   définition de l'achievement
https://verify.ai-driven-dev.fr/u/<handle>                      page de vérif publique (design: /u/<user>)
https://verify.ai-driven-dev.fr/u/<handle>/credential.jwt       preuve VC-JWT téléchargeable (CT-6)
```

`issuer.id`, les URLs de `kid`, les ids d'achievement et de statut sont **irréversibles** : les changer invalide tout badge déjà émis. Le domaine doit être **renouvelé indéfiniment**.

## Mise en œuvre (E1)

1. DNS : `CNAME verify.ai-driven-dev.fr → ai-driven-dev.github.io`.
2. GitHub Pages sur le repo, custom domain `verify.ai-driven-dev.fr`, **Enforce HTTPS** activé (fichier `CNAME` dans la publication).
3. Le build (Actions) publie les fichiers statiques ci-dessus ; la signature (clé privée = secret Actions) n'a lieu qu'au merge.

## Résiduel

- **Conformité du statut Bitstring** non testée bout-en-bout (SP4 a couvert la signature, pas la révocation). Même hébergement statique — mais le `BitstringStatusListCredential` servi doit être résoluble et conforme. À valider pendant E3, pas un blocage d'hébergement.
- **Framework du site** (Astro ?) et **rendu annuaire** → SP3.
