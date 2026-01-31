# SSO CLI Tools - Complete API Reference (A to Z)

> **OpenAPI-Style Documentation**  
> **Version**: 2.0.0  
> **Last Updated**: January 2026  
> **Base URL**: `https://auth.local.test`

---

## Table of Contents

- [SSO CLI Tools - Complete API Reference (A to Z)](#sso-cli-tools---complete-api-reference-a-to-z)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Authentication](#authentication)
  - [🔐 Core Authentication APIs](#-core-authentication-apis)
    - [Login Flow](#login-flow)
      - [1. GET `/api/auth/login/:client`](#1-get-apiauthloginclient)
      - [3. POST `/api/auth/refresh`](#3-post-apiauthrefresh)
  - [👤 Account \& Profile APIs](#-account--profile-apis)
      - [6. GET `/api/account/profile`](#6-get-apiaccountprofile)
  - [🏢 Organization APIs](#-organization-apis)
      - [22. GET `/api/organizations`](#22-get-apiorganizations)
      - [24. POST `/api/organizations`](#24-post-apiorganizations)
  - [👥 Membership APIs](#-membership-apis)
      - [30. POST `/api/organization-memberships`](#30-post-apiorganization-memberships)
  - [🚀 Onboarding APIs](#-onboarding-apis)
      - [36. POST `/api/onboarding/create`](#36-post-apionboardingcreate)
      - [37. POST `/api/onboarding/join`](#37-post-apionboardingjoin)
  - [📦 Workspace APIs](#-workspace-apis)
      - [44. POST `/api/workspaces`](#44-post-apiworkspaces)
  - [🛡️ Admin APIs](#️-admin-apis)
    - [Users Management](#users-management)
    - [Roles Management](#roles-management)
    - [Clients Management](#clients-management)
    - [Security Configuration](#security-configuration)
  - [📊 Analytics \& Audit APIs](#-analytics--audit-apis)
  - [🔑 Permissions \& Roles APIs](#-permissions--roles-apis)
    - [Database Permissions](#database-permissions)
    - [Database Roles](#database-roles)
  - [📝 Client Registration APIs](#-client-registration-apis)
      - [128. POST `/auth/client-requests`](#128-post-authclient-requests)
  - [Complete API Reference Table](#complete-api-reference-table)
    - [Legend](#legend)
    - [API Count by Category](#api-count-by-category)
  - [Error Codes](#error-codes)
  - [CLI Command to API Mapping](#cli-command-to-api-mapping)

---

## Overview

This documentation covers **100+ API endpoints** organized by organization mode:

| Mode                     | Description                | Required APIs               |
| ------------------------ | -------------------------- | --------------------------- |
| **Without Organization** | Personal apps, simple auth | Core Auth, Account, Profile |
| **Single Organization**  | One org per user           | + Organization, Membership  |
| **Multi Organization**   | Users in multiple orgs     | + Onboarding, Switching     |
| **Workspace Mode**       | Teams within orgs          | + Workspace APIs            |

---

## Authentication

All authenticated endpoints require a Bearer token:

```http
Authorization: Bearer <access_token>
```

---

## 🔐 Core Authentication APIs

### Login Flow

| #   | Method | Endpoint                     | Auth | Description              |
| --- | ------ | ---------------------------- | ---- | ------------------------ |
| 1   | GET    | `/api/auth/login/:client`    | ❌    | Initiate OAuth flow      |
| 2   | GET    | `/api/auth/callback/:client` | ❌    | Handle OAuth callback    |
| 3   | POST   | `/api/auth/refresh`          | 🔑    | Refresh access token     |
| 4   | POST   | `/api/auth/logout`           | ✅    | Logout and revoke tokens |
| 5   | GET    | `/health`                    | ❌    | Health check             |

#### 1. GET `/api/auth/login/:client`
**Query Parameters:**
| Param                   | Type   | Required | Description    |
| ----------------------- | ------ | -------- | -------------- |
| `redirect_uri`          | string | ✅        | Callback URL   |
| `code_challenge`        | string | ✅        | PKCE challenge |
| `code_challenge_method` | string | ✅        | Usually `S256` |
| `state`                 | string | ✅        | CSRF token     |

#### 3. POST `/api/auth/refresh`
```json
// Request
{ "refresh_token": "eyJhbGciOiJIUzI1NiIsInR..." }

// Response 200
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR...",
    "expires_in": 300,
    "token_type": "Bearer"
  }
}
```

---

## 👤 Account & Profile APIs

> **Scope**: All users (with/without organization)

| #   | Method | Endpoint                                      | Auth | Description               |
| --- | ------ | --------------------------------------------- | ---- | ------------------------- |
| 6   | GET    | `/api/account/profile`                        | ✅    | Get complete user profile |
| 7   | PUT    | `/api/account/profile`                        | ✅    | Update profile            |
| 8   | GET    | `/api/account/profile/summary`                | ✅    | Get profile summary       |
| 9   | GET    | `/api/account/sessions`                       | ✅    | List active sessions      |
| 10  | DELETE | `/api/account/sessions/:id`                   | ✅    | Terminate session         |
| 11  | DELETE | `/api/account/sessions`                       | ✅    | Terminate all sessions    |
| 12  | GET    | `/api/account/devices`                        | ✅    | List trusted devices      |
| 13  | DELETE | `/api/account/devices/:id`                    | ✅    | Remove trusted device     |
| 14  | GET    | `/api/account/federated-identities`           | ✅    | List linked accounts      |
| 15  | DELETE | `/api/account/federated-identities/:provider` | ✅    | Unlink account            |
| 16  | PUT    | `/api/account/security`                       | ✅    | Update security settings  |
| 17  | POST   | `/api/account/2fa/setup`                      | ✅    | Setup 2FA                 |
| 18  | POST   | `/api/account/2fa/verify`                     | ✅    | Verify 2FA code           |
| 19  | DELETE | `/api/account/2fa`                            | ✅    | Disable 2FA               |
| 20  | PUT    | `/api/account/password`                       | ✅    | Change password           |
| 21  | POST   | `/api/account/password/validate`              | ✅    | Validate password         |

#### 6. GET `/api/account/profile`
```json
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": true,
    "provider": "google",
    "metadata": {
      "designation": "Engineer",
      "department": "Engineering",
      "mobile": "+1234567890"
    },
    "organizations": [...],
    "authorization": {
      "keycloak_roles": ["user"],
      "database_roles": ["member"],
      "permissions": ["org:read"]
    }
  }
}
```

---

## 🏢 Organization APIs

> **Scope**: Apps with `requiresOrganization: true`

| #   | Method | Endpoint                       | Auth | Description              |
| --- | ------ | ------------------------------ | ---- | ------------------------ |
| 22  | GET    | `/api/organizations`           | ✅    | List all organizations   |
| 23  | GET    | `/api/organizations/:id`       | ✅    | Get organization details |
| 24  | POST   | `/api/organizations`           | ✅    | Create organization      |
| 25  | PUT    | `/api/organizations/:id`       | 🔒    | Update organization      |
| 26  | DELETE | `/api/organizations/:id`       | 🔒    | Delete organization      |
| 27  | GET    | `/api/organizations/:id/stats` | ✅    | Get organization stats   |

#### 22. GET `/api/organizations`
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "tenant_id": "acme-corp",
      "status": "active",
      "member_count": 25,
      "owner": { "id": "uuid", "email": "owner@acme.com" },
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### 24. POST `/api/organizations`
```json
// Request
{
  "name": "New Company",
  "description": "Company description",
  "settings": {}
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New Company",
    "tenant_id": "new-company",
    "status": "active"
  }
}
```

---

## 👥 Membership APIs

> **Scope**: Apps with organization support

| #   | Method | Endpoint                                       | Auth | Description              |
| --- | ------ | ---------------------------------------------- | ---- | ------------------------ |
| 28  | GET    | `/api/organization-memberships`                | 🔒    | List all memberships     |
| 29  | GET    | `/api/organization-memberships/:id`            | ✅    | Get membership details   |
| 30  | POST   | `/api/organization-memberships`                | 🔒    | Add user to organization |
| 31  | PUT    | `/api/organization-memberships/:id`            | 🔒    | Update membership role   |
| 32  | DELETE | `/api/organization-memberships/:id`            | 🔒    | Remove membership        |
| 33  | POST   | `/api/organization-memberships/bulk-assign`    | 🔒    | Bulk add users           |
| 34  | GET    | `/api/organization-memberships/user/:userId`   | ✅    | Get user's organizations |
| 35  | GET    | `/api/organization-memberships/stats/overview` | 🔒    | Membership statistics    |

#### 30. POST `/api/organization-memberships`
```json
// Request
{
  "user_id": "uuid",
  "org_id": "uuid",
  "role_id": "uuid"
}

// Response 201
{
  "success": true,
  "data": {
    "id": "membership-uuid",
    "user": { "id": "uuid", "email": "user@example.com" },
    "organization": { "id": "uuid", "name": "Acme Corp" },
    "role": { "id": "uuid", "name": "Member" }
  }
}
```

---

## 🚀 Onboarding APIs

> **Scope**: Self-service organization creation & joining

| #   | Method | Endpoint                          | Auth | Description               |
| --- | ------ | --------------------------------- | ---- | ------------------------- |
| 36  | POST   | `/api/onboarding/create`          | ✅    | Self-service org creation |
| 37  | POST   | `/api/onboarding/join`            | ✅    | Join via invitation code  |
| 38  | POST   | `/api/onboarding/accept-pending`  | ✅    | Accept pending invitation |
| 39  | POST   | `/api/onboarding/invitations`     | 🔒    | Create invitation         |
| 40  | GET    | `/api/onboarding/invitations`     | 🔒    | List pending invitations  |
| 41  | DELETE | `/api/onboarding/invitations/:id` | 🔒    | Revoke invitation         |
| 42  | POST   | `/api/onboarding/admin/provision` | 🔒🔒   | Admin provision org       |

#### 36. POST `/api/onboarding/create`
```json
// Request
{
  "name": "My Company",
  "client_key": "my-app",
  "description": "Optional description"
}

// Response 201
{
  "success": true,
  "data": {
    "organization": { "id": "uuid", "name": "My Company", "tenant_id": "my-company" },
    "membership": { "role": "Owner" },
    "tenant_mapping": { "tenant_id": "my-company", "client_key": "my-app" }
  }
}
```

#### 37. POST `/api/onboarding/join`
```json
// Request
{ "invitation_code": "abc123def456" }

// Response 200
{
  "success": true,
  "data": {
    "organization": { "id": "uuid", "name": "Acme Corp" },
    "membership": { "role": "Member" }
  }
}
```

---

## 📦 Workspace APIs

> **Scope**: Apps with workspace organization model

| #   | Method | Endpoint                                 | Auth | Description               |
| --- | ------ | ---------------------------------------- | ---- | ------------------------- |
| 43  | GET    | `/api/workspaces`                        | ✅    | List workspaces           |
| 44  | POST   | `/api/workspaces`                        | 🔒    | Create workspace          |
| 45  | GET    | `/api/workspaces/:id`                    | ✅    | Get workspace details     |
| 46  | PUT    | `/api/workspaces/:id`                    | 🔒    | Update workspace          |
| 47  | DELETE | `/api/workspaces/:id`                    | 🔒    | Delete workspace          |
| 48  | GET    | `/api/workspaces/:id/members`            | ✅    | List workspace members    |
| 49  | POST   | `/api/workspaces/:id/members`            | 🔒    | Add member to workspace   |
| 50  | PUT    | `/api/workspaces/:id/members/:userId`    | 🔒    | Update member role        |
| 51  | DELETE | `/api/workspaces/:id/members/:userId`    | 🔒    | Remove member             |
| 52  | POST   | `/api/workspaces/:id/invitations`        | 🔒    | Send workspace invitation |
| 53  | GET    | `/api/workspaces/:id/invitations`        | 🔒    | List invitations          |
| 54  | DELETE | `/api/workspaces/:id/invitations/:invId` | 🔒    | Revoke invitation         |
| 55  | GET    | `/api/workspaces/invitations/preview`    | ✅    | Preview invitation        |
| 56  | POST   | `/api/workspaces/invitations/accept`     | ✅    | Accept invitation         |

#### 44. POST `/api/workspaces`
```json
// Request
{
  "name": "Engineering",
  "org_id": "uuid",
  "description": "Engineering team"
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Engineering",
    "slug": "engineering",
    "org_id": "uuid"
  }
}
```

---

## 🛡️ Admin APIs

> **Scope**: Keycloak administration (requires admin role)

### Users Management
| #   | Method | Endpoint                                                        | Auth | Description             |
| --- | ------ | --------------------------------------------------------------- | ---- | ----------------------- |
| 57  | GET    | `/api/admin/:realm/users`                                       | 🔒    | List users              |
| 58  | GET    | `/api/admin/:realm/users/:userId`                               | 🔒    | Get user details        |
| 59  | POST   | `/api/admin/:realm/users`                                       | 🔒🔒   | Create user             |
| 60  | PATCH  | `/api/admin/:realm/users/:userId`                               | 🔒    | Update user             |
| 61  | DELETE | `/api/admin/:realm/users/:userId`                               | 🔒🔒   | Delete user             |
| 62  | POST   | `/api/admin/:realm/users/:userId/password/reset`                | 🔒🔒   | Reset password          |
| 63  | POST   | `/api/admin/:realm/users/:userId/password/validate`             | 🔒    | Validate password       |
| 64  | PATCH  | `/api/admin/:realm/users/:userId/attributes`                    | 🔒    | Update attributes       |
| 65  | POST   | `/api/admin/:realm/users/:userId/verify-email`                  | 🔒🔒   | Send verification email |
| 66  | GET    | `/api/admin/:realm/users/:userId/credentials`                   | 🔒🔒   | Get credentials         |
| 67  | DELETE | `/api/admin/:realm/users/:userId/credentials/:type`             | 🔒🔒   | Delete credential       |
| 68  | POST   | `/api/admin/:realm/users/:userId/logout/all`                    | 🔒🔒   | Force logout all        |
| 69  | POST   | `/api/admin/:realm/users/:userId/logout`                        | 🔒🔒   | Logout user             |
| 70  | GET    | `/api/admin/:realm/users/:userId/sessions`                      | 🔒🔒   | Get sessions            |
| 71  | GET    | `/api/admin/:realm/users/:userId/totp/status`                   | 🔒🔒   | Get TOTP status         |
| 72  | POST   | `/api/admin/:realm/users/:userId/totp/require`                  | 🔒🔒   | Require TOTP            |
| 73  | POST   | `/api/admin/:realm/users/:userId/totp/email`                    | 🔒🔒   | Send TOTP email         |
| 74  | DELETE | `/api/admin/:realm/users/:userId/totp`                          | 🔒🔒   | Remove TOTP             |
| 75  | GET    | `/api/admin/:realm/users/:userId/roles`                         | 🔒    | Get user roles          |
| 76  | GET    | `/api/admin/:realm/users/:userId/roles/realm`                   | 🔒    | Get realm roles         |
| 77  | POST   | `/api/admin/:realm/users/:userId/roles/realm/assign`            | 🔒🔒   | Assign realm roles      |
| 78  | GET    | `/api/admin/:realm/users/:userId/roles/client/:clientId`        | 🔒    | Get client roles        |
| 79  | POST   | `/api/admin/:realm/users/:userId/roles/client/:clientId/assign` | 🔒🔒   | Assign client roles     |
| 80  | POST   | `/api/admin/:realm/users/:userId/roles/client/:clientId/remove` | 🔒🔒   | Remove client roles     |

### Roles Management
| #   | Method | Endpoint                                              | Auth | Description           |
| --- | ------ | ----------------------------------------------------- | ---- | --------------------- |
| 81  | GET    | `/api/admin/:realm/roles`                             | 🔒    | List realm roles      |
| 82  | GET    | `/api/admin/:realm/roles/:roleName`                   | 🔒    | Get role details      |
| 83  | POST   | `/api/admin/:realm/roles`                             | 🔒🔒   | Create role           |
| 84  | PATCH  | `/api/admin/:realm/roles/:roleId`                     | 🔒🔒   | Update role           |
| 85  | DELETE | `/api/admin/:realm/roles/:roleId`                     | 🔒🔒   | Delete role           |
| 86  | GET    | `/api/admin/:realm/roles/stats`                       | 🔒    | Role statistics       |
| 87  | GET    | `/api/admin/:realm/roles/:roleName/users`             | 🔒    | Users in role         |
| 88  | POST   | `/api/admin/:realm/roles/composite`                   | 🔒🔒   | Create composite role |
| 89  | GET    | `/api/admin/:realm/roles/:roleName/composites`        | 🔒    | Get composite roles   |
| 90  | POST   | `/api/admin/:realm/roles/:roleName/composites/add`    | 🔒🔒   | Add to composite      |
| 91  | POST   | `/api/admin/:realm/roles/:roleName/composites/remove` | 🔒🔒   | Remove from composite |

### Clients Management
| #   | Method | Endpoint                                                | Auth | Description        |
| --- | ------ | ------------------------------------------------------- | ---- | ------------------ |
| 92  | GET    | `/api/admin/:realm/clients`                             | 🔒    | List clients       |
| 93  | GET    | `/api/admin/:realm/clients/:clientId`                   | 🔒    | Get client details |
| 94  | POST   | `/api/admin/:realm/clients`                             | 🔒🔒   | Create client      |
| 95  | PATCH  | `/api/admin/:realm/clients/:clientId`                   | 🔒🔒   | Update client      |
| 96  | DELETE | `/api/admin/:realm/clients/:clientId`                   | 🔒🔒   | Delete client      |
| 97  | GET    | `/api/admin/:realm/clients/:clientId/secret`            | 🔒🔒   | Get client secret  |
| 98  | POST   | `/api/admin/:realm/clients/:clientId/secret/regenerate` | 🔒🔒   | Regenerate secret  |
| 99  | GET    | `/api/admin/:realm/clients/:clientId/roles`             | 🔒    | Get client roles   |
| 100 | POST   | `/api/admin/:realm/clients/:clientId/roles`             | 🔒🔒   | Create client role |
| 101 | GET    | `/api/admin/:realm/clients/:clientId/roles/:roleName`   | 🔒    | Get client role    |
| 102 | PATCH  | `/api/admin/:realm/clients/:clientId/roles/:roleName`   | 🔒🔒   | Update client role |
| 103 | DELETE | `/api/admin/:realm/clients/:clientId/roles/:roleName`   | 🔒🔒   | Delete client role |

### Security Configuration
| #   | Method | Endpoint                            | Auth | Description            |
| --- | ------ | ----------------------------------- | ---- | ---------------------- |
| 104 | GET    | `/api/admin/:realm/security/config` | 🔒    | Get security config    |
| 105 | PUT    | `/api/admin/:realm/security/config` | 🔒🔒   | Update security config |

---

## 📊 Analytics & Audit APIs

| #   | Method | Endpoint                                    | Auth | Description        |
| --- | ------ | ------------------------------------------- | ---- | ------------------ |
| 106 | GET    | `/api/admin/:realm/analytics/session-stats` | 🔒    | Session statistics |
| 107 | GET    | `/api/admin/:realm/analytics/login-stats`   | 🔒    | Login statistics   |
| 108 | GET    | `/api/account/audit-logs`                   | ✅    | User audit logs    |
| 109 | GET    | `/api/account/login-history`                | ✅    | Login history      |
| 110 | GET    | `/api/account/security-events`              | ✅    | Security events    |
| 111 | GET    | `/api/account/sessions/stats`               | ✅    | Session stats      |

---

## 🔑 Permissions & Roles APIs

### Database Permissions
| #   | Method | Endpoint                     | Auth | Description       |
| --- | ------ | ---------------------------- | ---- | ----------------- |
| 112 | GET    | `/api/permissions`           | 🔒    | List permissions  |
| 113 | GET    | `/api/permissions/:id`       | 🔒    | Get permission    |
| 114 | POST   | `/api/permissions`           | 🔒🔒   | Create permission |
| 115 | PUT    | `/api/permissions/:id`       | 🔒🔒   | Update permission |
| 116 | DELETE | `/api/permissions/:id`       | 🔒🔒   | Delete permission |
| 117 | GET    | `/api/permissions/resources` | 🔒    | List resources    |
| 118 | GET    | `/api/permissions/actions`   | 🔒    | List actions      |

### Database Roles
| #   | Method | Endpoint                                | Auth | Description         |
| --- | ------ | --------------------------------------- | ---- | ------------------- |
| 119 | GET    | `/api/db-roles`                         | 🔒    | List database roles |
| 120 | GET    | `/api/db-roles/:id`                     | 🔒    | Get role details    |
| 121 | POST   | `/api/db-roles`                         | 🔒🔒   | Create role         |
| 122 | PUT    | `/api/db-roles/:id`                     | 🔒🔒   | Update role         |
| 123 | DELETE | `/api/db-roles/:id`                     | 🔒🔒   | Delete role         |
| 124 | POST   | `/api/db-roles/:id/permissions`         | 🔒🔒   | Assign permissions  |
| 125 | DELETE | `/api/db-roles/:id/permissions/:permId` | 🔒🔒   | Remove permission   |
| 126 | POST   | `/api/db-roles/:id/assign`              | 🔒🔒   | Assign to user      |
| 127 | DELETE | `/api/db-roles/:id/users/:userId`       | 🔒🔒   | Remove from user    |

---

## 📝 Client Registration APIs

> **Scope**: CLI tool operations

| #   | Method | Endpoint                                  | Auth | Description           |
| --- | ------ | ----------------------------------------- | ---- | --------------------- |
| 128 | POST   | `/auth/client-requests`                   | ❌    | Register new client   |
| 129 | GET    | `/auth/client-requests/:clientKey/status` | ❌    | Check request status  |
| 130 | GET    | `/auth/clients/:clientKey/config`         | ❌    | Get client config     |
| 131 | GET    | `/auth/admin/client-requests`             | 🔒    | List pending requests |
| 132 | POST   | `/auth/admin/client-requests/:id/approve` | 🔒🔒   | Approve request       |
| 133 | POST   | `/auth/admin/client-requests/:id/reject`  | 🔒🔒   | Reject request        |
| 134 | GET    | `/auth/clients`                           | 🔒    | List all clients      |
| 135 | GET    | `/auth/clients/:clientKey`                | 🔒    | Get client details    |
| 136 | PUT    | `/auth/clients/:clientKey`                | 🔒🔒   | Update client         |
| 137 | DELETE | `/auth/clients/:clientKey`                | 🔒🔒   | Delete client         |

#### 128. POST `/auth/client-requests`
```json
// Request
{
  "name": "My App",
  "clientKey": "my-app",
  "redirectUrl": "https://my-app.local.test",
  "callbackUrl": "https://my-app.local.test/callback",
  "description": "App description",
  "developerEmail": "dev@example.com",
  "developerName": "John Doe",
  "framework": "React + Vite",
  "purpose": "Development",
  "requiresOrganization": true,
  "organizationModel": "multi",
  "organizationFeatures": ["user_management", "workspaces"],
  "onboardingFlow": "flexible"
}

// Response 201
{
  "success": true,
  "data": {
    "message": "Client registration request submitted successfully",
    "request": {
      "id": "req_12345",
      "clientKey": "my-app",
      "status": "pending",
      "organizationSupport": {
        "enabled": true,
        "model": "multi",
        "features": ["user_management", "workspaces"],
        "onboardingFlow": "flexible"
      }
    }
  }
}
```

---

## Complete API Reference Table

### Legend
- ❌ No auth required
- ✅ User auth required
- 🔒 Admin auth required
- 🔒🔒 Super admin required

### API Count by Category

| Category            | Count   | Mode Required  |
| ------------------- | ------- | -------------- |
| Core Auth           | 5       | All            |
| Account & Profile   | 16      | All            |
| Organizations       | 6       | With Org       |
| Memberships         | 8       | With Org       |
| Onboarding          | 7       | With Org       |
| Workspaces          | 14      | Workspace Mode |
| Admin Users         | 24      | Admin          |
| Admin Roles         | 11      | Admin          |
| Admin Clients       | 12      | Admin          |
| Security            | 2       | Admin          |
| Analytics/Audit     | 6       | Mixed          |
| Permissions         | 7       | Admin          |
| DB Roles            | 9       | Admin          |
| Client Registration | 10      | Mixed          |
| **Total**           | **137** |                |

---

## Error Codes

| Code                          | HTTP | Description                |
| ----------------------------- | ---- | -------------------------- |
| `VALIDATION_ERROR`            | 400  | Invalid request data       |
| `UNAUTHORIZED`                | 401  | Auth required              |
| `ACCESS_DENIED`               | 403  | Insufficient permissions   |
| `NOT_FOUND`                   | 404  | Resource not found         |
| `CONFLICT`                    | 409  | Resource exists            |
| `SINGLE_ORGANIZATION_MODE`    | 409  | User already in org        |
| `EMAIL_VERIFICATION_REQUIRED` | 403  | Email not verified         |
| `EMAIL_MISMATCH`              | 403  | Email doesn't match invite |
| `INVITATION_EXPIRED`          | 400  | Invitation expired         |
| `FETCH_FAILED`                | 500  | Database error             |
| `CREATION_FAILED`             | 500  | Creation error             |
| `UPDATE_FAILED`               | 500  | Update error               |

---

## CLI Command to API Mapping

| CLI Command              | API Endpoint                            | Description     |
| ------------------------ | --------------------------------------- | --------------- |
| `sso-client init`        | `POST /auth/client-requests`            | Register client |
| `sso-client status`      | `GET /auth/client-requests/:key/status` | Check status    |
| `sso-client link-ui`     | `GET /auth/client-requests/:key/status` | Verify approval |
| `sso-client generate-ui` | `GET /auth/clients/:key/config`         | Get config      |
| `sso-client setup`       | *(local only)*                          | Setup guide     |
