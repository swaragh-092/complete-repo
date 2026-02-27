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

EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
