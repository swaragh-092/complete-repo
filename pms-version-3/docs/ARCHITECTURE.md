# PMS v2 — Backend Architecture

> Author: Gururaj  
> Version: 2.0.0  
> Last Updated: 1st April 2026

---

## Overview

PMS v2 is a **multi-tenant Project Management System** API. It manages the full lifecycle of software projects including features (epics), user stories, tasks, sprints, kanban boards, issue tracking, and real-time notifications.

It is designed around three core principles:

1. **Multi-tenancy** — each organisation may have its own isolated database; connections are resolved per-request via a tenant configuration registry.
2. **Audit-first writes** — every create / update / delete operation is recorded in an `AuditLog` table with user, IP, and timestamp.
3. **Service integration** — project data is enriched by calls to the centralised Auth Service (user details, role assignments) and the Super Admin Service (tenant config).

---

## Request Lifecycle

```
Browser / React Frontend
        │  HTTPS (cookie: access_token)
        ▼
   Nginx Gateway  (/pms_mod/*)
        │
        ▼
  Express App (app.js)
        │
        ├─► CORS middleware
        ├─► Cookie / JSON body parser
        │
        ├─► dataValidation.middleware
        │       • Extract JWT from cookie / Bearer header
        │       • POST  AUTH_SERVICE /auth/me  →  req.user
        │       • Resolve tenant config (Redis cache → Super Admin)
        │       • Set req.organization_id  +  req.tenantConfig
        │       • Bind organization_id to CLS namespace
        │
        ├─► dbConnection.middleware
        │       • Read tenant DB key from req.tenantConfig
        │       • getTenantSequelize(key)  →  cached connection
        │       • req.db     = model registry
        │       • req.sequelize = connection instance
        │
        └─► Router  →  Controller  →  Service  →  Model
                            │
                            └─► AuditLog (same transaction)
```

---

## Layers

### 1. Routes (`routes/`)

Declare URL patterns, attach express-validator rules, and call `validationMiddleware` before the controller handler. Each sub-router maps cleanly to a domain:

| Router file                                 | Mounts at         | Domain              |
| ------------------------------------------- | ----------------- | ------------------- |
| `routes/project/project.route.js`           | `/project`        | Projects            |
| `routes/project/projectMember.route.js`     | `/project/member` | Project members     |
| `routes/project/sprint.route.js`            | `/sprint`         | Sprints             |
| `routes/project/board.route.js`             | `/board`          | Kanban board        |
| `routes/project/backlog.route.js`           | `/backlog`        | Backlog             |
| `routes/project/report.route.js`            | `/report`         | Reports & analytics |
| `routes/feature/feature.route.js`           | `/feature`        | Features (epics)    |
| `routes/userStory/userStory.route.js`       | `/user-story`     | User stories        |
| `routes/issue/issue.route.js`               | `/issue`          | Issues              |
| `routes/issue/unifiedIssue.route.js`        | `/work-items`     | Unified work items  |
| `routes/notification/notification.route.js` | `/notification`   | Notifications       |

### 2. Controllers (`controllers/`)

Handle HTTP concerns only:

- Parse `req.params`, `req.body`, `req.query` via the `fieldPicker()` helper.
- Call the matching Service method.
- Return the result via `ResponseService.apiResponse()`.
- Catch unexpected errors with `sendErrorResponse()`.

Controllers must not contain business logic. They are kept intentionally thin.

### 3. Services (`services/`)

Contain all business logic. Return a plain object `{ success, status, data?, message?, errors? }`.

Key services and their responsibilities:

| Service                     | Responsibility                                                          |
| --------------------------- | ----------------------------------------------------------------------- |
| `project.service.js`        | Project CRUD, overview aggregation, member dashboard                    |
| `feature.service.js`        | Feature CRUD; v2 — features are project-scoped only                     |
| `userStory.service.js`      | Story lifecycle, timer management, change requests, dependencies        |
| `task.service.js`           | Task creation, assignment (lead hierarchy enforced), status transitions |
| `issue.service.js`          | Jira-style issue tracker with per-project workflow statuses             |
| `Sprint.service.js`         | Sprint creation, start/end, velocity calculation                        |
| `Board.service.js`          | Kanban column computation and issue drag-drop                           |
| `Backlog.service.js`        | Backlog listing, prioritisation, sprint assignment                      |
| `Report.service.js`         | Issue distribution, velocity, burndown charts                           |
| `AdminMonitor.service.js`   | Cross-project KPI metrics for admins                                    |
| `UserWorkReport.service.js` | Per-user and per-department work log reports                            |
| `notification.service.js`   | Create, list, and mark-read notifications                               |
| `auditLog.service.js`       | Wrap any DB write in a transaction that also writes an AuditLog row     |

### 4. Models (`models/`)

All models follow a common pattern:

```js
module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Entity = sequelize.define(
    "Entity",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      // ... domain fields
      ...commonFields(), // created_by, updated_by, context (JSONB), organisation_id
    },
    {
      tableName: tablePrefix + "entities",
      paranoid: true, // soft deletes via deleted_at
      underscored: true,
    },
  );
  return Entity;
};
```

