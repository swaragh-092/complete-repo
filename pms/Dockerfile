# ═══════════════════════════════════════════════════════
# Multi-stage Dockerfile for PMS
# ═══════════════════════════════════════════════════════

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

# Install dependencies
# RUN npm ci --only=production && npm cache clean --force
RUN npm install

# Copy application code
COPY --chown=node:node . .

# Remove unnecessary files
RUN rm -rf .git .env *.md logs/*.log

# Switch to non-root user
USER node

# Expose port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3010/health || exit 1

# Run the application
CMD ["node", "server.js"]