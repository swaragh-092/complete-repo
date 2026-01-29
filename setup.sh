#!/bin/bash

# setup.sh - Automated Setup for SSO Project
# This script sets up the entire development environment from scratch.

echo "🚀 Starting SSO Project Setup..."

# 1. Install Global Dependencies
echo "📦 Installing global sso-client..."
cd sso-cli-tools
npm install
sudo npm link
cd ..

# 2. Check for mkcert
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert is not installed. Please install it first:"
    echo "   Linux: sudo apt install libnss3-tools && brew install mkcert (or download binary)"
    exit 1
fi

# 3. Generate Certificates
echo "🔒 Generating SSL certificates..."
mkdir -p certs
mkdir -p gateway/certs
mkcert -install
mkcert -cert-file certs/cert.pem -key-file certs/key.pem "local.test" "*.local.test" "localhost" "127.0.0.1" "::1"

# Copy certs to Gateway
cp certs/cert.pem gateway/certs/cert.pem
cp certs/key.pem gateway/certs/key.pem

# Copy certs to Keycloak
cp certs/cert.pem keycloak-setup/cert.pem
cp certs/key.pem keycloak-setup/key.pem

# 4. Start Keycloak (and initialize DB)
echo "🔑 Starting Keycloak Stack..."
cd keycloak-setup
# We remove the volume for fresh init if requested, but for now we assume fresh clone
docker compose up -d
cd ..

echo "⏳ Waiting for Keycloak DB to initialize (10s)..."
sleep 10

# 5. Start Main Stack (Auth Service, Gateway, Apps)
echo "🐳 Starting Main Application Stack..."
docker compose up -d --build

echo "✅ Setup Complete!"
echo "------------------------------------------------"
echo "👉 Keycloak:     https://keycloak.local.test:8443 (admin/admin123)"
echo "👉 Admin UI:     https://admin.local.test"
echo "👉 Account UI:   https://account.local.test"
echo "👉 Auth Service: https://auth.local.test"
echo "------------------------------------------------"
echo "💡 To create a new app: sso-client init"
