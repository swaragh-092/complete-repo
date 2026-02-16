# setup.ps1 - Automated Setup for SSO Project (Windows PowerShell)
# This script sets up the entire development environment from scratch.

Write-Host "🚀 Starting SSO Project Setup..." -ForegroundColor Cyan
Write-Host "🖥️  Running on Windows (PowerShell)" -ForegroundColor Gray

# ─────────────────────────────────────────────────────────────────────
# 1. Install Global Dependencies
# ─────────────────────────────────────────────────────────────────────
Write-Host "`n📦 Installing global sso-client..." -ForegroundColor Yellow
Push-Location sso-cli-tools
npm install
npm link
Pop-Location

# ─────────────────────────────────────────────────────────────────────
# 2. Check for mkcert
# ─────────────────────────────────────────────────────────────────────
if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
    Write-Host "❌ mkcert is not installed. Please install it first:" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Option 1 (Chocolatey):  choco install mkcert" -ForegroundColor White
    Write-Host "   Option 2 (Scoop):       scoop install mkcert" -ForegroundColor White
    Write-Host "   Option 3 (Manual):      Download from https://github.com/FiloSottile/mkcert/releases" -ForegroundColor White
    Write-Host "                           and add it to your PATH." -ForegroundColor White
    exit 1
}

# ─────────────────────────────────────────────────────────────────────
# 3. Generate SSL Certificates
# ─────────────────────────────────────────────────────────────────────
Write-Host "`n🔒 Generating SSL certificates..." -ForegroundColor Yellow

New-Item -Path certs -ItemType Directory -Force | Out-Null
New-Item -Path gateway\certs -ItemType Directory -Force | Out-Null

mkcert -install
mkcert -cert-file certs\cert.pem -key-file certs\key.pem "local.test" "*.local.test" "localhost" "127.0.0.1" "::1"

# Copy certs to Gateway
Copy-Item certs\cert.pem gateway\certs\cert.pem -Force
Copy-Item certs\key.pem gateway\certs\key.pem -Force

# Copy certs to Keycloak
Copy-Item certs\cert.pem keycloak-setup\cert.pem -Force
Copy-Item certs\key.pem keycloak-setup\key.pem -Force

# ─────────────────────────────────────────────────────────────────────
# 4. Hosts file reminder
# ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "📝 IMPORTANT: Make sure these entries exist in your hosts file:" -ForegroundColor Magenta
Write-Host "   File: C:\Windows\System32\drivers\etc\hosts" -ForegroundColor Gray
Write-Host "   (Open Notepad as Administrator to edit)" -ForegroundColor Gray
Write-Host ""
Write-Host "   127.0.0.1   local.test"
Write-Host "   127.0.0.1   admin.local.test"
Write-Host "   127.0.0.1   account.local.test"
Write-Host "   127.0.0.1   auth.local.test"
Write-Host "   127.0.0.1   keycloak.local.test"
Write-Host ""

# ─────────────────────────────────────────────────────────────────────
# 5. Start Keycloak (and initialize DB)
# ─────────────────────────────────────────────────────────────────────
Write-Host "🔑 Starting Keycloak Stack..." -ForegroundColor Yellow
Push-Location keycloak-setup
docker compose up -d
Pop-Location

Write-Host "⏳ Waiting for Keycloak DB to initialize (10s)..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# ─────────────────────────────────────────────────────────────────────
# 6. Start Main Stack (Auth Service, Gateway, Apps)
# ─────────────────────────────────────────────────────────────────────
Write-Host "`n🐳 Starting Main Application Stack..." -ForegroundColor Yellow
docker compose up -d --build

Write-Host ""
Write-Host "🔄 Running Email Service Migrations..." -ForegroundColor Yellow
docker compose exec -T email-service npx -y sequelize-cli db:migrate

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "------------------------------------------------"
Write-Host "👉 Keycloak:     https://keycloak.local.test:8443 (admin/admin123)"
Write-Host "👉 Admin UI:     https://admin.local.test"
Write-Host "👉 Account UI:   https://account.local.test"
Write-Host "👉 Auth Service: https://auth.local.test"
Write-Host "------------------------------------------------"
Write-Host "💡 To create a new app: sso-client init"
