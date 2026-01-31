# SSO CLI Tools - Docker Mode Guide

A complete guide to using the SSO CLI tools for client registration with Docker deployment support.

## 🚀 Overview

The `sso-client` CLI tool enables developers to:
1. Register new SSO-enabled applications
2. Generate React app scaffolding with authentication pre-configured
3. Create Docker deployment files for containerized environments

## ⚙️ Configuration

### Environment Variables

| Variable              | Default      | Description                     |
| --------------------- | ------------ | ------------------------------- |
| `SSO_PROTOCOL`        | `https`      | Protocol for URLs (http/https)  |
| `SSO_DOMAIN`          | `local.test` | Base domain for all services    |
| `SSO_DOCKER_MODE`     | `false`      | Enable portless URLs for Docker |
| `SSO_AUTH_PORT`       | `4000`       | Auth service port               |
| `SSO_ACCOUNT_UI_PORT` | `5174`       | Account UI port                 |

### Config File (sso-client.config.json)

```json
{
  "$schema": "./sso-client.config.schema.json",
  "protocol": "https",
  "domain": "local.test",
  "dockerMode": true,
  "theme": "default",
  "features": {
    "enableIdleTimeout": true,
    "enableCrossTabSync": true,
    "enableDarkMode": true
  },
  "session": {
    "idleTimeoutMs": 1800000,
    "tokenRefreshBuffer": 120
  }
}
```

---

## 🐳 Docker Mode vs Development Mode

When running `sso-client init`, you're asked:
```
? Generate Docker files (Dockerfile, nginx.conf)? (Y/n)
```

This determines how URLs are generated:

| Mode            | Docker? | Example Redirect URL                     |
| --------------- | ------- | ---------------------------------------- |
| **Development** | No      | `https://myapp.local.test:5173/callback` |
| **Docker**      | Yes     | `https://myapp.local.test/callback`      |

### Why Portless URLs for Docker?

In Docker deployments, the Nginx gateway handles port routing:
- All services listen on internal ports (80, 4000, etc.)
- Gateway maps domains to services without exposing ports
- External access is always on port 443 (HTTPS)

```
Browser → https://myapp.local.test (443) → nginx → myapp:80
```

---

## 📦 Commands

### `sso-client init`

Initialize a new SSO-enabled application.

```bash
mkdir my-new-app && cd my-new-app
sso-client init
```

**Prompts:**
| Prompt                | Description                               |
| --------------------- | ----------------------------------------- |
| Application name      | Human-readable name                       |
| Client key            | Unique identifier (lowercase, hyphenated) |
| Development port      | Port for local dev server                 |
| Organization support  | Enable multi-tenant features              |
| Generate Docker files | Create containerization files             |
| Developer email       | For approval notifications                |

**Generated Files:**

| File                       | Purpose                   |
| -------------------------- | ------------------------- |
| `.env`                     | Environment configuration |
| `src/config/authConfig.js` | Auth SDK configuration    |
| `src/pages/Login.jsx`      | Login page component      |
| `src/pages/Callback.jsx`   | OAuth callback handler    |
| `src/pages/Dashboard.jsx`  | Protected dashboard       |
| `src/App.jsx`              | Main app with routing     |
| `vite.config.js`           | Vite configuration        |

**Docker Files (if Docker selected):**

| File                         | Purpose                           |
| ---------------------------- | --------------------------------- |
| `infrastructure/Dockerfile`  | Multi-stage build                 |
| `infrastructure/nginx.conf`  | Container nginx config            |
| `docker-compose.snippet.yml` | Docker Compose service definition |
| `gateway-nginx.snippet.conf` | Gateway routing rules             |

---

### `sso-client status [clientKey]`

Check registration request status.

```bash
sso-client status my-app
```

**Output:**
```
📊 Client Status

   Client Key: my-app
   Status: approved ✅
   Requested: 2026-01-29T12:00:00Z
   Approved: 2026-01-29T12:30:00Z
```

---

### `sso-client link-ui [clientKey]`

Verify client is approved and ready for use.

```bash
sso-client link-ui my-app
```

---

### `sso-client generate-ui [clientKey]`

Regenerate UI files from templates (useful after approval).

```bash
sso-client generate-ui my-app
```

---

### `sso-client config-port [port]`

Update development port in configuration.

```bash
sso-client config-port 5180
```

---

## 🔄 Complete Workflow

### Development Mode

```bash
# 1. Create app
mkdir my-app && cd my-app
npm create vite@latest . -- --template react
npm install

# 2. Initialize SSO
sso-client init
# → Select Docker: No
# → Port: 5173

# 3. Wait for approval (check email)
sso-client status my-app

# 4. Add to hosts file
echo "127.0.0.1 my-app.local.test" | sudo tee -a /etc/hosts

# 5. Install dependencies and run
npm install @spidy092/auth-client react-router-dom @mui/material
npm run dev
```

