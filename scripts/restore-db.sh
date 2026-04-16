#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# Manual restore script — run against a RUNNING postgres container.
# Use this when the postgres volume already exists (init scripts won't re-run).
#
# Usage:  bash scripts/restore-db.sh
# Run from the repo root: /home/swaragh091/working-projects/full-arch/complete-repo
# ══════════════════════════════════════════════════════════════════════════════
set -e
cd "$(dirname "$0")/.."

# Load DATABASE_PASSWORD from .env for the final password reset
DB_PASS=$(grep '^DATABASE_PASSWORD=' .env | cut -d= -f2 | tr -d '"')
KC_USER=$(grep '^KEYCLOAK_DB_USER=' .env | cut -d= -f2 | tr -d '"')
KC_PASS=$(grep '^KEYCLOAK_DB_PASSWORD=' .env | cut -d= -f2 | tr -d '"')
KC_NAME=$(grep '^KEYCLOAK_DB_NAME=' .env | cut -d= -f2 | tr -d '"')
KC_NAME="${KC_NAME:-keycloak}"

echo "==> Stopping application services (leaving postgres running)..."
docker compose stop auth-service pms-v2 email-service super-administrator auth-ui centralized-login pms-frontend super-administrator 2>/dev/null || true

echo "==> Dropping existing application databases..."
docker exec postgres psql -U postgres <<-SQL
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname IN ('authzotion_db','pms_v2','email_service','super_administrator')
    AND pid <> pg_backend_pid();

  DROP DATABASE IF EXISTS authzotion_db;
  DROP DATABASE IF EXISTS pms_v2;
  DROP DATABASE IF EXISTS email_service;
  DROP DATABASE IF EXISTS super_administrator;
SQL

echo "==> Restoring authzotion_db..."
docker exec -i postgres psql -v ON_ERROR_STOP=0 -U postgres \
  < db-images/postgres-auth/auth-init.sql

echo "==> Restoring pms_v2..."
docker exec -i postgres psql -v ON_ERROR_STOP=0 -U postgres \
  < db-images/db-pms/pms-init.sql

echo "==> Restoring email_service..."
docker exec -i postgres psql -v ON_ERROR_STOP=0 -U postgres \
  < db-images/db-email/init.sql

echo "==> Restoring super_administrator..."
docker exec -i postgres psql -v ON_ERROR_STOP=0 -U postgres \
  < db-images/db-super-admin/sd-init.sql

echo "==> Setting up keycloak user/database..."
docker exec postgres psql -U postgres <<-SQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${KC_USER}') THEN
      CREATE ROLE "${KC_USER}" WITH LOGIN PASSWORD '${KC_PASS}';
    ELSE
      ALTER ROLE "${KC_USER}" WITH PASSWORD '${KC_PASS}';
    END IF;
  END
  \$\$;

  SELECT 'CREATE DATABASE "${KC_NAME}"'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${KC_NAME}')
  \gexec

  GRANT ALL PRIVILEGES ON DATABASE "${KC_NAME}" TO "${KC_USER}";
SQL

echo "==> Restoring keycloak schema/data..."
docker exec -i postgres psql -v ON_ERROR_STOP=0 -U postgres -d "${KC_NAME}" \
  < keycloak-setup/init-keycloak-db.sql

echo "==> Resetting postgres password to match .env..."
docker exec postgres psql -U postgres \
  -c "ALTER USER postgres PASSWORD '${DB_PASS}';"

echo ""
echo "==> Restore complete! Start services with:"
echo "    docker compose up -d"
