# ═══════════════════════════════════════════════════════
# Dockerfile for Keycloak (Production Build)
# ═══════════════════════════════════════════════════════
# Build stage: run `kc.sh build` to create an augmented, optimised
# distribution. This bakes in provider metadata so the production
# container starts with `start --optimized` (faster startup, smaller RAM).
FROM quay.io/keycloak/keycloak:26.5.7 AS builder

ENV KC_DB=postgres
RUN /opt/keycloak/bin/kc.sh build

# ───────────────────────────────────────────────────────
# Production stage
# ───────────────────────────────────────────────────────
FROM quay.io/keycloak/keycloak:26.5.7

# Copy the optimised build artefacts from the builder stage
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# All runtime config is supplied via environment variables — no secrets baked in.
# Required at runtime (set in docker-compose.yml or deployment platform):
#   KC_DB_URL, KC_DB_USERNAME, KC_DB_PASSWORD
#   KEYCLOAK_ADMIN, KEYCLOAK_ADMIN_PASSWORD
#   KC_HOSTNAME

# Keycloak listens on HTTP only; TLS is terminated by the nginx gateway.
EXPOSE 8080

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]
