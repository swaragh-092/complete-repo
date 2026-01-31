# ═══════════════════════════════════════════════════════
# Multi-stage Dockerfile for Centralized Login (Vite + React)
# ═══════════════════════════════════════════════════════

# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_CLIENT_KEY=account-ui
ARG VITE_AUTH_BASE_URL
ARG VITE_ACCOUNT_UI_URL
ARG VITE_REDIRECT_URI

# Set environment variables for build
ENV VITE_CLIENT_KEY=$VITE_CLIENT_KEY
ENV VITE_AUTH_BASE_URL=$VITE_AUTH_BASE_URL
ENV VITE_ACCOUNT_UI_URL=$VITE_ACCOUNT_UI_URL
ENV VITE_REDIRECT_URI=$VITE_REDIRECT_URI

# Build the application
RUN npm run build

# ───────────────────────────────────────────────────────
# Stage 2: Production (nginx)
# ───────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Copy custom nginx config
COPY infrastructure/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
