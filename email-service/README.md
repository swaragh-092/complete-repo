# 📧 Email Service

Enterprise-grade microservice for sending transactional emails with multi-tenant tracking, queue-based delivery, and SMTP failover. Part of the SSO stack.

## 🚀 Quick Start

### Docker (recommended)

```bash
docker compose up --build -d email-service
curl http://localhost:4011/health
```

### Local Development

```bash
npm install
cp .env.example .env   # Edit with your SMTP credentials
npm run dev
```

---

## 📡 API Reference

**Base URL:** `http://localhost:4011` (host) | `http://email-service:4011` (Docker internal)

**Auth:** All `/api/v1/*` endpoints require header `x-service-secret: <secret>`

---

### Health Checks

```http
GET /health          # Liveness probe (is the server up?)
GET /health/ready    # Readiness probe (DB + Redis + SMTP status)
```

**Readiness Response:**
```json
{
  "data": {
    "status": "ready",
    "uptime": 3600,
    "checks": { "database": "up", "redis": "up", "smtp": "up" }
  }
}
```

---

### Send Email

```http
POST /api/v1/email/send
```

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `type` | string | ✅ | Email type (see types table below) |
| `to` | string | ✅ | Recipient email |
| `data` | object | ✅ | Template data |
| `scope` | string | | `system` \| `organization` \| `user` (auto-detected if omitted) |
| `org_id` | uuid | | Organization ID (required if scope = `organization`) |
| `user_id` | uuid | | User ID (required if scope = `user`) |
| `client_key` | string | | Client that triggered this (e.g. `admin-ui`) |
| `service_name` | string | | Calling service (e.g. `auth-service`) |
| `delay` | number | | Delay in ms before sending (min 1s, max 7 days) |

**Example — Immediate send (old format, backwards compatible):**

```json
{
  "type": "CLIENT_REQUEST",
  "to": "admin@example.com",
  "data": { "adminName": "Admin", "clientName": "MyApp", "developerEmail": "dev@app.com" }
}
```

**Example — Multi-tenant with delay:**

```json
{
  "type": "ORGANIZATION_INVITATION",
  "to": "user@acme.com",
  "scope": "organization",
  "org_id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "client_key": "admin-ui",
  "service_name": "auth-service",
  "delay": 60000,
  "data": {
    "inviterName": "Alice",
    "organizationName": "Acme Corp",
    "role": "member",
    "invitationLink": "https://app.com/invite/abc123"
  }
}
```

**Response (202):**

```json
{
  "success": true,
  "message": "Email queued successfully",
  "data": {
    "logId": "uuid",
    "status": "queued",
    "type": "ORGANIZATION_INVITATION",
    "to": "user@acme.com",
    "scope": "organization",
    "scheduled_for": "2026-02-19T07:00:00.000Z"
  }
}
```

---

### Get Email History

```http
GET /api/v1/email/history
```

| Query Param | Description |
| :--- | :--- |
| `page` | Page number (default: 1) |
| `limit` | Per page (default: 20, max: 100) |
| `status` | Filter: `queued`, `sending`, `sent`, `failed` |
| `type` | Filter by email type |
| `to` | Search recipient (partial match) |
| `scope` | Filter by scope |
| `org_id` | Filter by organization |
| `user_id` | Filter by user |
| `client_key` | Filter by client |
| `service_name` | Filter by calling service |

---

### Get Email Stats

```http
GET /api/v1/email/stats
```

| Query Param | Description |
| :--- | :--- |
| `org_id` | Stats for specific org |
| `scope` | Stats for specific scope |
| `client_key` | Stats for specific client |
| `service_name` | Stats for specific service |

**Response:**

```json
{ "data": { "queued": 2, "sending": 0, "sent": 150, "failed": 3, "total": 155 } }
```

---

### Resend Failed Email

```http
POST /api/v1/email/resend/:id
```

Resends a failed email. Preserves original tracking fields (org_id, scope, etc.).

---

### Get Email Types

```http
GET /api/v1/email/types
```

---

### Manual Cleanup

```http
POST /api/v1/email/cleanup?retention_days=90
```

Triggers immediate cleanup of old email logs. Default: 90 days.

---

### Queue Dashboard

```
http://localhost:4011/admin/queues
```

BullMQ dashboard — view queued/active/completed/failed jobs. No auth required (internal service).

---

## 📝 Email Types & Required Data

| Type | Auto-Scope | Required `data` Fields |
| :--- | :--- | :--- |
| `CLIENT_REQUEST` | `system` | `adminName`, `clientName`, `developerEmail` |
| `CLIENT_APPROVED` | `system` | `developerName`, `clientName`, `clientId`, `clientSecret` |
| `CLIENT_REJECTED` | `system` | `developerName`, `clientName`, `rejectionReason` |
| `ORGANIZATION_INVITATION` | `organization` | `inviterName`, `organizationName`, `role`, `invitationLink` |
| `WORKSPACE_INVITATION` | `organization` | `workspaceName`, `organizationName`, `inviterEmail`, `role`, `invitationLink` |
| `ORGANIZATION_CREATED` | `organization` | `userName`, `organizationName` |
| `NEW_DEVICE_LOGIN` | `user` | `userName`, `device`, `ip`, `time` |
| `HIGH_RISK_LOGIN` | `user` | `userName` |
| `SECURITY_ALERT` | `user` | `userName`, `alertTitle`, `alertMessage` |

### Scope Rules

