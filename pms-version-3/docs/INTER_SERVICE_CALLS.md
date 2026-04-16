# PMS v2 — Inter-Service API Calls

> Author: Gururaj  
> Version: 2.0.0  
> Last Updated: 1st April 2026

This document answers — for every outbound HTTP call made by `pms-version-2` to another microservice:

- **Where** — which file and function makes the call
- **Whom** — which service is the target
- **What** — which endpoint is called and what data is exchanged
- **How** — the transport mechanism (raw `fetch` vs. `ServiceHttpClient`)
- **Why** — the business reason for the call

---

## Service Registry

The two external services PMS calls at runtime are declared in `config/config.js`:

| Alias               | Env var            | Default (Docker)                  | Default (Local dev)     |
| ------------------- | ------------------ | --------------------------------- | ----------------------- |
| `DOMAIN.auth`       | `AUTH_SERVICE_URL` | `http://auth-service:4000`        | `http://localhost:4000` |
| `DOMAIN.superAdmin` | `SUPER_ADMIN_URL`  | `http://super-administrator:4010` | `http://localhost:4010` |

The **Email Service** URL is managed separately in `services/serviceClients.js`:

| Alias               | Env var             | Default (Docker)            | Default (Local dev)     |
| ------------------- | ------------------- | --------------------------- | ----------------------- |
| `EMAIL_SERVICE_URL` | `EMAIL_SERVICE_URL` | `http://email-service:4011` | `http://localhost:4011` |

---

## Transport Layer

PMS uses two different HTTP clients depending on whether the call carries the **user's** JWT or a **machine-to-machine** token.

### 1. Raw `fetch` with user's Bearer token

Used only in `dataValidation.middleware.js`.  
The user's cookie/header `access_token` is forwarded as-is to verify the session.

```
Authorization: Bearer <user access_token>
```

### 2. `ServiceHttpClient` (Client Credentials / service-to-service)

Used everywhere else.  
`services/serviceClients.js` creates two lazy-initialized singleton clients — `authClient()` and `emailClient()` — backed by `@spidy092/service-auth`'s `ServiceHttpClient`.

On every call the client automatically:

1. Obtains a Keycloak service token using Client Credentials (`SERVICE_CLIENT_ID` / `SERVICE_CLIENT_SECRET`).
2. Caches and refreshes the token silently.
3. Attaches `Authorization: Bearer <service token>` to the outbound request.

```
Keycloak realm : process.env.KEYCLOAK_REALM  (default: "my-projects")
Client ID      : process.env.SERVICE_CLIENT_ID  (default: "pms-service")
Client Secret  : process.env.SERVICE_CLIENT_SECRET
```

---

## Call Inventory

---

### [1] Token Validation — Auth Service

|                    |                                                            |
| ------------------ | ---------------------------------------------------------- |
| **File**           | `middleware/dataValidation.middleware.js`                  |
| **Function**       | `dataValidation` (runs on every protected route)           |
| **Target service** | Auth Service                                               |
| **Method + path**  | `GET /auth/me`                                             |
| **Transport**      | Raw `fetch` with the user's own Bearer token               |
| **When**           | Every incoming HTTP request before reaching any controller |

**Request headers:**

```
Authorization: Bearer <user's access_token>
Content-Type: application/json
```

**Response fields used:**

```json
{
  "id": "<UserMetadata UUID>",
  "sub": "<Keycloak UUID>",
  "email": "user@example.com",
  "name": "Gururaj",
  "preferred_username": "gururaj",
  "roles": ["pms-user"],
  "organizations": {
    "primaryOrganization": { "id": "<org_id>" },
    "memberships": [...]
  },
  "tenant_id": "<org_id>"
}
```

**Why:**  
PMS does not store user credentials or manage sessions. It delegates 100% of identity verification to the Auth Service. The validated user object populates `req.user` and `req.organization_id` for all downstream middleware and controllers.

---

### [2] Tenant Configuration — Super Admin Service

|                    |                                                                               |
| ------------------ | ----------------------------------------------------------------------------- |
| **File**           | `middleware/dataValidation.middleware.js`                                     |
| **Function**       | `getRequiredData(subdomain, moduleCode, req)`                                 |
| **Target service** | Super Admin Service                                                           |
| **Method + path**  | `GET /api/required-data/:orgId/:subdomain/:moduleCode`                        |
| **Transport**      | Raw `fetch` (no auth header — internal network only)                          |
| **When**           | After token validation, on Redis cache miss                                   |
| **Cache**          | Redis key `app_config:<orgId>:<subdomain>:<moduleCode>` (permanent until TTL) |

