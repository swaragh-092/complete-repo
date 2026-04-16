# ═══════════════════════════════════════════════════════
# Dockerfile for Keycloak (Production Build)
# ═══════════════════════════════════════════════════════
FROM quay.io/keycloak/keycloak:26.5.7 AS builder

ENV KC_DB=postgres
RUN /opt/keycloak/bin/kc.sh build

# ───────────────────────────────────────────────────────
# Production stage
# ───────────────────────────────────────────────────────
FROM quay.io/keycloak/keycloak:26.5.7

# Copy the optimised build artefacts from the builder stage
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Keycloak listens on HTTP only; TLS is terminated by the nginx gateway.
EXPOSE 8080

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]