- `scope` is auto-detected from `type` if not provided
- **`organization`** scope requires `org_id`
- **`user`** scope requires `user_id`
- Old callers (no scope/tracking) work without changes — backwards compatible

---

## ⚙️ Environment Variables


| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| **Server** | | | |
| `NODE_ENV` | | `development` | Environment mode |
| `PORT` | | `4011` | Server port |
| `SERVICE_SECRET` | ✅ | | Service-to-service auth secret |
| **SMTP — Primary** | | | |
| `SMTP_HOST` | | | Primary SMTP host |
| `SMTP_PORT` | | `587` | Primary SMTP port |
| `SMTP_USER` | | | Primary SMTP username |
| `SMTP_PASS` | | | Primary SMTP password |
| `FROM_EMAIL` | | | Sender email address |
| `APP_NAME` | | `Email Service` | App name in email "From" |
| **SMTP — Backup (failover)** | | | |
| `SMTP_BACKUP_HOST` | | | Backup SMTP host |
| `SMTP_BACKUP_PORT` | | `587` | Backup SMTP port |
| `SMTP_BACKUP_USER` | | | Backup SMTP username |
| `SMTP_BACKUP_PASS` | | | Backup SMTP password |
| **Database** | | | |
| `DB_HOST` | ✅ | `localhost` | PostgreSQL host |
| `DB_PORT` | | `5432` | PostgreSQL port |
| `DB_NAME` | | `email_service` | Database name |
| `DB_USER` | | `postgres` | Database user |
| `DB_PASSWORD` | ✅ | | Database password |
| **Redis** | | | |
| `REDIS_HOST` | | `localhost` | Redis host |
| `REDIS_PORT` | | `6379` | Redis port |
| **Queue & Scheduling** | | | |
| `QUEUE_MAX_ATTEMPTS` | | `3` | Max retry attempts per email |
| `LOG_RETENTION_DAYS` | | `90` | Days to keep email logs before cleanup |
| `MAX_DELAY_MS` | | `604800000` | Max scheduling delay (default: 7 days) |

---

## 🏗️ Architecture

```text
                    ┌─────────────┐
 Caller ──POST──▶  │  Express    │
                    │  API Layer  │──▶ Validates (Joi) ──▶ Creates EmailLog (Postgres)
                    └──────┬──────┘                              │
                           │                                     │
                    ┌──────▼──────┐                              │
                    │  BullMQ     │◀── Job: { logId, type, to, data }
                    │  Queue      │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Worker     │──▶ Renders template
                    │  (3 conc.)  │──▶ Sends via SMTP (primary → backup)
                    └─────────────┘──▶ Updates EmailLog status
```

## 🏗️ Project Structure

```text
email-service/
├── src/
│   ├── config/          # Environment, constants, database
│   ├── middleware/      # Auth, error handler, request logger
│   ├── migrations/      # Sequelize migrations
│   ├── models/          # EmailLog model
│   ├── queue/           # BullMQ email queue + cleanup queue
│   ├── routes/          # Health, email, dashboard routes
│   ├── services/        # Email service, SMTP provider
│   ├── templates/       # 9 email templates + shared components
│   ├── utils/           # AppError, logger, html-escaper, validation
│   └── server.js        # Entry point + graceful shutdown
├── Dockerfile
├── package.json
└── README.md
```

---

## 🔒 Security

- **Authentication**: All API endpoints require `x-service-secret` header
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Joi schema validation with `stripUnknown`
- **SQL Injection**: Parameterized queries (Sequelize ORM)
- **XSS Prevention**: HTML escaping on all template data
- **Helmet**: Security headers enabled
- **CORS**: Disabled (internal service, no browser access)
- **Non-root Docker**: Runs as `nodejs` user (UID 1001)
- **Error Hiding**: Stack traces hidden in production
- **Correlation ID**: `x-request-id` header on all responses

---

## 🔧 Operations

### Graceful Shutdown

On `SIGTERM`/`SIGINT`: stops HTTP → waits for active jobs → closes DB pool → exits.

### SMTP Failover

If primary SMTP fails, automatically retries with backup provider. No config changes needed at runtime.

### Log Cleanup

Runs daily at 3:00 AM. Deletes `sent`/`failed` logs older than `LOG_RETENTION_DAYS`.

Manual trigger: `POST /api/v1/email/cleanup`

### Monitoring

- **Health**: `GET /health` (liveness), `GET /health/ready` (readiness + dependency status)
- **Dashboard**: `http://localhost:4011/admin/queues` (BullMQ UI)
- **Logs**: Winston logger with structured JSON, `x-request-id` correlation

---

## 👥 Integration Example

```javascript
const sendEmail = async ({ type, to, data, org_id, delay }) => {
  const response = await fetch('http://email-service:4011/api/v1/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-service-secret': process.env.EMAIL_SERVICE_SECRET,
    },
    body: JSON.stringify({ type, to, data, org_id, delay }),
  });
  return response.json();
};

// Immediate send
await sendEmail({
  type: 'SECURITY_ALERT',
  to: 'user@example.com',
  data: { userName: 'Alice', alertTitle: 'Password Changed', alertMessage: 'Your password was updated.' },
});

// Delayed send (1 hour)
await sendEmail({
  type: 'ORGANIZATION_INVITATION',
  to: 'user@acme.com',
  org_id: 'org-uuid-here',
  delay: 3600000,
  data: { inviterName: 'Bob', organizationName: 'Acme', role: 'member', invitationLink: 'https://app.com/join' },
});
```