**Path parameters:**
| Param | Example | Source |
|---|---|---|
| `orgId` | `7f3a...` | `req.organization_id` (from Auth Service response) |
| `subdomain` | `final-fn-pms` | First segment of incoming `Host` header |
| `moduleCode` | `pms_mod` | Hardcoded constant in `config/config.js` |

**Response used as:**  
`req.tenantConfig` — contains the tenant's DB key (`tenantConfig.data.database.key_name`) which `dbConnection.middleware.js` uses to resolve the correct per-tenant PostgreSQL connection.

**Graceful failure:**  
If Super Admin is unreachable or returns a non-2xx status, a `console.warn` is logged and `{}` is returned, allowing the request to proceed with the default shared database. This prevents a Super Admin outage from taking down all PMS routes.

**Why:**  
PMS supports multi-tenancy. Each organisation can have its own dedicated database. The Super Admin service is the single source of truth for which database key maps to which organisation, so PMS must ask it on every new session (cached in Redis thereafter).

---

### [3] User Details Lookup — Auth Service _(used in 4 places)_

|                    |                                          |
| ------------------ | ---------------------------------------- |
| **Target service** | Auth Service                             |
| **Method + path**  | `POST /auth/internal/users/lookup`       |
| **Transport**      | `ServiceHttpClient` (Client Credentials) |

**Request body:**

```json
{
  "user_ids": ["<UserMetadata UUID>", "..."],
  "user_id_type": "id"
}
```

**Response used:**

```json
{
  "data": {
    "users": [
      {
        "id": "...",
        "name": "Gururaj",
        "email": "g@example.com",
        "first_name": "Gururaj",
        "last_name": "S",
        "username": "gururaj"
      }
    ]
  }
}
```

**Call sites:**

| Where                                      | Function                                 | Why                                                                                                                               |
| ------------------------------------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `services/task/task.service.js`            | `getTasks()`                             | Enrich `assigned`, `creator`, and `approver` fields with human-readable name/email before returning the task list to the frontend |
| `services/task/task.service.js`            | `getAcceptableTask()` (help-task lookup) | Enrich the helper and helped-task assignee with name/email                                                                        |
| `services/project/projectMember.serice.js` | `_enrichMembers()`                       | Show member name + email in the project's Members tab                                                                             |
| `services/issue/Comment.service.js`        | `getCommentsByIssue()`                   | Attach the commenter's name/email so the UI can display "John commented…"                                                         |
| `services/project/AdminMonitor.service.js` | `_fetchUserNames()`                      | Resolve user IDs to display names in the Admin Monitor worklog report                                                             |

**Why `internal/users/lookup` (not `/auth/me`):**  
`/auth/me` only returns the currently authenticated user's own profile. The lookup endpoint accepts a batch of arbitrary user IDs so PMS can resolve all the people involved in a task or comment in a single request.

---

### [4] Workspace / Department Details Lookup — Auth Service _(used in 3 places)_

|                    |                                          |
| ------------------ | ---------------------------------------- |
| **Target service** | Auth Service                             |
| **Method + path**  | `POST /auth/workspaces/batch-lookup`     |
| **Transport**      | `ServiceHttpClient` (Client Credentials) |

**Request body:**

```json
{
  "workspace_ids": ["<workspace UUID>", "..."]
}
```

**Response used:**

```json
{
  "data": {
    "workspaces": [
      {
        "id": "...",
        "name": "Engineering",
        "slug": "engineering",
        "description": "..."
      }
    ]
  }
}
```

**Call sites:**

| Where                                      | Function                                               | Why                                                               |
| ------------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------- |
| `services/task/task.service.js`            | `getTasks()`                                           | Attach department (workspace) name to each task card              |
| `services/task/task.service.js`            | `getAcceptableTask()` / `getAvailableChecklistTasks()` | Show which department a help request or checklist task belongs to |
| `services/project/projectMember.serice.js` | `_enrichMembers()`                                     | Display which workspace a project member is in                    |

**Why:**  
PMS stores only the foreign-key UUID for a department/workspace (`department_id`). The human-readable name and slug live exclusively in the Auth Service. A batch call is used to keep network overhead to a single round-trip per request, regardless of how many departments are involved.

---

### [5] Transactional Email — Email Service

|                    |                                                                         |
| ------------------ | ----------------------------------------------------------------------- |
| **File**           | `services/email-client.js`                                              |
| **Function**       | `send({ type, to, data })`                                              |
| **Target service** | Email Service                                                           |
| **Method + path**  | `POST /api/v1/email/send`                                               |
| **Transport**      | `ServiceHttpClient` (Client Credentials)                                |
| **Used by**        | Any service that needs to send an email (invitation, alerts, approvals) |

