# Auth Service API Reference

This document provides a comprehensive reference for the backend APIs provided by the `auth-service`. These APIs are used by the Auth UI, Centralized Login, and third-party apps.

## 1. User Account & Profile
**Base Path:** `/api/account`

### Get User Profile
**Endpoint:** `GET /profile`
**Description:** Retrieves full profile combining Keycloak identity and local database metadata.
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "metadata": {
      "designation": "Developer",
      "department": "Engineering",
      "primary_organization": { "id": "...", "name": "..." }
    },
    "authorization": {
      "roles": ["admin", "developer"],
      "permissions": ["org:read", "org:write"]
    }
  }
}
```

### Update User Profile
**Endpoint:** `PUT /profile`
**Description:** Updates both Keycloak attributes and local database metadata.
**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "designation": "Senior Developer",
  "mobile": "+1234567890"
}
```

### Get User Organizations
**Endpoint:** `GET /organizations`
**Description:** List all organizations the current user is a member of.
**Response:**
```json
{
  "success": true,
  "data": {
    "primary_organization": { ... },
    "memberships": [
      {
        "organization": { "id": "org-1", "name": "Acme Corp" },
        "role": { "name": "Owner", "permissions": [...] }
      }
    ]
  }
}
```

---

## 2. Organization Management
**Base Path:** `/api/organizations`

### List Organizations
**Endpoint:** `GET /`
**Description:** Get all organizations (filtered by tenant_id if provided).
**Response:** `[{ "id": "...", "name": "...", "member_count": 5 }]`

### Get Organization Details
**Endpoint:** `GET /:id`
**Description:** Get detailed info including members and stats.

### Create Organization
**Endpoint:** `POST /`
**Body:**
```json
{
  "name": "My New Startup",
  "description": "Tech company"
}
```
**Response:** Created organization object. User becomes "Owner".

### Update Organization
**Endpoint:** `PUT /:id`
**Body:** `{ "name": "New Name" }`

### Delete Organization
**Endpoint:** `DELETE /:id`
**Note:** Only allowed if org has no other members.

---

## 3. Organization Memberships
**Base Path:** `/api/organization-memberships`

### List Memberships
**Endpoint:** `GET /`
**Filters:** `?user_id=...&org_id=...&role_id=...`

### Add Member
**Endpoint:** `POST /`
**Body:**
```json
{
  "user_id": "target-user-uuid",
  "org_id": "org-uuid",
  "role_id": "role-uuid"
}
```

### Update Member Role
**Endpoint:** `PUT /:id`
**Body:** `{ "role_id": "new-role-uuid" }`

### Remove Member
**Endpoint:** `DELETE /:id`

---

## 4. Client Management (App Registration)
**Base Path:** `/api/clients`

### Get Clients
**Endpoint:** `GET /`

### Get Client Details
**Endpoint:** `GET /:id`

### Create Client (Admin Only)
**Endpoint:** `POST /`
**Body:** `{ "clientId": "app-key", "redirectUris": [...] }`

---

## Authentication
All endpoints require a valid Bearer Token from Keycloak.
Header: `Authorization: Bearer <access_token>`
