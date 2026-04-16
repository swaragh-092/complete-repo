#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# PostgreSQL restore script — runs from /docker-entrypoint-initdb.d/
# Executed automatically by the postgres image on a FRESH (empty) data volume.
# Restores all application databases and keycloak from backup SQL files.
# ══════════════════════════════════════════════════════════════════════════════
set -e

PSQL="psql -v ON_ERROR_STOP=0 -U ${POSTGRES_USER}"

echo "==> [restore] Starting database restore from backups..."

# ── Restore application databases (pg_dumpall format) ────────────────────────
# CREATE ROLE postgres will fail (role already exists from docker entrypoint).
# That is expected — psql continues past it with ON_ERROR_STOP=0.

echo "==> [restore] Restoring authzotion_db..."
$PSQL -f /backups/auth-init.sql

echo "==> [restore] Restoring pms_v2..."
$PSQL -f /backups/pms-init.sql

echo "==> [restore] Restoring email_service..."
$PSQL -f /backups/email-init.sql

echo "==> [restore] Restoring super_administrator..."
$PSQL -f /backups/sd-init.sql

# ── Create keycloak role and database ────────────────────────────────────────
echo "==> [restore] Setting up keycloak database..."
$PSQL <<-EOSQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${KEYCLOAK_DB_USER}') THEN
      CREATE ROLE "${KEYCLOAK_DB_USER}" WITH LOGIN PASSWORD '${KEYCLOAK_DB_PASSWORD}';
    ELSE
      ALTER ROLE "${KEYCLOAK_DB_USER}" WITH PASSWORD '${KEYCLOAK_DB_PASSWORD}';
    END IF;
  END
  \$\$;

  SELECT 'CREATE DATABASE "${KEYCLOAK_DB_NAME}"'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${KEYCLOAK_DB_NAME}')
  \gexec

  GRANT ALL PRIVILEGES ON DATABASE "${KEYCLOAK_DB_NAME}" TO "${KEYCLOAK_DB_USER}";
EOSQL

echo "==> [restore] Restoring keycloak schema/data..."
psql -v ON_ERROR_STOP=0 -U "${KEYCLOAK_DB_USER}" -d "${KEYCLOAK_DB_NAME}" \
  -f /backups/init-keycloak-db.sql

# ── Reset postgres password ───────────────────────────────────────────────────
# pg_dumpall files contain ALTER ROLE postgres WITH PASSWORD '<production_hash>'
# which would override the password set by POSTGRES_PASSWORD env var.
# Reset it back so the .env value works.
echo "==> [restore] Resetting postgres password..."
psql -U "${POSTGRES_USER}" \
  -c "ALTER USER postgres PASSWORD '${POSTGRES_PASSWORD}';"

echo "==> [restore] All databases restored successfully."
