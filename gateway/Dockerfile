# ═══════════════════════════════════════════════════════
# Dockerfile for Nginx Gateway
# ═══════════════════════════════════════════════════════
FROM nginx:alpine

WORKDIR /etc/nginx

# Create log directory
RUN mkdir -p /var/log/nginx

# Copy configs
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/
COPY certs/ /etc/nginx/certs/
COPY snippets/ /etc/nginx/snippets/

# Set proper permissions on certs (read-only for safety)
RUN chmod 600 /etc/nginx/certs/*.pem

EXPOSE 80 443

# Health check (use 127.0.0.1 explicitly to force IPv4)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
