# Sert le site de vérification statique (_site) via nginx. L'image est construite
# APRÈS la signature (en CI GitHub-hosted) : _site contient déjà les preuves signées,
# les clés publiques, la status list, l'annuaire et le code de vérif. Aucun secret ici.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY _site/ /usr/share/nginx/html/

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/issuer.json || exit 1

EXPOSE 8080
