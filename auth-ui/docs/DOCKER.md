# Docker Setup - Auth UI

Guide for containerizing and deploying auth-ui.

## 🐳 Quick Start

### Build Image

```bash
docker build -f infrastructure/Dockerfile -t auth-ui .
```

### Run Container

```bash
docker run -p 5173:80 auth-ui
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

## 📝 Dockerfile Overview

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## 🔧 Nginx Configuration

The `nginx.conf` handles:
- SPA routing (fallback to index.html)
- Gzip compression
- Cache headers for static assets

## 🚀 Commands

```bash
# Build image
docker build -f infrastructure/Dockerfile -t auth-ui .

# Run in development
docker run -p 5173:80 auth-ui

# Run in production
docker run -d -p 80:80 auth-ui

# Build with custom API URL
docker build -f infrastructure/Dockerfile --build-arg VITE_AUTH_SERVICE_URL=https://api.example.com -t auth-ui .
```

## 🌐 Environment Variables

Pass build-time variables:

```bash
docker build -f infrastructure/Dockerfile \
  --build-arg VITE_AUTH_SERVICE_URL=http://api.example.com \
  --build-arg VITE_KEYCLOAK_URL=http://keycloak.example.com \
  -t auth-ui .
```
