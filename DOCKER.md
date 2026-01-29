# SSO Stack - Docker Deployment Guide

## Quick Start

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Generate required secrets (run each and paste into .env)
openssl rand -base64 24  # For KC_DB_PASSWORD
openssl rand -base64 24  # For AUTH_DB_PASSWORD
openssl rand -base64 32  # For SESSION_SECRET

# 3. Add your realm exports
cp /path/to/server-realm.json ./keycloak-setup/realm-exports/
cp /path/to/my-project-realm.json ./keycloak-setup/realm-exports/

# 4. Build and start
docker compose build
docker compose up -d

# 5. Verify
docker compose ps
```

## Services & Ports

| Service           | Port | URL                   |
| ----------------- | ---- | --------------------- |
| Keycloak          | 8080 | http://localhost:8080 |
| Auth Service      | 4000 | http://localhost:4000 |
| Auth UI           | 3000 | http://localhost:3000 |
| Centralized Login | 3001 | http://localhost:3001 |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SSO Docker Stack                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  auth-ui    │  │ centralized │  │    keycloak     │  │
│  │   :3000     │  │   -login    │  │     :8080       │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                   │           │
│         └────────┬───────┘                   │           │
│                  │                           │           │
│           ┌──────▼──────┐          ┌─────────▼─────────┐ │
│           │auth-service │          │  postgres-keycloak│ │
│           │   :4000     │          │      :5433        │ │
│           └──────┬──────┘          └───────────────────┘ │
│                  │                                       │
│           ┌──────▼──────┐                               │
│           │postgres-auth│                               │
│           │   :5432     │                               │
│           └─────────────┘                               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f auth-service

# Stop all services
docker compose down

# Stop and remove volumes (DELETES DATA)
docker compose down -v

# Rebuild specific service
docker compose build auth-service
docker compose up -d auth-service

# Check health
docker compose ps
```

## Realm Exports

Place your Keycloak realm exports in:
```
keycloak-setup/realm-exports/
├── server-realm.json      # Admin realm (auth-ui)
└── my-project-realm.json  # User realm (centralized-login)
```

### How to Export a Realm

1. Login to Keycloak Admin Console (http://localhost:8080)
2. Select your realm from the dropdown
3. Go to: Realm Settings → Action → Partial Export
4. Check all options (clients, roles, groups)
5. Click Export and save the JSON file

## Production Checklist

- [ ] Set strong passwords for `KC_DB_PASSWORD`, `AUTH_DB_PASSWORD`, `KC_ADMIN_PASSWORD`
- [ ] Generate secure `SESSION_SECRET` and `FP_SALT`
- [ ] Configure SMTP for email notifications
- [ ] Set `SESSION_COOKIE_SECURE=true` and `REFRESH_COOKIE_SECURE=true`
- [ ] Configure proper `KC_HOSTNAME` and `FRONTEND_URL`
- [ ] Set up TLS certificates for HTTPS
- [ ] Configure backup strategy for database volumes
- [ ] Review and restrict `CORS_FALLBACK_ORIGINS`

## Troubleshooting

### Service won't start
```bash
docker compose logs <service-name>
```

### Database connection issues
```bash
# Check if database is healthy
docker compose exec postgres-auth pg_isready

# Connect to database
docker compose exec postgres-auth psql -U postgres -d authzotion_db
```

### Reset everything
```bash
docker compose down -v
docker compose up -d
```
