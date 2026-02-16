#!/bin/bash

# setup.sh - Automated Setup for SSO Project
# This script sets up the entire development environment from scratch.
# Compatible with Linux, macOS, and Windows (Git Bash / MINGW / MSYS2).

echo "🚀 Starting SSO Project Setup..."

# ─────────────────────────────────────────────────────────────────────
# Detect OS
# ─────────────────────────────────────────────────────────────────────
OS_TYPE="$(uname -s)"
IS_WINDOWS=false

case "$OS_TYPE" in
    MINGW*|MSYS*|CYGWIN*|Windows_NT)
        IS_WINDOWS=true
        echo "🖥️  Detected Windows (Git Bash / MINGW)"
        ;;
    Linux*)
        echo "🐧 Detected Linux"
        ;;
    Darwin*)
        echo "🍎 Detected macOS"
        ;;
    *)
        echo "⚠️  Unknown OS: $OS_TYPE — proceeding with Linux defaults"
        ;;
esac

# ─────────────────────────────────────────────────────────────────────
# 1. Install Global Dependencies
# ─────────────────────────────────────────────────────────────────────
echo "📦 Installing global sso-client..."
cd sso-cli-tools
npm install

if [ "$IS_WINDOWS" = true ]; then
    # On Windows, 'sudo' is not available; npm link works without it
    npm link
else
    sudo npm link
fi

cd ..

# ─────────────────────────────────────────────────────────────────────
# 2. Check & Auto-Install mkcert
# ─────────────────────────────────────────────────────────────────────
if ! command -v mkcert &> /dev/null; then
    echo "⚠️  mkcert is not installed. Attempting auto-install..."

    if [ "$IS_WINDOWS" = true ]; then
        # Download mkcert for Windows from GitHub Releases
        MKCERT_VERSION="v1.4.4"
        MKCERT_URL="https://github.com/FiloSottile/mkcert/releases/download/${MKCERT_VERSION}/mkcert-${MKCERT_VERSION}-windows-amd64.exe"
        MKCERT_DIR="$HOME/bin"

        echo "📥 Downloading mkcert ${MKCERT_VERSION} for Windows..."
        mkdir -p "$MKCERT_DIR"
        curl -L -o "$MKCERT_DIR/mkcert.exe" "$MKCERT_URL"

        if [ -f "$MKCERT_DIR/mkcert.exe" ]; then
            export PATH="$MKCERT_DIR:$PATH"
            echo "✅ mkcert installed to $MKCERT_DIR/mkcert.exe"
            echo "💡 To make it permanent, add $MKCERT_DIR to your system PATH."
        else
            echo "❌ Auto-install failed. Please install mkcert manually:"
            echo "   Option 1 (Chocolatey):  choco install mkcert"
            echo "   Option 2 (Scoop):       scoop install mkcert"
            echo "   Option 3 (Manual):      Download from https://github.com/FiloSottile/mkcert/releases"
            exit 1
        fi
    else
        # Linux / macOS auto-install
        case "$OS_TYPE" in
            Linux*)
                echo "📥 Installing mkcert on Linux..."
                if command -v apt &> /dev/null; then
                    sudo apt install -y libnss3-tools
                fi
                if command -v brew &> /dev/null; then
                    brew install mkcert
                else
                    # Direct binary download as fallback
                    MKCERT_VERSION="v1.4.4"
                    curl -L -o /usr/local/bin/mkcert "https://github.com/FiloSottile/mkcert/releases/download/${MKCERT_VERSION}/mkcert-${MKCERT_VERSION}-linux-amd64"
                    sudo chmod +x /usr/local/bin/mkcert
                fi
                ;;
            Darwin*)
                echo "📥 Installing mkcert on macOS..."
                if command -v brew &> /dev/null; then
                    brew install mkcert
                else
                    echo "❌ Homebrew not found. Install it from https://brew.sh then run: brew install mkcert"
                    exit 1
                fi
                ;;
        esac

        # Verify install succeeded
        if ! command -v mkcert &> /dev/null; then
            echo "❌ mkcert installation failed. Please install it manually."
            exit 1
        fi
        echo "✅ mkcert installed successfully!"
    fi
fi

# ─────────────────────────────────────────────────────────────────────
# 3. Generate SSL Certificates
# ─────────────────────────────────────────────────────────────────────
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

# ─────────────────────────────────────────────────────────────────────
# 4. Hosts file reminder (Windows)
# ─────────────────────────────────────────────────────────────────────
if [ "$IS_WINDOWS" = true ]; then
    echo ""
    echo "📝 IMPORTANT: Make sure these entries exist in your hosts file:"
    echo "   File: C:\\Windows\\System32\\drivers\\etc\\hosts"
    echo "   (Open Notepad as Administrator to edit)"
    echo ""
    echo "   127.0.0.1   local.test"
    echo "   127.0.0.1   admin.local.test"
    echo "   127.0.0.1   account.local.test"
    echo "   127.0.0.1   auth.local.test"
    echo "   127.0.0.1   keycloak.local.test"
    echo ""
fi

# ─────────────────────────────────────────────────────────────────────
# 5. Start Keycloak (and initialize DB)
# ─────────────────────────────────────────────────────────────────────
echo "🔑 Starting Keycloak Stack..."
cd keycloak-setup
docker compose up -d
cd ..

echo "⏳ Waiting for Keycloak DB to initialize (10s)..."
sleep 10

# ─────────────────────────────────────────────────────────────────────
# 6. Start Main Stack (Auth Service, Gateway, Apps)
# ─────────────────────────────────────────────────────────────────────
echo "🐳 Starting Main Application Stack..."
docker compose up -d --build

echo ""
echo "🔄 Running Email Service Migrations..."
docker compose exec -T email-service npx -y sequelize-cli db:migrate

echo ""
echo "✅ Setup Complete!"
echo "------------------------------------------------"
echo "👉 Keycloak:     https://keycloak.local.test:8443 (admin/admin123)"
echo "👉 Admin UI:     https://admin.local.test"
echo "👉 Account UI:   https://account.local.test"
echo "👉 Auth Service: https://auth.local.test"
echo "------------------------------------------------"
echo "💡 To create a new app: sso-client init"
