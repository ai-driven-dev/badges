# Setup — deux GitHub Apps

Deux Apps distinctes, principe de moindre privilège (brainstorm E1). **Toi** les crées (tu gardes les clés privées) ; l'agent ne voit jamais les clés.

Chemin commun : org `ai-driven-dev` → **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**.

Pour chaque App :
- **Webhook** : décocher **Active** (aucun webhook nécessaire).
- **Where can this GitHub App be installed?** : *Only on this account*.
- Après création : **Generate a private key** (télécharge un `.pem` — tu le gardes), noter l'**App ID**, puis **Install App** sur le seul repo `badges`.
- Ranger App ID + contenu du `.pem` en **secrets Actions** du repo (Settings → Secrets and variables → Actions). L'agent te dira quand s'en servir, sans jamais lire la clé.

---

## App 1 — Secret-writer (#40)

Écrit la clé privée de signature dans le secret de l'environnement protégé. C'est le seul détenteur de ce pouvoir.

| Champ | Valeur |
|---|---|
| **GitHub App name** | `aidd-badges-key-writer` (doit être unique globalement — ajuste si pris) |
| **Homepage URL** | `https://github.com/ai-driven-dev/badges` |
| **Webhook Active** | décoché |
| **Repository permissions** | **Secrets** : Read and write · **Environments** : Read and write |
| Autres permissions | aucune |
| **Install on** | repo `badges` uniquement |

Secrets à ranger :
- `KEY_WRITER_APP_ID` = l'App ID
- `KEY_WRITER_APP_PRIVATE_KEY` = contenu intégral du `.pem`

---

## App 2 — Bot d'intake (#15)

Ouvre les pull requests d'enregistrement sous une identité qui déclenche les checks (le `GITHUB_TOKEN` par défaut ne les déclenche pas). Calque `manifest`. **Ne porte jamais Secrets:write.**

| Champ | Valeur |
|---|---|
| **GitHub App name** | `aidd-badges-intake-bot` (unique — ajuste si pris) |
| **Homepage URL** | `https://github.com/ai-driven-dev/badges` |
| **Webhook Active** | décoché |
| **Repository permissions** | **Contents** : Read and write · **Pull requests** : Read and write · **Issues** : Read and write |
| Autres permissions | aucune |
| **Install on** | repo `badges` uniquement |

Secrets à ranger :
- `INTAKE_BOT_APP_ID` = l'App ID
- `INTAKE_BOT_APP_PRIVATE_KEY` = contenu intégral du `.pem`

---

## Vérification (côté agent, une fois les secrets posés)

L'agent confirmera sans lire les clés :
- `gh secret list -R ai-driven-dev/badges` montre les 4 secrets.
- Chaque App apparaît installée : `gh api repos/ai-driven-dev/badges/installation` (secret-writer et intake).

## Sécurité

- Les `.pem` ne vont **jamais** dans le dépôt (CT-13) — uniquement en secret Actions.
- Si un `.pem` fuite : révoquer la clé dans les réglages de l'App, en générer une nouvelle, mettre à jour le secret.
