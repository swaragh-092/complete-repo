# SSO Client CLI - API Usage Documentation

This document lists the APIs used by the `sso-cli-tools` to communicate with the Auth Service.

## Base URL
All requests are made to the Auth Service URL configured in `sso-client.config.json` (usually `https://auth.local.test`).

---

## 1. Register Client Request
**Endpoint:** `POST /auth/client-requests`

**Use:** Submits a new client registration request. This does not create the client immediately but creates a "pending" request that must be approved by an admin.

**Request Body:**
```json
{
  "name": "My New App",
  "clientKey": "my-new-app",
  "redirectUrl": "https://my-new-app.local.test",
  "description": "App description",
  "developerEmail": "dev@example.com",
  "developerName": "John Doe",
  "framework": "React",
  "purpose": "Testing",
  "requiresOrganization": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Client registration request submitted successfully",
  "data": {
    "message": "Client registration request submitted successfully",
    "request": {
      "id": "req_12345",
      "clientKey": "my-new-app",
      "status": "pending",
      "requestedAt": "2024-01-28T10:00:00Z"
    }
  }
}
```

---

## 2. Check Request Status
**Endpoint:** `GET /auth/client-requests/:clientKey/status`

**Use:** Polled by the CLI during the `init` process to check if the admin has approved the request.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "request": {
      "id": "req_12345",
      "client_key": "my-new-app",
      "status": "approved", // or 'pending', 'rejected'
      "requested_at": "...",
      "approved_at": "..."
    }
  }
}
```

---

## 3. Get Public Client Configuration
**Endpoint:** `GET /auth/clients/:clientKey/config`

**Use:** Fetches the public configuration for a client (e.g., Client ID, Realm, Auth URLs) to generate the `authConfig.js` file for the frontend.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "clientId": "my-new-app",
    "realm": "my-projects",
    "authBaseUrl": "https://auth.local.test",
    "authUrl": "https://keycloak.local.test:8443",
    "apiUrl": "https://auth.local.test/api/admin",
    "redirectUri": "https://my-new-app.local.test/callback"
  }
}
```

---

## 4. Health Check
**Endpoint:** `GET /health`

**Use:** detailed health check to verify Auth Service and Database connectivity.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-28T10:00:00Z"
}
```

## Error Handling
All APIs follow a standard error response format:

**Response (Error):**
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```
