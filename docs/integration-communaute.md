# Afficher l'annuaire sur `ai-driven-dev.fr` (`/communaute`)

Le repo `badges` publie la liste des certifiés en **`directory.json`** sur
`https://ai-driven-dev.github.io/badges/directory.json` (CORS ouvert). Le site principal
n'a qu'à le **lire côté navigateur** et rendre la liste. Pas de reconstruction :
la liste est **toujours à jour** (le fetch a lieu à l'ouverture de la page).

## Forme de `directory.json`

```json
{
  "generatedAt": "2026-07-22T10:00:00Z",
  "count": 2,
  "members": [
    {
      "handle": "ada",
      "name": "Ada Lovelace",
      "role": "certifie",
      "linkedin": "https://linkedin.com/in/ada",
      "photo": "https://ai-driven-dev.github.io/badges/photos/ada.webp",
      "verify": "https://verify.ai-driven-dev.fr/u/ada",
      "website": "https://ada.dev",       // optionnel
      "description": "Développeuse IA"     // optionnel
    }
  ]
}
```

Les membres retirés (RGPD) sont **absents** du flux. Photos servies sur
`ai-driven-dev.github.io/badges/photos/<handle>.webp` (servies par Pages).

## Snippet à déposer (Astro ou n'importe quelle page)

Rendu **côté navigateur**, toujours frais, sans dépendance :

```astro
---
// src/pages/communaute.astro (extrait) — le rendu se fait au runtime, pas au build.
const FEED = 'https://ai-driven-dev.github.io/badges/directory.json';
---
<section>
  <h1>Membres certifiés</h1>
  <ul id="annuaire" data-feed={FEED}>Chargement…</ul>
</section>

<script>
  const list = document.getElementById('annuaire');
  try {
    const { members } = await (await fetch(list.dataset.feed)).json();
    list.innerHTML = members.map((m) => `
      <li>
        <img src="${m.photo}" alt="" width="72" height="72" loading="lazy">
        <a href="${m.verify}"><strong>${m.name}</strong></a>
        ${m.description ? `<p>${m.description}</p>` : ''}
        <a href="${m.linkedin}" rel="noopener">LinkedIn</a>
        ${m.website ? `· <a href="${m.website}" rel="noopener">Site</a>` : ''}
      </li>`).join('');
  } catch {
    list.textContent = 'Annuaire momentanément indisponible.';
  }
</script>
```

- `m.verify` mène à la **page de vérification** du badge (sur Pages).
- Habiller/styliser aux couleurs du site ; ici c'est le minimum fonctionnel.
- Le fetch est côté client → un nouveau certifié apparaît **sans rebuild**.

## Fallback

Si `verify.ai-driven-dev.fr` (Pages) est momentanément indisponible, la page
affiche « indisponible » sans casser le reste du site. La vérification d'un badge,
elle, reste toujours servie par Pages (l'ancre de confiance ne dépend pas du VPS).
