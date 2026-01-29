# Docker Setup - Centralized Login

Guide for containerizing and deploying the centralized login portal.

## 🐳 Quick Start

### Build Image

```bash
docker build -f infrastructure/Dockerfile -t centralized-login .
```

### Run Container

```bash
docker run -p 5174:80 centralized-login
```

## 📁 Files

| File            | Description                       |
| --------------- | --------------------------------- |
| `Dockerfile`    | Multi-stage build (build + nginx) |
| `.dockerignore` | Excludes node_modules, dist, etc. |
| `nginx.conf`    | Nginx configuration for SPA       |

## 🔧 Build Process

The Dockerfile uses multi-stage build:

1. **Build stage**: 
   - Node.js base image
   - Install dependencies
   - Build Vite production bundle

2. **Production stage**:
   - Nginx alpine image
   - Copy built assets
   - Configure SPA routing

## 🚀 Commands

```bash
# Build image
docker build -f infrastructure/Dockerfile -t centralized-login .

# Run locally
docker run -p 5174:80 centralized-login

# Run in production
docker run -d -p 80:80 centralized-login

# Build with custom API URL
docker build -f infrastructure/Dockerfile \
  --build-arg VITE_AUTH_SERVICE_URL=https://api.example.com \
  -t centralized-login .
```

## 🌐 Environment Variables

Pass build-time variables for production:

```bash
docker build -f infrastructure/Dockerfile \
  --build-arg VITE_AUTH_SERVICE_URL=http://api.example.com \
  --build-arg VITE_KEYCLOAK_URL=http://keycloak.example.com \
  -t centralized-login .
```

## 🔧 Nginx Configuration

The `nginx.conf` provides:
- SPA fallback routing
- Gzip compression
- Static asset caching
- Security headers
