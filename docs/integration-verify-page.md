# Belle page de vérif sur `ai-driven-dev.fr` (`/u/<handle>`)

Le badge pointe vers `verify.ai-driven-dev.fr/u/<handle>` (le **site**, VPS). Cette page
récupère la preuve **depuis Pages**, la **vérifie dans le navigateur**, et l'affiche au design.

## Étapes

1. **Copier** deux fichiers de ce dépôt (code de vérif, sans dépendance) dans le site :
   `site/verify.mjs` et `site/bitstring.mjs`.
2. **Créer** la page `src/pages/u/[handle].astro` (ci-dessous).
3. **Habiller** le rendu au design (sceau, couleurs) — ici c'est le squelette fonctionnel.

## `src/pages/u/[handle].astro`

```astro
---
export const prerender = false; // la vérif se fait au runtime, côté client
const { handle } = Astro.params;
const DATA = 'https://ai-driven-dev.github.io/badges'; // les données (Pages)
---
<html lang="fr">
  <head><meta charset="utf-8"><title>Badge — {handle}</title></head>
  <body>
    <main id="app" data-handle={handle} data-data={DATA}>Vérification…</main>

    <script>
      import { verifyBadge, STATE } from '../../lib/verify.mjs'; // copié depuis le dépôt badges
      const app = document.getElementById('app');
      const { handle, data } = app.dataset;
      const proof = `${data}/u/${handle}/credential.jwt`;
      try {
        const jwt = (await (await fetch(proof)).text()).trim();
        const r = await verifyBadge(jwt); // récupère la clé + statut depuis Pages, vérifie
        // TODO habiller au design (sceau, couleurs). Squelette :
        const ok = r.state === STATE.VALID;
        app.innerHTML = `
          <h1>${ok ? 'Badge valide' : 'Badge ' + r.state}</h1>
          <p>Titulaire : @${r.details?.handle ?? handle}</p>
          <p>Émetteur : ${r.details?.issuer ?? '—'}</p>
          <p>Valable jusqu'au : ${r.details?.validUntil ?? '—'}</p>
          <p><a href="${proof}" download>Télécharger la preuve</a> ·
             preuve : <code>${proof}</code></p>`;
      } catch {
        app.textContent = "Preuve introuvable pour ce badge.";
      }
    </script>
  </body>
</html>
```

## Notes

- **La vérif est réelle** : `verifyBadge` récupère la clé publique (via le `kid` du JWT,
  sur Pages), contrôle la signature RS256, l'expiration et la révocation. Aucune confiance
  aveugle envers le site.
- **Badge visuel** : générer le sceau au design ici (nom + dates), à côté du verdict.
- **Fallback** : si Pages est injoignable, la page affiche « introuvable » ; la preuve
  téléchargée reste vérifiable par un outil tiers.
