#!/bin/sh
# ============================================================================
# nginx entrypoint hook — runs via /docker-entrypoint.d/40-envsubst-domain.sh
# Substitutes ${BASE_DOMAIN} in all nginx conf and snippet files.
# Only ${BASE_DOMAIN} is replaced; nginx runtime vars ($host, $uri, etc.)
# are left untouched by using the explicit variable list in envsubst.
# ============================================================================
set -e

echo "[40-envsubst-domain] BASE_DOMAIN=${BASE_DOMAIN}"

find /etc/nginx/conf.d /etc/nginx/snippets -name "*.conf" | while IFS= read -r f; do
    envsubst '${BASE_DOMAIN}' < "$f" > "${f}.tmp" && mv "${f}.tmp" "$f"
done

echo "[40-envsubst-domain] Done."
