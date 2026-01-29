# Docker Setup - Auth Service

Guide for running auth-service in Docker containers.

## 🐳 Quick Start

### Build Image

```bash
docker build -f infrastructure/Dockerfile -t auth-service .
```

### Run with Docker Compose

```bash
docker-compose up -d
```

## 📁 Files

| File                  | Description                                 |
| --------------------- | ------------------------------------------- |
| `Dockerfile`          | Multi-stage build for production            |
| `docker-compose.yml`  | Full stack with PostgreSQL, Redis, Keycloak |
| `.dockerignore`       | Files excluded from Docker context          |
| `.env.docker.example` | Environment template for Docker             |

## 🔧 Configuration

### Environment Variables

Copy `.env.docker.example` to `.env` and configure:

```bash
cp infrastructure/.env.docker.example .env
```

Key variables:

| Variable       | Docker Value           | Description                        |
| -------------- | ---------------------- | ---------------------------------- |
| `DB_HOST`      | `postgres`             | Database hostname (container name) |
| `KEYCLOAK_URL` | `http://keycloak:8080` | Keycloak URL                       |
| `REDIS_HOST`   | `redis`                | Redis hostname                     |

### Docker Compose Services

```yaml
services:
  auth-service:    # Main API (port 4000)
  postgres:        # Database (port 5432)
  redis:           # Session store (port 6379)
  keycloak:        # Identity provider (port 8080)
```

## 🚀 Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f auth-service

# Stop all services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Run migrations inside container
docker-compose exec auth-service npm run db:migrate
```

## 🏗️ Production Build

The Dockerfile uses multi-stage build:

1. **Builder stage**: Installs all dependencies
2. **Production stage**: Copies only production deps

```dockerfile
# Build for production
docker build -f infrastructure/Dockerfile -t auth-service:prod --target production .
```

## 🔐 Security Notes

- Never commit `.env` files
- Use Docker secrets for sensitive data in production
- Configure proper network isolation
