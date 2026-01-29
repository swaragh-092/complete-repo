# ═══════════════════════════════════════════════════════
# Multi-stage Dockerfile for Auth Service
# ═══════════════════════════════════════════════════════

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# ───────────────────────────────────────────────────────
# Stage 2: Production
# ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Set environment variables
ENV NODE_ENV=production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source code
COPY --chown=nodejs:nodejs . .

# Remove unnecessary files
RUN rm -rf .git .env *.md *.zip logs/*.log

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start the application
CMD ["node", "server.js"]
