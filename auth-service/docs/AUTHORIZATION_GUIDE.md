# Enterprise Authorization System: A-Z Guide

A comprehensive guide to the unified RBAC/ABAC/ReBAC authorization system.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Permission Naming Convention](#2-permission-naming-convention)
3. [Adding New Permissions & Roles](#3-adding-new-permissions--roles)
4. [Runtime Enforcement Flow](#4-runtime-enforcement-flow)
5. [Using Authorization in Code](#5-using-authorization-in-code)
6. [API Endpoints](#6-api-endpoints)
7. [Maintenance & Operations](#7-maintenance--operations)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Architecture Overview

### The 3 Authorization Paradigms

| Paradigm  | What it Checks                                       | Use Case                                   |
| :-------- | :--------------------------------------------------- | :----------------------------------------- |
| **RBAC**  | Does user have permission `X` via their role?        | Standard access control                    |
| **ABAC**  | Do user/resource attributes match policy conditions? | Context-aware rules (time, location, etc.) |
| **ReBAC** | Does user have relationship `Y` to resource `Z`?     | Ownership, team membership                 |

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    AuthorizationService                      │
│                   (access-control.js)                        │
├───────────────┬───────────────────┬─────────────────────────┤
│   RBAC Check  │    ABAC Check     │      ReBAC Check        │
│ (Permissions) │  (PolicyEngine)   │  (RelationshipGraph)    │
└───────────────┴───────────────────┴─────────────────────────┘
         │                │                     │
         └────────────────┼─────────────────────┘
                          ▼
                   ┌──────────────┐
                   │   Decision   │
                   │ ALLOW / DENY │
                   └──────────────┘
```

### Key Files

| File                                                 | Purpose                                            |
| :--------------------------------------------------- | :------------------------------------------------- |
| `config/rbac-definitions.json`                       | **Source of truth** for permissions & system roles |
| `scripts/sync-rbac.js`                               | Syncs JSON definitions to database                 |
| `modules/authorization/engine/access-control.js`     | Core authorization logic                           |
| `modules/authorization/engine/policy-engine.js`      | ABAC policy evaluation                             |
| `modules/authorization/engine/relationship-graph.js` | ReBAC relationship checks                          |
| `modules/authorization/middleware/index.js`          | Express middleware                                 |

---

## 2. Permission Naming Convention

### Format: `client:resource:action`

```
*:user:create       → Global permission (all apps)
web-portal:admin:manage → Only for web-portal client
auth-mobile:profile:read → Only for mobile app
```

| Segment      | Description                     | Examples                             |
| :----------- | :------------------------------ | :----------------------------------- |
| **client**   | App/client scope (`*` = global) | `*`, `web-portal`, `auth-mobile`     |
| **resource** | What you're accessing           | `user`, `project`, `invoice`         |
| **action**   | What you're doing               | `create`, `read`, `update`, `delete` |

### Permission Visibility Rules

| Permission                | Who Can Use It           |
| :------------------------ | :----------------------- |
| `*:user:read`             | Any application          |
| `web-portal:admin:manage` | Only `web-portal` client |

---

## 3. Adding New Permissions & Roles

### Step 1: Edit `config/rbac-definitions.json`

```json
{
  "permissions": [
    // Add new permission here
    { 
      "name": "*:invoice:create", 
      "description": "Create invoices", 
      "resource": "invoice", 
      "action": "create", 
      "is_system": false 
    }
  ],
  
  "system_roles": {
    // Add new role or update existing
    "billing_manager": {
      "description": "Manages billing and invoices",
      "is_system": false,
      "client_id": null,
      "permissions": [
        "*:invoice:create",
        "*:invoice:read",
        "*:invoice:update"
      ]
    }
  }
}
```

### Step 2: Run Sync Script

```bash
# Local development
node scripts/sync-rbac.js

# Docker
docker exec sso-auth-service node scripts/sync-rbac.js
```

The script is **idempotent** - safe to run multiple times.

---

## 4. Runtime Enforcement Flow

```
Request: GET /api/invoices/123
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ Middleware extracts:                            │
│  • userId: from JWT (req.user.sub)              │
│  • clientId: from JWT (req.user.azp) or header  │
│  • orgId: from X-Org-Id header                  │
│  • resource: "invoice"                          │
│  • action: "read"                               │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ AuthorizationService.checkAccess()              │
│                                                 │
│ 1. RBAC: Does user have `*:invoice:read` or    │
│          `{clientId}:invoice:read`?             │
│                                                 │
│ 2. ABAC: Do policies allow based on            │
│          time/location/attributes?              │
│                                                 │
│ 3. ReBAC: Is user "owner" of invoice 123?      │
└─────────────────────────────────────────────────┘
                    │
                    ▼
              ALLOW or DENY
```

---

## 5. Using Authorization in Code

### Option A: Middleware (Recommended)

```javascript
const { authorize, authorizeRBAC } = require('../modules/authorization');

// RBAC only
router.get('/invoices', 
  authorizeRBAC('*:invoice:read'),
  (req, res) => { /* handler */ }
);

// Full authorization (RBAC + ABAC + ReBAC)
router.delete('/invoices/:id',
  authorize({
    action: 'delete',
    resourceType: 'invoice',
    resourceIdParam: 'id'
  }),
  (req, res) => { /* handler */ }
);
```

### Option B: Programmatic Check

```javascript
const { AuthorizationService } = require('../modules/authorization');

async function someFunction(user, invoiceId) {
  const result = await AuthorizationService.checkAccess({
    user,
    action: 'delete',
    resource: { type: 'invoice', id: invoiceId, orgId: user.orgId },
    options: { clientId: user.azp }
  });

  if (!result.allowed) {
    throw new ForbiddenError(result.reason);
  }
}
```

---

## 6. API Endpoints

Base path: `/api/authorization`

### Policies (ABAC)
| Method | Endpoint        | Permission Required |
| :----- | :-------------- | :------------------ |
| GET    | `/policies`     | `*:policy:read`     |
| POST   | `/policies`     | `*:policy:create`   |
| PUT    | `/policies/:id` | `*:policy:update`   |
| DELETE | `/policies/:id` | `*:policy:delete`   |

### Relationships (ReBAC)
| Method | Endpoint             | Permission Required     |
| :----- | :------------------- | :---------------------- |
| GET    | `/relationships`     | `*:relationship:read`   |
| POST   | `/relationships`     | `*:relationship:create` |
| DELETE | `/relationships/:id` | `*:relationship:delete` |

### Access Check
| Method | Endpoint | Description                     |
| :----- | :------- | :------------------------------ |
| POST   | `/check` | Test if user can perform action |

---

## 7. Maintenance & Operations

### Docker Commands

```bash
# Run migrations
docker exec sso-auth-service npx sequelize-cli db:migrate --env production

# Sync RBAC definitions
docker exec sso-auth-service node scripts/sync-rbac.js

# Rebuild after code changes
docker compose build auth-service && docker compose up -d auth-service
```

### Adding a Client-Specific Role

Edit `rbac-definitions.json`:
```json
{
  "system_roles": {
    "mobile_viewer": {
      "description": "Read-only mobile user",
      "is_system": false,
      "client_id": "auth-mobile",  // ← Client-specific!
      "permissions": ["auth-mobile:profile:read"]
    }
  }
}
```

### Auditing Role Changes

All changes via sync script are logged:
```
✅ Created permission: *:invoice:create
✅ Created role: billing_manager
```

---

## 8. Troubleshooting

### "Dialect needs to be explicitly supplied"
```bash
# Use --env production flag
docker exec sso-auth-service npx sequelize-cli db:migrate --env production
```

### "Module not found" for sync script
```bash
# Copy files to running container
docker cp auth-service/scripts/sync-rbac.js sso-auth-service:/app/scripts/
docker cp auth-service/config/rbac-definitions.json sso-auth-service:/app/config/
```

### Permission denied at runtime
1. Check user has correct role in `organization_memberships` table
2. Verify permission exists in `permissions` table
3. Verify role-permission link in `role_permissions` table
4. Check `clientId` matches (if using client-scoped permissions)

---

## Quick Reference

| Task                    | Command                                                                      |
| :---------------------- | :--------------------------------------------------------------------------- |
| Add permission          | Edit `config/rbac-definitions.json` → run `sync-rbac.js`                     |
| Add role                | Edit `config/rbac-definitions.json` → run `sync-rbac.js`                     |
| Check user access       | `POST /api/authorization/check`                                              |
| Run migrations (Docker) | `docker exec sso-auth-service npx sequelize-cli db:migrate --env production` |
| Sync RBAC (Docker)      | `docker exec sso-auth-service node scripts/sync-rbac.js`                     |
