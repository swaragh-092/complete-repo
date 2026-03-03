# ═══════════════════════════════════════════════════════
# Multi-stage Dockerfile for Email Service
# ═══════════════════════════════════════════════════════

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

# ───────────────────────────────────────────────────────
# Stage 2: Production
# ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=192"

WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy only production dependencies from stage 1
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source
COPY --chown=nodejs:nodejs . .

# Remove unnecessary files
RUN rm -rf .git .env *.md logs/*.log

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4011

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4011/health || exit 1

# Start
CMD ["node", "src/server.js"]
