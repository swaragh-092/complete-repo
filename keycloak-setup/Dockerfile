# ═══════════════════════════════════════════════════════
# Dockerfile for Keycloak (Production Build)
# ═══════════════════════════════════════════════════════
FROM quay.io/keycloak/keycloak:latest AS builder

# Build an optimized Keycloak distribution
ENV KC_DB=postgres
RUN /opt/keycloak/bin/kc.sh build

# ───────────────────────────────────────────────────────
# Production Stage
# ───────────────────────────────────────────────────────
FROM quay.io/keycloak/keycloak:latest

# Copy optimized build from builder stage
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# All sensitive config via env vars at runtime — NO hardcoded secrets
# Set these in docker-compose.yml or deployment platform:
#   KC_DB_URL, KC_DB_USERNAME, KC_DB_PASSWORD
#   KEYCLOAK_ADMIN, KEYCLOAK_ADMIN_PASSWORD

EXPOSE 8080 8443

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]