**Request body:**

```json
{
  "type": "ORGANIZATION_INVITATION",
  "to": "recipient@example.com",
  "data": {
    "inviterName": "Gururaj",
    "organizationName": "My Org",
    "inviteLink": "https://..."
  }
}
```

**Supported email types** (defined in `EMAIL_TYPES`):

| Constant                  | Trigger                              |
| ------------------------- | ------------------------------------ |
| `CLIENT_REQUEST`          | A client submits a request           |
| `CLIENT_APPROVED`         | A client request is approved         |
| `CLIENT_REJECTED`         | A client request is rejected         |
| `ORGANIZATION_INVITATION` | A user is invited to an organisation |
| `WORKSPACE_INVITATION`    | A user is invited to a workspace     |
| `ORGANIZATION_CREATED`    | A new organisation is created        |
| `NEW_DEVICE_LOGIN`        | Login from a new device detected     |
| `HIGH_RISK_LOGIN`         | High-risk login detected             |
| `SECURITY_ALERT`          | General security alert               |

**Error handling:**  
If the Email Service returns HTTP 4xx/5xx, `send()` throws an `Error` with `statusCode` and `code` properties. Callers must handle or surface this to the user appropriately.

**Why:**  
PMS does not contain any SMTP logic. All email rendering, delivery, and retry handling is delegated to the dedicated Email Service microservice.

---

## Inter-Service Architecture Overview

```
                              ┌────────────────────────────────┐
                              │         PMS v2 Backend          │
                              │   (pms-version-2, port 3333)    │
                              └──────────────┬─────────────────┘
                                             │
              ┌──────────────────────────────┼────────────────────────────┐
              │                              │                            │
              ▼ [1] GET /auth/me             ▼ [2] GET /api/required-data │
              ▼ [3] POST /auth/internal/     ▼ /:orgId/:subdomain/        │
              ▼      users/lookup            ▼  :moduleCode               │
              ▼ [4] POST /auth/workspaces/                                │
              ▼      batch-lookup                                          │
   ┌──────────┴──────────┐               ┌──────────────────────┐        │
   │    Auth Service      │               │  Super Admin Service  │        │
   │  (auth-service:4000) │               │ (super-admin:4010)   │        │
   └─────────────────────┘               └──────────────────────┘        │
                                                                           │
              ▼ [5] POST /api/v1/email/send                                │
   ┌──────────┴──────────┐                                                │
   │   Email Service      │                                                │
   │ (email-service:4011) │◄───────────────────────────────────────────┘
   └─────────────────────┘

   ┌──────────────────────┐
   │   Keycloak            │◄── ServiceHttpClient obtains service tokens
   │  (keycloak:8080)      │    before calls [3], [4], [5]
   └──────────────────────┘
```

| Call #                              | Security model        | Token type                                  |
| ----------------------------------- | --------------------- | ------------------------------------------- |
| [1] `/auth/me`                      | User token forwarded  | User Bearer token (from cookie/header)      |
| [2] `/api/required-data/…`          | Internal network only | No token (relied on private Docker network) |
| [3] `/auth/internal/users/lookup`   | Service-to-service    | Keycloak Client Credentials                 |
| [4] `/auth/workspaces/batch-lookup` | Service-to-service    | Keycloak Client Credentials                 |
| [5] `/api/v1/email/send`            | Service-to-service    | Keycloak Client Credentials                 |

---

## Key Files Reference

| File                                       | Role                                                           |
| ------------------------------------------ | -------------------------------------------------------------- |
| `config/config.js`                         | Declares `DOMAIN.auth` and `DOMAIN.superAdmin` URL constants   |
| `services/serviceClients.js`               | Lazy-initialized `authClient()` and `emailClient()` singletons |
| `services/email-client.js`                 | Wraps `emailClient()` into a typed `send()` function           |
| `middleware/dataValidation.middleware.js`  | Calls [1] and [2] on every request                             |
| `services/task/task.service.js`            | Calls [3] and [4] when enriching task lists                    |
| `services/issue/Comment.service.js`        | Calls [3] when listing issue comments                          |
| `services/project/projectMember.serice.js` | Calls [3] and [4] when listing project members                 |
| `services/project/AdminMonitor.service.js` | Calls [3] when building admin worklog reports                  |

---

## Related Documents

- [ARCHITECTURE.md](ARCHITECTURE.md) — Full backend architecture including request lifecycle
- [API_REFERENCE.md](API_REFERENCE.md) — All public PMS API endpoints
- [../../auth-service/API_REFERENCE.md](../../auth-service/API_REFERENCE.md) — Auth Service endpoint reference
