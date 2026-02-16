# 📧 Email Service

Enterprise-grade microservice for sending transactional emails. Part of the SSO stack.

## 🚀 Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your SMTP credentials

# 3. Start server
npm run dev

# 4. Test health endpoint
curl http://localhost:4011/health
```

### Docker

```bash
# Build and run
docker build -t email-service .
docker run -p 4011:4011 --env-file .env email-service
```

---

## 📡 API Reference

**Base URL:** `http://localhost:4011`

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "service": "email-service",
    "uptime": 123.456
  }
}
```

---

### Send Email

```http
POST /api/v1/email/send
```

**Headers:**
| Header             | Required | Description                   |
| :----------------- | :------: | :---------------------------- |
| `Content-Type`     |    ✅     | `application/json`            |
| `x-service-secret` |    ✅     | Service authentication secret |

**Request Body:**
```json
{
  "type": "ORGANIZATION_INVITATION",
  "to": "user@example.com",
  "data": {
    "inviterName": "John Doe",
    "organizationName": "Acme Corp",
    "role": "admin",
    "invitationLink": "https://example.com/join?code=abc123",
    "expiresAt": "2026-02-16T12:00:00Z"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<unique-id@smtp.server>",
    "type": "ORGANIZATION_INVITATION",
    "to": "user@example.com"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized: Missing Service Secret",
  "error": { "code": "UNAUTHORIZED" }
}
```

---

### Get Email Types

```http
GET /api/v1/email/types
```

**Headers:**
| Header             | Required |
| :----------------- | :------: |
| `x-service-secret` |    ✅     |

**Response:**
```json
{
  "success": true,
  "data": {
    "types": [
      "CLIENT_REQUEST",
      "CLIENT_APPROVED",
      "CLIENT_REJECTED",
      "ORGANIZATION_INVITATION",
      "WORKSPACE_INVITATION",
      "ORGANIZATION_CREATED",
      "NEW_DEVICE_LOGIN",
      "HIGH_RISK_LOGIN",
      "SECURITY_ALERT"
    ]
  }
}
```

---

## 📝 Email Types & Required Data

| Type                      | Description                       | Required Fields                                                               |
| :------------------------ | :-------------------------------- | :---------------------------------------------------------------------------- |
| `CLIENT_REQUEST`          | API access request notification   | `adminName`, `clientName`, `developerEmail`, `description`                    |
| `CLIENT_APPROVED`         | Request approved with credentials | `developerName`, `clientName`, `clientId`, `clientSecret`                     |
| `CLIENT_REJECTED`         | Request rejected                  | `developerName`, `clientName`, `rejectionReason`                              |
| `ORGANIZATION_INVITATION` | Org invite                        | `inviterName`, `organizationName`, `role`, `invitationLink`, `expiresAt`      |
| `WORKSPACE_INVITATION`    | Workspace invite                  | `workspaceName`, `organizationName`, `inviterEmail`, `role`, `invitationLink` |
| `ORGANIZATION_CREATED`    | Welcome email                     | `userName`, `organizationName`, `dashboardLink`                               |
| `NEW_DEVICE_LOGIN`        | New device alert                  | `userName`, `device`, `ip`, `time`, `location`                                |
| `HIGH_RISK_LOGIN`         | Suspicious login                  | `userName`, `ip`, `time`, `location`                                          |
| `SECURITY_ALERT`          | General alert                     | `userName`, `alertTitle`, `alertMessage`                                      |

---

## ⚙️ Environment Variables

| Variable         | Required | Default         | Description                    |
| :--------------- | :------: | :-------------- | :----------------------------- |
| `NODE_ENV`       |          | `development`   | Environment mode               |
| `PORT`           |          | `4011`          | Server port                    |
| `SMTP_HOST`      |    ✅     |                 | SMTP server host               |
| `SMTP_PORT`      |          | `587`           | SMTP server port               |
| `SMTP_USER`      |    ✅     |                 | SMTP username                  |
| `SMTP_PASS`      |    ✅     |                 | SMTP password                  |
| `FROM_EMAIL`     |    ✅     |                 | Sender email address           |
| `APP_NAME`       |          | `Email Service` | Application name in emails     |
| `SERVICE_SECRET` |    ✅     |                 | Service-to-service auth secret |

---

## 🏗️ Project Structure

```
email-service/
├── src/
│   ├── config/          # Environment & constants
│   ├── middleware/      # Auth, error, logging
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── templates/       # Email templates
│   │   ├── components/  # Shared layouts & components
│   │   ├── index.js     # Template Registry
│   │   └── ...          # Template files
│   ├── utils/           # Logger, html-escaper, validator
│   └── server.js        # Entry point
├── Dockerfile
├── package.json
└── README.md
```

---

## 🔒 Security

- **Authentication**: All API endpoints require `x-service-secret` header
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Joi schema validation on all inputs
- **Helmet**: Security headers enabled
- **Non-root Docker**: Runs as `nodejs` user in container

---

## 👥 Integration Examples

### Node.js (fetch)

```javascript
const sendEmail = async ({ type, to, data }) => {
  const response = await fetch('http://email-service:4011/api/v1/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-service-secret': process.env.SERVICE_SECRET,
    },
    body: JSON.stringify({ type, to, data }),
  });
  return response.json();
};

// Usage
await sendEmail({
  type: 'SECURITY_ALERT',
  to: 'user@example.com',
  data: {
    userName: 'Alice',
    alertTitle: 'Password Changed',
    alertMessage: 'Your password was changed successfully.',
  },
});
```

### cURL

```bash
curl -X POST http://localhost:4011/api/v1/email/send \
  -H "Content-Type: application/json" \
  -H "x-service-secret: your-secret-here" \
  -d '{
    "type": "SECURITY_ALERT",
    "to": "user@example.com",
    "data": {
      "userName": "Alice",
      "alertTitle": "Test",
      "alertMessage": "Hello from Email Service!"
    }
  }'
```