- `initModels.js` declares all Sequelize associations (hasMany, belongsTo, etc.)
- `index.js` iterates a models directory, calls each factory, and returns a named model map.

---

## Data Model Relationships

```
Organisation (Auth Service)
    └── Project  ──────────────────┐
          ├── ProjectMember        │ many-to-many (User × Department)
          ├── IssueStatus          │ per-project workflow columns
          ├── Sprint               │
          ├── Feature (Epic)       │
          │     └── UserStory ─────┤
          │           ├── UserStory (sub-stories, recursive)
          │           ├── Task
          │           └── WorkLog
          └── Issue ───────────────┘
                ├── IssueType (hierarchy: Epic → Story → Bug → Subtask)
                ├── IssueStatus (workflow)
                ├── Comment
                ├── Attachment
                └── EntityLabel
```

---

## Authentication Flow

```
1. User logs in via Auth UI  →  receives access_token (Keycloak JWT)
2. Browser stores token in cookie (domain = .local.test)
3. Every API request sends cookie automatically
4. dataValidation.middleware:
     GET  auth-service/auth/me  (Bearer <token>)
       →  returns: { id, sub, email, roles, organizations, tenant_id }
     req.user = { id, keycloak_id, email, roles, organizations, … }
     req.organization_id = primaryOrganization.id
5. dbConnection.middleware resolves the correct tenant database
6. All service queries reference req.db (tenant-specific model registry)
```

---

## Multi-Tenant Database Strategy

Tenants may share a single PostgreSQL database (default) or be isolated in separate databases. The strategy is controlled by the `key_name` field in the tenant config returned by the Super Admin service.

```
Tenant config → key_name = "default-shared"
                            OR
                            "single-amd-tenant"
                            OR any custom key

config.js → DATABASE_DETAILS[key_name] = { host, port, name, user, password }

getTenantSequelize(key) → cached Sequelize instance for that database
```

Redis caches the tenant config with key:  
`app_config:{organization_id}:{subdomain}:{moduleCode}`

---

## Audit Logging

Every write operation must use one of the three audit helpers from `services/auditLog.service.js`:

| Helper                                                  | Use case                                                |
| ------------------------------------------------------- | ------------------------------------------------------- |
| `auditLogCreateHelperFunction({ model, data, req })`    | Single record creation                                  |
| `auditLogUpdateHelperFunction({ instance, data, req })` | Single record update                                    |
| `auditLogDeleteHelperFunction({ instance, req })`       | Soft delete                                             |
| `queryWithLogAudit({ action, req, queryCallBack })`     | Arbitrary query + audit (bulk ops, custom updates)      |
| `queryMultipleWithAuditLog({ ... })`                    | Multiple queries in one transaction with combined audit |

Each audit log entry records:

- `entity_type` and `entity_id` — what was changed
- `action` — `create` / `update` / `delete`
- `before` / `after` — JSONB snapshots
- `updated_columns` — array of changed field names
- `user_id` — who made the change
- `organization_id` — which tenant
- `ip`, `user_agent` — from `withContext(req)`

---

## Hierarchy & Permission Model

Projects use a flat role system defined on `ProjectMember.project_role`:

| Role     | Permissions                                                      |
| -------- | ---------------------------------------------------------------- |
| `lead`   | Can assign tasks and stories to other members; can manage issues |
| `member` | Can only self-assign tasks and update their own work             |
| `tester` | Can create issues (bug reports)                                  |
| `viewer` | Read-only access                                                 |

Hierarchy is enforced at the service layer:

- `task.service.createTask` — non-leads cannot create tasks for others.
- `task.service.assignChecklistTask` — non-leads cannot assign checklist tasks to others.

---

## Cron Jobs

Running at **21:00 IST** daily:

1. **`autoEndAllTasks`** — finds all `Task` records with `live_status = 'running'`, stops the timer, calculates elapsed time, and saves it.
2. **`autoEndAllUserStoryTimers`** — finds all active `WorkLog` entries with no `stopped_at`, closes them, and updates the associated user story's `total_work_time`.

Both jobs iterate over all registered tenant databases.

---

## Error Handling

- `ResponseService.apiResponse()` is the single response builder. It derives a human-readable message from the HTTP status code and entity/action context.
- `sendErrorResponse(thisAction, err, res)` logs the error and returns `500`.
- `errorHandler.middleware.js` is the Express error-handler for unhandled errors thrown outside the try/catch blocks.
- Sequelize `ValidationError` and `UniqueConstraintError` are caught and mapped to `422` / `409`.

---

## Related Documents

- [`README.md`](../README.md) — Setup and quick start
- [`API_REFERENCE.md`](API_REFERENCE.md) — Complete endpoint documentation
- [`LOCAL_DEVELOPMENT.md`](../LOCAL_DEVELOPMENT.md) — Running locally without Docker
- [`JIRA_COMPLIANCE_GUIDE.md`](JIRA_COMPLIANCE_GUIDE.md) — How issue types and workflow map to Jira concepts
