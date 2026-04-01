# PMS v2 — Backend API Service

> Author: Gururaj  
> Version: 2.0.0  
> Created: 19th June 2025

A multi-tenant **Project Management System** backend built with Node.js / Express and PostgreSQL (Sequelize ORM). It exposes a RESTful JSON API consumed by the `fn-pms-version-2` React frontend and integrates with a centralised Auth Service for token validation.

---

## Table of Contents

- [PMS v2 — Backend API Service](#pms-v2--backend-api-service)
  - [Table of Contents](#table-of-contents)
  - [Technology Stack](#technology-stack)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Install dependencies](#install-dependencies)
    - [Run migrations](#run-migrations)
    - [Start the server](#start-the-server)
  - [Environment Variables](#environment-variables)
  - [API Routes Overview](#api-routes-overview)
  - [Multi-Tenant Architecture](#multi-tenant-architecture)
  - [Authentication \& Middleware](#authentication--middleware)
    - [`dataValidation.middleware.js`](#datavalidationmiddlewarejs)
    - [`dbConnection.middleware.js`](#dbconnectionmiddlewarejs)
    - [`validation.middleware.js`](#validationmiddlewarejs)
  - [Database Models](#database-models)
  - [Background Jobs](#background-jobs)
  - [Code Standards](#code-standards)
  - [Related Documentation](#related-documentation)

---

## Technology Stack

| Layer            | Technology                        |
| ---------------- | --------------------------------- |
| Runtime          | Node.js 20                        |
| Framework        | Express 4                         |
| ORM              | Sequelize 6 (PostgreSQL)          |
| Cache            | Redis                             |
| Auth integration | Auth-Service (custom SSO gateway) |
| File uploads     | Multer                            |
| Validation       | express-validator                 |
| Scheduling       | node-cron                         |
| API docs         | Swagger UI (`/api-docs`)          |

---

## Project Structure

```
pms-version-2/
├── app.js                  # Express app setup, CORS, Swagger, route mounting
├── server.js               # HTTP server entry point
├── config/
│   ├── config.js           # Domain URLs, database keys, Redis config, CORS origins
│   ├── databaseConfig.js   # Multi-tenant dynamic Sequelize connection factory
│   ├── redisConnection.js  # Redis client singleton
│   ├── cls.js              # Continuation-Local Storage namespace (org context)
│   └── sequelize.config.js # Sequelize CLI configuration
├── controllers/            # HTTP layer — validates HTTP concerns, calls services
│   ├── feature/
│   ├── issue/
│   ├── notification/
│   ├── project/
│   └── userStory/
├── services/               # Business logic layer
│   ├── project/
│   ├── feature/
│   ├── userStory/
│   ├── issue/
│   ├── notification/
│   ├── task/
│   ├── rateLimiter/
│   ├── Response.js         # Centralised HTTP response builder
│   ├── auditLog.service.js # Audit-log helpers (create / update / delete)
│   ├── serviceClients.js   # Axios clients for Auth and other services
│   ├── validation.js       # Reusable express-validator rule factories
│   └── email-client.js     # Email notification client
├── routes/                 # Express routers (mounted at /{moduleCode}/)
│   ├── index.js            # Root router — wires all sub-routers
│   ├── project/
│   ├── feature/
│   ├── issue/
│   ├── userStory/
│   └── notification/
├── middleware/
│   ├── dataValidation.middleware.js  # JWT validation + tenant config loader
│   ├── dbConnection.middleware.js    # Attaches tenant Sequelize instance to req
│   ├── errorHandler.middleware.js    # Global Express error handler
│   ├── upload.middleware.js          # Multer file-upload configuration
│   └── validation.middleware.js     # express-validator result checker
├── models/                 # Sequelize model definitions
│   ├── initModels.js       # Declares all associations between models
│   ├── index.js            # Loads & registers all models in a given sequelize instance
│   ├── project/
│   ├── feature/
│   ├── userStory/
│   ├── issue/
│   ├── notification/
│   ├── workLog/
│   └── overall/
├── migrations/             # Sequelize DB migrations (run via CLI)
├── seeders/                # Optional seed data
├── jobs/
│   ├── CronJobs.js         # Cron schedule declarations (node-cron)
│   └── services/
│       └── jobServices.js  # Job implementation logic
├── util/
│   ├── helper.js           # Shared helpers: fieldPicker, withContext, pagination…
│   ├── pagination.js       # Sequelize pagination helper
│   ├── constant.js         # Shared enumerations and constants
│   └── urls.js             # Internal service URL builders
└── docs/
    ├── ARCHITECTURE.md     # Detailed architecture guide
    ├── API_REFERENCE.md    # Full API reference
    ├── EXCEL_EXPORT_API.md # Excel export endpoint docs
    └── JIRA_COMPLIANCE_GUIDE.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL >= 14
- Redis >= 6
- Auth Service running (see `../auth-service`)

### Install dependencies

```bash
cd pms-version-2
npm install
```

### Run migrations

```bash
npx sequelize-cli db:migrate
```

### Start the server

```bash
# Development (with nodemon)
npm run dev

# Local development (uses .env.local)
bash start-local.sh

# Production
npm start
```

The API will start on **http://localhost:3015**.  
Interactive Swagger docs are available at **http://localhost:3015/api-docs** (non-production only).

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

| Variable           | Description                           | Default                           |
| ------------------ | ------------------------------------- | --------------------------------- |
| `PORT`             | HTTP port                             | `3015`                            |
| `NODE_ENV`         | `development` / `production` / `test` | `development`                     |
| `DB_HOST`          | PostgreSQL host                       | `localhost`                       |
| `DB_PORT`          | PostgreSQL port                       | `5411`                            |
| `DB_NAME`          | Database name                         | `pms_v2`                          |
| `DB_USER`          | Database user                         | `postgres`                        |
| `DB_PASSWORD`      | Database password                     | —                                 |
| `REDIS_HOST`       | Redis host                            | `localhost`                       |
| `REDIS_PORT`       | Redis port                            | `6379`                            |
| `AUTH_SERVICE_URL` | Auth Service base URL                 | `http://auth-service:4000`        |
| `SUPER_ADMIN_URL`  | Super Admin Service URL               | `http://super-administrator:4010` |

---

## API Routes Overview

All routes are prefixed with `/{moduleCode}` where `moduleCode` is `pms_mod`.

| Method            | Path                                       | Description                  |
| ----------------- | ------------------------------------------ | ---------------------------- |
| `GET`             | `/health`                                  | Health check                 |
| `GET`             | `/pms_mod/dash`                            | Dashboard ping               |
| **Projects**      |                                            |                              |
| `POST`            | `/pms_mod/project`                         | Create project               |
| `GET`             | `/pms_mod/project`                         | List all projects            |
| `GET`             | `/pms_mod/project/overview`                | Portfolio overview           |
| `GET`             | `/pms_mod/project/member-dashboard`        | Member dashboard data        |
| `GET`             | `/pms_mod/project/:id`                     | Get project by ID            |
| `PUT`             | `/pms_mod/project/:id`                     | Update project               |
| `DELETE`          | `/pms_mod/project/:id`                     | Soft-delete project          |
| **Features**      |                                            |                              |
| `POST`            | `/pms_mod/feature/project/:projectId`      | Create feature under project |
| `GET`             | `/pms_mod/feature/project/:projectId`      | List features by project     |
| `GET`             | `/pms_mod/feature/:featureId`              | Get feature detail           |
| `PUT`             | `/pms_mod/feature/:featureId`              | Update feature               |
| `DELETE`          | `/pms_mod/feature/:featureId`              | Delete feature               |
| **User Stories**  |                                            |                              |
| `POST`            | `/pms_mod/user-story/feature/:featureId`   | Create user story            |
| `GET`             | `/pms_mod/user-story/:userStoryId`         | Get user story               |
| `PUT`             | `/pms_mod/user-story/:userStoryId`         | Update user story            |
| `DELETE`          | `/pms_mod/user-story/:userStoryId`         | Delete user story            |
| `POST`            | `/pms_mod/user-story/:id/advance`          | Advance story status         |
| `POST`            | `/pms_mod/user-story/:id/timer/start`      | Start work timer             |
| `POST`            | `/pms_mod/user-story/:id/timer/stop`       | Stop work timer              |
| **Issues**        |                                            |                              |
| `POST`            | `/pms_mod/issue/project/:projectId`        | Create issue                 |
| `GET`             | `/pms_mod/issue/project/:projectId`        | List issues                  |
| `GET`             | `/pms_mod/issue/:id`                       | Get issue detail             |
| `PUT`             | `/pms_mod/issue/:id`                       | Update issue                 |
| `PATCH`           | `/pms_mod/issue/:id/status`                | Change issue status          |
| `GET`             | `/pms_mod/issue/:id/comments`              | List comments                |
| `POST`            | `/pms_mod/issue/:id/comment`               | Add comment                  |
| **Sprints**       |                                            |                              |
| `POST`            | `/pms_mod/sprint/project/:projectId`       | Create sprint                |
| `PUT`             | `/pms_mod/sprint/:sprintId/start`          | Start sprint                 |
| `PUT`             | `/pms_mod/sprint/:sprintId/end`            | End sprint                   |
| **Board**         |                                            |                              |
| `GET`             | `/pms_mod/board/project/:projectId`        | Get kanban board             |
| `PUT`             | `/pms_mod/board/move`                      | Move issue on board          |
| **Reports**       |                                            |                              |
| `GET`             | `/pms_mod/report/project/:id/distribution` | Issue distribution           |
| `GET`             | `/pms_mod/report/project/:id/velocity`     | Sprint velocity              |
| `GET`             | `/pms_mod/report/work-logs/overview`       | Work log overview            |
| `GET`             | `/pms_mod/report/admin/summary`            | Admin KPI summary            |
| **Notifications** |                                            |                              |
| `GET`             | `/pms_mod/notification`                    | List notifications           |
| `PUT`             | `/pms_mod/notification/:id`                | Mark notification as read    |
| `GET`             | `/pms_mod/notification/unread-count`       | Unread count                 |

> For the complete, interactive API reference see **Swagger UI** at `/api-docs` or `docs/API_REFERENCE.md`.

---

## Multi-Tenant Architecture

Each HTTP request goes through a two-step middleware chain before reaching a controller:

```
Request
  └─► dataValidation.middleware   (validates JWT → populates req.user + req.organization_id)
        └─► dbConnection.middleware  (resolves tenant DB key → populates req.db + req.sequelize)
              └─► Controller / Service
```

- Tenant DB key is resolved from `req.tenantConfig.data.database.key_name` (fetched from Super Admin and cached in Redis).
- All model queries use `req.db` (the tenant-specific Sequelize model registry) so every query automatically targets the correct database.
- `req.organization_id` is propagated to every audit log entry via `withContext(req)`.

---

## Authentication & Middleware

### `dataValidation.middleware.js`

1. Extracts `access_token` from cookie or `Authorization: Bearer` header.
2. Calls `AUTH_SERVICE_URL/auth/me` to validate the token.
3. Populates `req.user` (id, email, roles, tenant_id, organizations).
4. Fetches tenant config from Super Admin (Redis-cached) and sets `req.tenantConfig`.

### `dbConnection.middleware.js`

1. Reads `req.tenantConfig.data.database.key_name` (falls back to `"default-shared"`).
2. Returns a cached Sequelize instance (`getTenantSequelize`) or creates one on first use.
3. Sets `req.db` (Sequelize models map) and `req.sequelize` (connection instance).

### `validation.middleware.js`

A simple factory `validateRequest(ENTITY, ACTION)` that checks `express-validator` results and returns a `422` response if any validation fails.

---

## Database Models

| Model           | Table                 | Purpose                                       |
| --------------- | --------------------- | --------------------------------------------- |
| `Project`       | `pms_projects`        | Top-level project container                   |
| `Feature`       | `pms_features`        | Epic-level grouping (project-scoped)          |
| `UserStory`     | `pms_user_stories`    | User stories (parent/child hierarchy)         |
| `Task`          | `pms_tasks`           | Atomic work items assigned to members         |
| `Issue`         | `pms_issues`          | Bug/task tracker items (Jira-style)           |
| `IssueStatus`   | `pms_issue_statuses`  | Configurable per-project workflow statuses    |
| `IssueType`     | `pms_issue_types`     | Type hierarchy (Epic → Story → Bug → Subtask) |
| `Sprint`        | `pms_sprints`         | Time-boxed sprint containers                  |
| `ProjectMember` | `pms_project_members` | User ↔ Project ↔ Department membership        |
| `Notification`  | `pms_notifications`   | In-app notifications                          |
| `AuditLog`      | `pms_audit_logs`      | Full change history for all entities          |
| `WorkLog`       | `pms_work_logs`       | Timer-based work session records              |

All models use:

- UUIDs as primary keys
- `paranoid: true` for soft deletes (`deleted_at`)
- `context` JSONB field to capture `user_id`, `ip`, `userAgent` for every write

---

## Background Jobs

Defined in `jobs/CronJobs.js` and implemented in `jobs/services/jobServices.js`.

| Schedule           | Job                         | Description                                      |
| ------------------ | --------------------------- | ------------------------------------------------ |
| Daily at 21:00 IST | `autoEndAllTasks`           | Auto-stops any tasks still running at end of day |
| Daily at 21:00 IST | `autoEndAllUserStoryTimers` | Auto-closes any open work-log timers             |

---

## Code Standards

- **File headers** — every file begins with:
  ```js
  // Author: Gururaj
  // Created: DD MMM YYYY
  // Description: …
  // Version: 1.0.0
  // Modified:
  ```
- **Controllers** — thin HTTP layer only; delegate all logic to services.
- **Services** — return `{ success, status, data?, message?, errors? }` — never throw to the controller.
- **Error responses** — use `sendErrorResponse(thisAction, err, res)` from `util/helper.js`.
- **Audit logging** — use `auditLogCreateHelperFunction`, `auditLogUpdateHelperFunction`, or `queryWithLogAudit` from `services/auditLog.service.js` for all writes.
- **Hierarchy enforcement** — only project leads (`project_role === 'lead'`) may assign tasks or stories to other department members.

---

## Related Documentation

| Document               | Location                                                         |
| ---------------------- | ---------------------------------------------------------------- |
| Architecture deep-dive    | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)                         |
| Full API reference        | [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md)                       |
| Inter-service API calls   | [`docs/INTER_SERVICE_CALLS.md`](docs/INTER_SERVICE_CALLS.md)           |
| Excel export API          | [`docs/EXCEL_EXPORT_API.md`](docs/EXCEL_EXPORT_API.md)                 |
| Jira compliance guide     | [`docs/JIRA_COMPLIANCE_GUIDE.md`](docs/JIRA_COMPLIANCE_GUIDE.md)       |
| Local development      | [`LOCAL_DEVELOPMENT.md`](LOCAL_DEVELOPMENT.md)                   |
| Quick reference        | [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md)                       |
| Frontend service       | [`../fn-pms-version-2`](../fn-pms-version-2/README.md)           |
