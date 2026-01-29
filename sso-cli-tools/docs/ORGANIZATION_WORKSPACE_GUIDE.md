# SSO CLI Tools Documentation

> Complete Guide to Organization & Workspace Integration

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Installation](#2-installation)
3. [Commands Reference](#3-commands-reference)
4. [Organization Models](#4-organization-models)
5. [Workspace Integration](#5-workspace-integration)
6. [Generated Files Reference](#6-generated-files-reference)
7. [Configuration](#7-configuration)
8. [User Flows](#8-user-flows)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Introduction

The SSO CLI Tools (`sso-client`) is a command-line interface for integrating client applications with the centralized SSO authentication system. It handles:

- **Client Registration** - Auto-register new applications
- **UI Code Generation** - Generate React components for auth flows
- **Multi-Organization Support** - Single-org and multi-org models
- **Workspace Management** - Generate workspace components
- **Theme Configuration** - Customizable themes with gradients

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SSO CLI Tools                            │
├─────────────────┬─────────────────┬────────────────────────┤
│   sso-client    │    Templates    │    Auth Service API    │
│   (CLI Binary)  │    (22 files)   │    (Registration)      │
└────────┬────────┴────────┬────────┴───────────┬────────────┘
         │                 │                    │
         ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Generated Client Application                   │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│   Pages     │  Components │   Context   │   API Helpers    │
│  (7 files)  │  (6 files)  │  (1 file)   │   (2 files)      │
└─────────────┴─────────────┴─────────────┴──────────────────┘
```

---

## 2. Installation

### From npm (Global)

```bash
npm install -g @spidy092/sso-client-cli
```

### From Source

```bash
git clone <repository-url>
cd sso-cli-tools
npm install
npm link
```

### Verify Installation

```bash
sso-client --version
# Output: 1.0.0
```

---

## 3. Commands Reference

### 3.1 `sso-client init`

Initialize a new SSO-integrated application.

```bash
sso-client init
```

**Interactive Prompts:**

| Prompt                 | Description          | Example           |
| ---------------------- | -------------------- | ----------------- |
| Application name       | Display name         | `My App`          |
| Client key             | Unique identifier    | `my-app`          |
| Development port       | Local dev port       | `7898`            |
| Description            | Brief description    | `My application`  |
| Organization required? | Yes/No               | `Yes`             |
| Organization model     | Single/Multiple      | `single`          |
| Organization features  | Checkboxes           | `user_management` |
| Onboarding flow        | Flexible/Create/Join | `flexible`        |
| Email                  | For notifications    | `dev@example.com` |
| Name                   | Developer name       | `John Doe`        |

**Generated Files:**

```
project/
├── .env                          # Environment variables
├── sso-client.config.json        # Full configuration
├── sso-client.config.schema.json # JSON schema
├── vite.config.js                # Vite with HTTPS
└── src/
    ├── config/authConfig.js      # Auth client config
    └── pages/
        ├── Login.jsx             # Login page
        └── Callback.jsx          # OAuth callback
```

---

### 3.2 `sso-client generate-ui`

Generate or regenerate UI components from database configuration.

```bash
sso-client generate-ui [clientKey]
```

**Standard Files Generated:**

| File                                 | Purpose                |
| ------------------------------------ | ---------------------- |
| `src/pages/Login.jsx`                | SSO login page         |
| `src/pages/Callback.jsx`             | OAuth callback handler |
| `src/pages/Dashboard.jsx`            | Main dashboard         |
| `src/components/Header.jsx`          | App header             |
| `src/components/Layout.jsx`          | App layout with drawer |
| `src/components/ProtectedLayout.jsx` | Auth wrapper           |

**Organization Files (when enabled):**

| File                                                   | Purpose                  |
| ------------------------------------------------------ | ------------------------ |
| `src/api/organizations.js`                             | Organization API helpers |
| `src/context/OrganizationContext.jsx`                  | Org state management     |
| `src/pages/SelectOrganization.jsx`                     | Multi-org selector       |
| `src/pages/CreateOrganization.jsx`                     | New org form             |
| `src/pages/OrganizationOnboarding.jsx`                 | Create/Join wizard       |
| `src/pages/InviteMembers.jsx`                          | Team invitations         |
| `src/components/organization/OrganizationSwitcher.jsx` | Org dropdown             |
| `src/components/organization/OrganizationManager.jsx`  | Org settings             |

**Workspace Files (when enabled):**

| File                                                     | Purpose               |
| -------------------------------------------------------- | --------------------- |
| `src/api/workspaces.js`                                  | Workspace API helpers |
| `src/components/organization/OrganizationWorkspaces.jsx` | Workspace list        |

---

### 3.3 `sso-client link-ui`

Verify client approval status.

```bash
sso-client link-ui [clientKey]
```

---

### 3.4 `sso-client status`

Check current configuration and connection status.

```bash
sso-client status
```

---

## 4. Organization Models

### 4.1 Single Organization Model

Users belong to **one organization at a time**.

```
User ──────────► Organization ──────────► Workspace 1
                      │
                      └──────────────────► Workspace 2
```

**Use Cases:**
- SaaS products with isolated tenants
- Enterprise applications
- Internal tools

**Behavior:**
- No organization switcher in UI
- Direct redirect to dashboard after login
- Organization context pre-loaded

---

### 4.2 Multiple Organization Model

Users can belong to **multiple organizations**.

```
           ┌──► Organization A ──► Workspace 1
           │                   └─► Workspace 2
User ──────┤
           │                   ┌─► Workspace 3
           └──► Organization B ─┘
```

**Use Cases:**
- Agencies managing multiple clients
- Consultants across companies
- Multi-tenant platforms

**Behavior:**
- Organization switcher in header
- SelectOrganization page after login
- Context switching between organizations

---

### 4.3 Onboarding Flows

| Flow            | Description               | Page Generated               |
| --------------- | ------------------------- | ---------------------------- |
| **Flexible**    | User can create OR join   | `OrganizationOnboarding.jsx` |
| **Create Only** | User must create new org  | `CreateOrganization.jsx`     |
| **Join Only**   | User must join via invite | Invitation flow              |

---

## 5. Workspace Integration

### 5.1 Workspace Hierarchy

```
Organization
├── Workspace 1
│   ├── Members (viewer, editor, admin)
│   └── Resources
└── Workspace 2
    ├── Members
    └── Resources
```

### 5.2 Workspace Roles

| Role     | Permissions                      |
| -------- | -------------------------------- |
| `viewer` | Read-only access                 |
| `editor` | Read/write access                |
| `admin`  | Full control + member management |

### 5.3 API Functions (`src/api/workspaces.js`)

```javascript
// List workspaces for an organization
getWorkspaces(orgId)

// Create a new workspace
createWorkspace({ org_id, name, slug, description })

// Get workspace details
getWorkspace(id)

// Update workspace
updateWorkspace(id, { name, description })

// Delete workspace (soft delete)
deleteWorkspace(id)

// Local storage management
getCurrentWorkspace()
setCurrentWorkspace(workspace)
clearCurrentWorkspace()
```

---

## 6. Generated Files Reference

### 6.1 Templates Directory

```
templates/
├── api/
│   ├── organizations.tpl     → src/api/organizations.js
│   └── workspaces.tpl        → src/api/workspaces.js
├── components/
│   ├── Header.tpl            → src/components/Header.jsx
│   ├── Layout.tpl            → src/components/Layout.jsx
│   ├── OrganizationManager.tpl
│   ├── OrganizationSwitcher.tpl
│   ├── OrganizationWorkspaces.tpl
│   └── ProtectedLayout.tpl
├── context/
│   └── OrganizationContext.tpl
├── pages/
│   ├── Callback.tpl
│   ├── CreateOrganization.tpl
│   ├── Dashboard.tpl
│   ├── InviteMembers.tpl
│   ├── Login.tpl
│   ├── OrganizationOnboarding.tpl
│   └── SelectOrganization.tpl
└── config/
    └── authConfig.tpl
```

### 6.2 Template Variables

| Variable                    | Description              | Example                        |
| --------------------------- | ------------------------ | ------------------------------ |
| `{{CLIENT_KEY}}`            | Unique client identifier | `my-app`                       |
| `{{APP_NAME}}`              | Display name             | `My Application`               |
| `{{PORT}}`                  | Development port         | `7898`                         |
| `{{SSO_URL}}`               | Auth service URL         | `https://local.test:4000/auth` |
| `{{ACCOUNT_UI_URL}}`        | Account UI URL           | `https://local.test:5174`      |
| `{{REQUIRES_ORGANIZATION}}` | Org required flag        | `true`                         |
| `{{ORGANIZATION_MODEL}}`    | single/multiple          | `single`                       |
| `{{ONBOARDING_FLOW}}`       | Onboarding type          | `flexible`                     |
| `{{THEME_PRIMARY}}`         | Primary color            | `#6366f1`                      |
| `{{THEME_GRADIENT}}`        | Gradient CSS             | `linear-gradient(...)`         |

---

## 7. Configuration

### 7.1 `sso-client.config.json`

```json
{
  "$schema": "./sso-client.config.schema.json",
  "clientKey": "my-app",
  "appName": "My Application",
  "port": 7898,
  "organization": {
    "required": true,
    "model": "single",
    "onboardingFlow": "flexible",
    "features": ["user_management"]
  },
  "theme": {
    "name": "indigo",
    "primary": "#6366f1",
    "secondary": "#8b5cf6"
  },
  "session": {
    "idleTimeoutMs": 1800000,
    "tokenRefreshBuffer": 300000
  }
}
```

### 7.2 `.env` (Generated)

```bash
VITE_CLIENT_KEY=my-app
VITE_SSO_URL=https://local.test:4000/auth
VITE_ACCOUNT_UI_URL=https://local.test:5174
VITE_REQUIRES_ORGANIZATION=true
VITE_ORGANIZATION_MODEL=single
```

### 7.3 Environment Variables

| Variable               | Description           |
| ---------------------- | --------------------- |
| `SSO_AUTH_SERVICE_URL` | Auth service base URL |
| `SSO_KEYCLOAK_URL`     | Keycloak server URL   |
| `SSO_CLIENT_KEY`       | Client identifier     |

---

## 8. User Flows

### 8.1 First-Time User (With Organization)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Login   │───►│ Keycloak │───►│ Callback │───►│   Has    │
│  Page    │    │   Auth   │    │  Page    │    │   Org?   │
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                     │
                                    No ◄─────────────┴─────────────► Yes
                                     │                                │
                                     ▼                                ▼
                              ┌──────────┐                     ┌──────────┐
                              │Onboarding│                     │Dashboard │
                              │  Wizard  │                     │          │
                              └────┬─────┘                     └──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
             ┌──────────┐                  ┌──────────┐
             │  Create  │                  │   Join   │
             │   Org    │                  │   Org    │
             └────┬─────┘                  └────┬─────┘
                  │                             │
                  ▼                             ▼
             ┌──────────┐                  ┌──────────┐
             │  Invite  │                  │Dashboard │
             │ Members  │                  │          │
             └────┬─────┘                  └──────────┘
                  │
                  ▼
             ┌──────────┐
             │Dashboard │
             └──────────┘
```

### 8.2 Returning User (Multi-Org)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Login   │───►│ Keycloak │───►│ Callback │───►│ Multiple │
│  Page    │    │   Auth   │    │  Page    │    │  Orgs?   │
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                     │
                                    No ◄─────────────┴─────────────► Yes
                                     │                                │
                                     ▼                                ▼
                              ┌──────────┐                     ┌──────────┐
                              │Dashboard │                     │  Select  │
                              │          │                     │   Org    │
                              └──────────┘                     └────┬─────┘
                                                                    │
                                                                    ▼
                                                               ┌──────────┐
                                                               │Dashboard │
                                                               └──────────┘
```

---

## 9. Troubleshooting

### Common Issues

| Issue                              | Solution                                                 |
| ---------------------------------- | -------------------------------------------------------- |
| `Client not found or not approved` | Wait for admin approval in auth-ui                       |
| `Template file not found`          | Reinstall CLI: `npm install -g @spidy092/sso-client-cli` |
| `Port already in use`              | Change port in `sso-client.config.json`                  |
| `HTTPS certificate errors`         | Run `npm install -D vite-plugin-mkcert`                  |
| `Organization not loading`         | Check `VITE_REQUIRES_ORGANIZATION=true` in `.env`        |
| `Workspace creation fails`         | Verify user has org admin/owner role                     |

### Debug Commands

```bash
# Check CLI status
sso-client status

# Verify configuration
cat sso-client.config.json

# Check environment
cat .env

# Test auth service connection
curl https://local.test:4000/health
```

---

## Quick Start

```bash
# 1. Create new Vite project
npx create-vite@latest my-app --template react
cd my-app

# 2. Install dependencies
npm install @spidy092/auth-client react-router-dom @tanstack/react-query
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install -D vite-plugin-mkcert

# 3. Initialize SSO
sso-client init

# 4. Add to /etc/hosts
echo "127.0.0.1 my-app.local.test" | sudo tee -a /etc/hosts

# 5. Wait for admin approval, then generate UI
sso-client generate-ui

# 6. Start development
npm run dev
```

---

## License

MIT
