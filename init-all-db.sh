#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# Unified PostgreSQL initialisation script
# Runs once when the data volume is empty (docker-entrypoint.sh convention).
# Creates all application databases and the dedicated Keycloak user.
# ══════════════════════════════════════════════════════════════════════════════
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  -- ── Application databases ──────────────────────────────────────────────
  CREATE DATABASE "${AUTH_DB_NAME:-authzotion_db}";
  CREATE DATABASE email_service;
  CREATE DATABASE pms_v2;
  CREATE DATABASE super_administrator;

  -- ── Keycloak: dedicated role + database ────────────────────────────────
  CREATE USER "${KEYCLOAK_DB_USER}" WITH LOGIN PASSWORD '${KEYCLOAK_DB_PASSWORD}';
  CREATE DATABASE "${KEYCLOAK_DB_NAME:-keycloak}" OWNER "${KEYCLOAK_DB_USER}";
  GRANT ALL PRIVILEGES ON DATABASE "${KEYCLOAK_DB_NAME:-keycloak}" TO "${KEYCLOAK_DB_USER}";
EOSQL
