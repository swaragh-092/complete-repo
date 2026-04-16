# Enterprise RBAC System - Complete Guide

A focused guide for managing **Roles and Permissions** in the auth-service.

---

## System Roles (4 Only)

| Role     | Description                   | Auto-Assigned     |
| :------- | :---------------------------- | :---------------- |
| `owner`  | Full org control              | When creating org |
| `admin`  | Manage org/members/workspaces | By owner          |
| `member` | Basic access                  | When joining org  |
| `viewer` | Read-only                     | By owner/admin    |

---

## Permission Format

```
client:resource:action
```

**Examples:**
```
*:org:read            → View org (any app)
*:member:invite       → Invite members
*:workspace:member:add → Add member to workspace
```

---

## Available Permissions

| Resource      | Permissions                                                         |
| :------------ | :------------------------------------------------------------------ |
| **org**       | `read`, `update`, `delete`                                          |
| **member**    | `read`, `invite`, `remove`, `update_role`                           |
| **workspace** | `create`, `read`, `update`, `delete`, `member:add`, `member:remove` |
| **role**      | `create`, `read`, `update`, `delete`                                |
| **audit**     | `read`                                                              |

---

## Role Management API

Base URL: `/api/org-roles`

| Method | Endpoint                 | Permission      | Description          |
| :----- | :----------------------- | :-------------- | :------------------- |
| GET    | `/`                      | `*:role:read`   | List all roles       |
| GET    | `/:id`                   | `*:role:read`   | Get role details     |
| POST   | `/`                      | `*:role:create` | Create custom role   |
| PUT    | `/:id`                   | `*:role:update` | Update custom role   |
| DELETE | `/:id`                   | `*:role:delete` | Delete custom role   |
| POST   | `/:id/permissions`       | `*:role:update` | Assign permissions   |
| GET    | `/permissions/available` | `*:role:read`   | List all permissions |

**Note:** System roles (owner, admin, member, viewer) cannot be modified.

---

## Adding Permissions/Roles

### Step 1: Edit `config/rbac-definitions.json`
### Step 2: Run sync script:
```bash
# Docker
docker exec sso-auth-service node scripts/sync-rbac.js

# Local
node scripts/sync-rbac.js
```

---

## CLI Templates (sso-cli-tools)

| Template                                   | Purpose                                            |
| :----------------------------------------- | :------------------------------------------------- |
| `templates/rbac/permissions.tpl`           | Permission constants                               |
| `templates/rbac/usePermissions.tpl`        | React hooks (`useHasPermission`, `PermissionGate`) |
| `templates/rbac/rbac-definitions.json.tpl` | Sample RBAC config                                 |

---

## Docker Commands

```bash
# Run migrations
docker exec sso-auth-service npx sequelize-cli db:migrate --env production

# Sync RBAC
docker exec sso-auth-service node scripts/sync-rbac.js
```