### Docker Mode

```bash
# 1. Create app
mkdir my-app && cd my-app
npm create vite@latest . -- --template react
npm install

# 2. Initialize SSO with Docker
sso-client init
# → Select Docker: Yes

# 3. Wait for approval
sso-client status my-app

# 4. Copy Docker files to main project
# Add docker-compose.snippet.yml content to main docker-compose.yml
# Add gateway-nginx.snippet.conf content to gateway/nginx.conf

# 5. Add to hosts
echo "127.0.0.1 my-app.local.test" | sudo tee -a /etc/hosts

# 6. Build and run
docker-compose up --build my-app
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Nginx Gateway (:443)                    │
│  ┌──────────────┬──────────────┬──────────────┬───────────┐ │
│  │ auth.local.  │ admin.local. │ account.     │ myapp.    │ │
│  │    test      │    test      │ local.test   │ local.test│ │
│  └──────┬───────┴──────┬───────┴──────┬───────┴─────┬─────┘ │
└─────────┼──────────────┼──────────────┼─────────────┼───────┘
          ▼              ▼              ▼             ▼
    ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐
    │auth-service│  │ auth-ui  │  │centralized│  │ my-app  │
    │   :4000    │  │   :80    │  │  -login   │  │  :80    │
    └─────┬─────┘  └───────────┘  │   :80     │  └─────────┘
          │                       └───────────┘
          ▼
    ┌───────────┐
    │ Keycloak  │
    │   :8080   │
    └─────┬─────┘
          │
          ▼
    ┌───────────┐
    │PostgreSQL │
    │   :5432   │
    └───────────┘
```

---

## 📁 Generated Project Structure

```
my-app/
├── .env                              # Environment config
├── sso-client.config.json            # Theme/feature config
├── vite.config.js                    # Vite setup
├── package.json
│
├── src/
│   ├── main.jsx                      # Entry point
│   ├── App.jsx                       # Routes & providers
│   ├── config/
│   │   └── authConfig.js             # Auth SDK config
│   ├── pages/
│   │   ├── Login.jsx                 # Login page
│   │   ├── Callback.jsx              # OAuth callback
│   │   ├── Dashboard.jsx             # Protected page
│   │   ├── SelectOrganization.jsx    # Org selection (if enabled)
│   │   └── CreateOrganization.jsx    # Org creation (if enabled)
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Layout.jsx
│   │   └── ProtectedLayout.jsx
│   └── context/
│       └── OrganizationContext.jsx   # (if org enabled)
│
└── infrastructure/                   # (Docker mode only)
    ├── Dockerfile
    └── nginx.conf
```

---

## 🔐 Organization Support

When organization support is enabled, additional features are generated:

| Feature                | Description                            |
| ---------------------- | -------------------------------------- |
| Organization Selection | Users choose/create org on first login |
| Workspace Support      | Projects/teams within organizations    |
| Role Management        | Assign roles to org members            |
| Invite Members         | Email-based invitation system          |

### Organization Models

| Model    | Description                       |
| -------- | --------------------------------- |
| `single` | User belongs to one org at a time |
| `multi`  | User can belong to multiple orgs  |

### Onboarding Flows

| Flow              | Description                     |
| ----------------- | ------------------------------- |
| `create_org`      | User creates new org on signup  |
| `invitation_only` | User must be invited            |
| `domain_matching` | Auto-join based on email domain |
| `flexible`        | User can create or join         |

---

## 🎨 Themes

Available themes in `sso-client.config.json`:

| Theme       | Primary Color | Description       |
| ----------- | ------------- | ----------------- |
| `default`   | `#6366f1`     | Indigo gradient   |
| `corporate` | `#1e40af`     | Professional blue |
| `modern`    | `#059669`     | Fresh green       |
| `sunset`    | `#ea580c`     | Warm orange       |
| `midnight`  | `#7c3aed`     | Deep purple       |

---

## 🐛 Troubleshooting

### "Not found: Not Found" Error

**Cause:** Auth service not running or wrong URL.

**Fix:**
```bash
# Check if auth-service is running
curl http://auth.local.test:4000/health

# Start services
cd /path/to/sso-project
docker-compose up -d
```

### SSL Negotiation Failed

**Cause:** HTTPS configured but service running on HTTP.

**Fix:** The CLI automatically retries with HTTP. If persistent:
```bash
# Check service protocol
curl -I https://auth.local.test:4000
curl -I http://auth.local.test:4000
```

### URLs Have Ports in Docker Mode

**Cause:** Docker mode not properly set.

**Fix:** Ensure `generateDocker: true` is selected during init. Re-run:
```bash
rm -rf node_modules .env src/
sso-client init  # Select Docker: Yes
```
