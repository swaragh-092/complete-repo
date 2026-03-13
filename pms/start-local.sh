#!/bin/bash

# PMS Local Development Startup Script
# This script sets up and runs PMS locally for faster development

set -e  # Exit on any error

echo "🚀 Starting PMS Local Development Setup..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in PMS directory. Please run from /complete-repo/pms/"
    exit 1
fi

# Check if Docker services are running
echo "📦 Checking Docker services..."
if ! docker ps | grep -q "db-pms"; then
    echo "❌ Docker services not running. Starting them..."
    cd ..
    docker compose up -d
    cd pms
    echo "⏳ Waiting for services to be ready..."
    sleep 10
else
    echo "✅ Docker services are running"
fi

# Check if .env exists, if not copy from .env.local
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from .env.local..."
    if [ -f ".env.local" ]; then
        cp .env.local .env
        echo "✅ .env file created"
    else
        echo "❌ Error: .env.local not found!"
        exit 1
    fi
else
    echo "✅ .env file exists"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Display configuration
echo ""
echo "📋 Configuration:"
echo "   - Database: localhost:5411"
echo "   - Keycloak: localhost:8081"
echo "   - Auth Service: localhost:4000"
echo "   - PMS Server: localhost:3015"
echo ""

# Check if port 3015 is already in use
if lsof -Pi :3015 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Warning: Port 3015 is already in use!"
    echo "   Kill the process or change PORT in .env"
    read -p "   Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start the server
echo ""
echo "🎉 Starting PMS server with hot reload..."
echo "   Press Ctrl+C to stop"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm start
