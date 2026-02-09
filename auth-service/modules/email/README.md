# 📧 Email Service Module

This module provides a centralized, component-based email system for the Auth Service. It supports both internal usage (direct import) and external usage via a secured HTTP API (for microservices like PMS).

## 🚀 Features

- **Modular Architecture**: Isolated logic in `modules/email`.
- **Component-Based Templates**: Reusable UI components (`Button`, `InfoBox`, etc.) using functional composition.
- **Internal API**: `POST /api/internal/email/send` secured with a `SERVICE_SECRET`.
- **Type-Safe**: Centralized registry of email types.
- **Zero-Dependency Templates**: Pure JavaScript template literals (fast and lightweight).

---

## ⚙️ Configuration

Ensure the following environment variables are set in your `.env` file:

| Variable         | Description                   | Example               |
| :--------------- | :---------------------------- | :-------------------- |
| `SMTP_HOST`      | SMTP Server Host              | `smtp.example.com`    |
| `SMTP_PORT`      | SMTP Server Port              | `587`                 |
| `SMTP_USER`      | SMTP Username                 | `user@example.com`    |
| `SMTP_PASS`      | SMTP Password                 | `secure-password`     |
| `FROM_EMAIL`     | Sender Email Address          | `no-reply@myapp.com`  |
| `APP_NAME`       | Application Name              | `My App`              |
| `SERVICE_SECRET` | **Required** for Internal API | `7f32af7f747bfd98...` |

---

## 📦 Usage

### 1. Internal Usage (Verification/Auth Service)

Import the module directly within `auth-service`:

```javascript
const emailModule = require('./modules/email');

await emailModule.send({
    type: emailModule.EMAIL_TYPES.SECURITY_ALERT,
    to: 'user@example.com',
    data: {
        userName: 'Alice',
        alertTitle: 'New Login',
        alertMessage: 'We detected a login from a new device.'
    }
});
```

### 2. External Usage (PMS / Other Microservices)

Make a POST request to the internal API endpoint.

- **Endpoint**: `POST /api/internal/email/send`
- **Headers**:
    - `Content-Type: application/json`
    - `x-service-secret: <YOUR_SERVICE_SECRET>`

**Example Request (curl):**

```bash
curl -X POST https://auth-service.local/api/internal/email/send \
  -H "Content-Type: application/json" \
  -H "x-service-secret: YOUR_SECRET_HERE" \
  -d '{
    "type": "ORGANIZATION_INVITATION",
    "to": "new-user@example.com",
    "data": {
        "workspaceName": "Engineering",
        "invitationLink": "https://myapp.com/join?code=123"
    }
  }'
```

---

## 📝 Available Templates

All templates are located in `modules/email/templates/`.

| Type                      | Description                                          | Required Data                                                                 |
| :------------------------ | :--------------------------------------------------- | :---------------------------------------------------------------------------- |
| `CLIENT_REQUEST`          | Sent to admins when a developer requests API access. | `adminName`, `clientName`, `developerEmail`, `description`                    |
| `CLIENT_APPROVED`         | Sent to developer when request is approved.          | `developerName`, `clientName`, `clientId`, `clientSecret`                     |
| `CLIENT_REJECTED`         | Sent to developer when request is rejected.          | `developerName`, `clientName`, `rejectionReason`                              |
| `ORGANIZATION_INVITATION` | Invite a user to an organization.                    | `inviterName`, `organizationName`, `role`, `invitationLink`, `expiresAt`      |
| `WORKSPACE_INVITATION`    | Invite a user to a workspace.                        | `workspaceName`, `organizationName`, `inviterEmail`, `role`, `invitationLink` |
| `ORGANIZATION_CREATED`    | Welcome email for new organization creation.         | `userName`, `organizationName`, `dashboardLink`                               |
| `NEW_DEVICE_LOGIN`        | Alert for login from a new device/IP.                | `userName`, `device`, `ip`, `time`, `location`                                |
| `HIGH_RISK_LOGIN`         | Critical alert for suspicious login attempts.        | `userName`, `ip`, `time`, `location`                                          |
| `SECURITY_ALERT`          | General security notification.                       | `userName`, `alertTitle`, `alertMessage`                                      |

---

## 🛠️ Development

### Adding a New Template

1.  **Create Template File**:
    Create `modules/email/templates/my-new-template.js`:
    ```javascript
    const layout = require('./_layout');
    const { Button } = require('./_components');

    module.exports = (data) => {
        const content = `
            <h3>Hello ${data.name}!</h3>
            <p>This is a new email type.</p>
            ${Button({ label: 'Click Me', url: data.link })}
        `;
        return layout({ title: 'My New Email', content });
    };
    ```

2.  **Register Template**:
    Add it to `modules/email/templates/index.js`:
    ```javascript
    const myNewTemplate = require('./my-new-template');

    // ... inside TEMPLATES object
    MY_NEW_TYPE: {
        subject: 'My New Subject',
        render: myNewTemplate
    }
    ```

3.  **Export Type**:
    Add the key to `EMAIL_TYPES` in `modules/email/index.js`.

---

## 🔍 Verification

Run the verification script to check your configuration:

```bash
# Verify internal API
node verify_internal_api.js
```
