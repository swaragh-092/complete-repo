#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# HTTPS Setup Script for Keycloak Session Fix
# ═══════════════════════════════════════════════════════════════════════════════
# This script sets up HTTPS certificates using mkcert to fix the
# Keycloak session cookie issue caused by browser SameSite policies.
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "  HTTPS Setup Script for Keycloak"
echo "═══════════════════════════════════════════════════════════════════════════════"

# Step 1: Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo ""
    echo "📦 Installing mkcert..."
    echo ""
    
    # Install dependencies
    sudo apt install -y libnss3-tools
    
    # Download mkcert
    curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
    chmod +x mkcert-v*-linux-amd64
    sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
    
    echo "✅ mkcert installed"
else
    echo "✅ mkcert already installed"
fi

# Step 2: Install root CA
echo ""
echo "📜 Installing root CA (makes certificates trusted by browser)..."
mkcert -install
echo "✅ Root CA installed"

# Step 3: Create certificates
echo ""
echo "🔐 Creating TLS certificates for local domains..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

mkcert -key-file key.pem -cert-file cert.pem \
  "*.local.test" \
  "local.test" \
  "keycloak.local.test" \
  "auth.local.test" \
  "account.local.test" \
  "admin.local.test" \
  "pms.local.test" \
  "localhost" \
  "127.0.0.1"

echo "✅ Certificates created:"
echo "   - cert.pem (certificate)"
echo "   - key.pem (private key)"

# Step 4: Set permissions
chmod 644 cert.pem
chmod 600 key.pem

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "  ✅ HTTPS Setup Complete!"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "1. Restart Keycloak:"
echo "   docker-compose down && docker-compose up -d"
echo ""
echo "2. Update auth-service .env:"
echo "   KEYCLOAK_URL=https://keycloak.local.test:8443"
echo "   SESSION_COOKIE_SECURE=true"
echo "   SESSION_COOKIE_SAMESITE=none"
echo ""
echo "3. Update Keycloak client redirect URIs to use HTTPS"
echo ""
echo "4. Access Keycloak at: https://keycloak.local.test:8443"
echo ""
