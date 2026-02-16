#!/bin/sh
# Inyecta la URL del backend en index.html en runtime (data-api-url en #root).
# Así el mismo imagen puede usarse con distintos backends sin recompilar.
# Ejemplo: docker run -e VITE_BACK_URL=https://api.ejemplo.com ...
if [ -n "$VITE_BACK_URL" ]; then
  sed -i "s|__VITE_BACK_URL__|$VITE_BACK_URL|g" /usr/share/nginx/html/index.html
fi
exec nginx -g "daemon off;"
