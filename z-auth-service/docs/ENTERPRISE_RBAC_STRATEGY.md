# Enterprise Role & Permission Management: A-Z Strategy Guide

## 1. Introduction
This guide provides a comprehensive strategy for defining, creating, and managing Roles and Permissions at an "Enterprise Level". It addresses critical requirements for **Multi-Tenancy**, **Multi-App Environments**, and **Explicit Scoping**.

---

## 2. Core Philosophy: The "3-Scope" Model

In a complex enterprise system, every Role and Permission must be evaluated against three distinct scopes.

### 2.1 The 3 Scopes
1.  **Global Scope (System)**: Applies everywhere. (e.g., `Super Admin`).
2.  **Organization Scope**: Applies only within a specific Tenant/Organization context. (e.g., `Org Owner`, `HR Manager`).
3.  **Application / Client Scope (CRITICAL)**: Applies only to a specific Frontend Application or Client. (e.g., `Mobile App Viewer` vs `Admin Portal Editor`).

### 2.2 Schema Strategy for Multi-App Visibility
To ensure App A doesn't see App B's roles, we must move beyond flat roles.

**Recommended Schema Enhancement**:
Add `client_id` (nullable) to the `Roles` table.

| Role Name       | Client ID     | Org ID | Visibility                                                       |
| :-------------- | :------------ | :----- | :--------------------------------------------------------------- |
| `super_admin`   | `NULL`        | `NULL` | **Global**: Visible everywhere.                                  |
| `org_owner`     | `NULL`        | `NULL` | **Organization Generic**: Available to be assigned in *any* Org. |
| `mobile_viewer` | `auth-mobile` | `NULL` | **App Specific**: Only visible when querying for Mobile App.     |
| `portal_admin`  | `web-portal`  | `NULL` | **App Specific**: Only visible in Web Portal.                    |

> [!IMPORTANT]
> **Roles with `org_id = NULL` act as templates.** They must be instantiated per Organization before assignment (via `OrganizationMembership`). A user is never assigned a "raw" template role; they are assigned a role *within the context of an Org*.

*   **API Impact**: `GET /roles?client_id=auth-mobile` returns only Global + Mobile roles.
*   **Security**: Prevents leakage of admin portal roles into customer-facing mobile apps.

---

## 3. Location of Truth: Keycloak vs. Auth-Service

Where do roles live? This is a common point of confusion.

| Component                        | Responsibility                       | What it Stores                                                                 |
| :------------------------------- | :----------------------------------- | :----------------------------------------------------------------------------- |
| **Keycloak (Identity Provider)** | **Authentication (Who are you?)**    | Identities, MFA, Coarse Groups. *Avoid storing fine-grained permissions here.* |
| **Auth-Service (Authorization)** | **Authorization (What can you do?)** | Fine-grained Permissions (`invoice:create`), Application Roles, Policy Logic.  |

### The "Token Exchange" Pattern
1.  **Keycloak** issues an ID Token saying: "This is User 123".
2.  **Auth-Service** receives the token and looks up: "User 123 has Role 'Editor' in 'Org A'".
3.  **Result**: The app receives the granular permissions (`["article:edit", "article:publish"]`) from Auth-Service, not Keycloak.

---

## 4. Workflows & Naming

### 4.1 Permission Naming (Client:Resource:Action)

> [!IMPORTANT]
> **Permission names MUST include the client prefix** to prevent cross-app access.

**Format**: `<client_id>:<resource>:<action>`

| Permission                  | Client        | Resource  | Action   |
| :-------------------------- | :------------ | :-------- | :------- |
| `web-portal:invoice:create` | `web-portal`  | `invoice` | `create` |
| `auth-mobile:profile:read`  | `auth-mobile` | `profile` | `read`   |
| `*:user:read`               | `*` (Any)     | `user`    | `read`   |

*   A permission with `*` as the client prefix is a **global permission** valid for all apps.
*   This prevents `auth-mobile` from accessing `web-portal:admin:manage`.

### 4.2 Role Naming & Hierarchy
Roles are aggregations of permissions.

**Global Roles**:
*   `super_admin`: `*:*`

**Organization Roles** (Explicit Scope):
*   `org_admin`: `user:create`, `org:update` (implicitly constrained to the target Org ID at runtime)

**Client-Specific Roles**:
*   `mobile_user`: `profile:read` (Role only exists for Mobile App client)

---

## 5. Runtime Enforcement Flow

How does the code verify access?

### The Flow Diagram (Mental Model)

1.  **Intercept**: Request hits `GET /api/invoices/123`.
2.  **Context**: Middleware extracts:
    *   **User**: `sub` from JWT.
    *   **Resource**: `invoice` (from URL).
    *   **Org Context**: `X-Org-Id` header (Explicit Scope).
    *   **Client Context**: `azp` or `client_id` from token.
3.  **Load Assignments**:
    *   Fetch `OrganizationMembership` for (User, Org).
    *   Get Role attached to Membership (e.g., `Billing Manager`).
4.  **Validate Scope**:
    *   Does `Billing Manager` role belong to this Client (or is it Global)? -> **YES**.
5.  **Check Permissions**:
    *   Does `Billing Manager` have `invoice:read`? -> **YES**.
6.  **Decision**: ALLOW.

### Code Logic (Abstract)
```javascript
function checkAccess(user, resource, action, context) {
  // 1. Get User's Role in this specific Org
  const membership = db.Membership.findOne({ userId: user.id, orgId: context.orgId });
  
  if (!membership) return DENY; // User not in Org

  const role = membership.Role;

  // 2. Client/App Scope Check (Visibility)
  if (role.clientId && role.clientId !== context.clientId) {
     return DENY; // Role is not valid for this application context
  }

  // 3. Permission Check (Client-Prefixed)
  const requiredPermission = `${context.clientId}:${resource}:${action}`;
  const globalPermission = `*:${resource}:${action}`;

  if (role.permissions.includes(requiredPermission) || role.permissions.includes(globalPermission)) {
     return ALLOW;
  }
  
  return DENY;
}
```

---

## 6. Implementation Checklist (A-Z)

1.  [ ] **Schema Upgrade**: Add `client_id` to `Roles` table to support Multi-App visibility.
2.  [ ] **Seed Data**: Update seeding scripts to categorize roles by Client.
3.  [ ] **API Interceptor**: Ensure all requests carry `X-Org-Id` for explicit Org scoping.
4.  [ ] **Middleware**: Update `authorize()` middleware to validate `client_id` against the Role's allowed client.
