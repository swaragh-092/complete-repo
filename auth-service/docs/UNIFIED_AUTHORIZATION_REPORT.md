# Unified Enterprise Authorization Module (RBAC/ABAC/ReBAC) - A to Z Report

## 1. Executive Summary

The **Unified Enterprise Authorization Module** is a robust, clean-architecture solution responsible for handling all access control decisions within the platform. It replaces legacy ad-hoc checks with a centralized, modular engine that supports three major authorization paradigms:

*   **RBAC (Role-Based Access Control)**: Traditional role/permission assignments (e.g., "Admin", "User").
*   **ABAC (Attribute-Based Access Control)**: Dynamic policies based on attributes of the user, resource, and environment (e.g., "Allow access if user is in 'IT' department AND resource is classified 'internal'").
*   **ReBAC (Relationship-Based Access Control)**: Access based on relationships between entities (e.g., "User is the 'owner' of this resource").

This module is designed to be "enterprise-grade", featuring dynamic runtime updates (no code deploys needed for policy changes), detailed auditing, and high scalability.

---

## 2. Architecture

The module is isolated within `auth-service/modules/authorization` and exposes a single facade service for use by the rest of the application.

### 2.1 Core Components

*   **`AuthorizationService` (`engine/access-control.js`)**: The main entry point. It orchestrates checks across different engines. It can enforce "ANY" (allow if any method allows) or "ALL" (require all methods to allow) logic.
*   **`PolicyEngine` (`engine/policy-engine.js`)**: The ABAC engine. It fetches active policies from the database and evaluates them against the current context (User, Resource, Environment).
*   **`RelationshipGraph` (`engine/relationship-graph.js`)**: The ReBAC engine. It queries the `relationships` table to traverse graphs of ownership and association.
*   **Middleware (`middleware/index.js`)**: Express middleware that integrates the service into the HTTP request lifecycle, automatically handling 403 Forbidden responses.

### 2.2 Logic Flow (`checkAccess`)

When a request is made (e.g., `POST /api/documents/123/edit`):

1.  **Context Building**: The systems gathers:
    *   **User**: Attributes (ID, roles, department, etc.).
    *   **Resource**: Type (`document`), ID (`123`), and attributes (fetched dynamically).
    *   **Action**: `edit`.
    *   **Environment**: IP address, time of day.
2.  **RBAC Check**:
    *   Does the user have the `document:edit` permission directly?
    *   Does the user have a Role (e.g., `Editor`) that has `document:edit`?
    *   (If Organization Scoped) Does the user have this role *within* the specific Organization?
3.  **ABAC Check**:
    *   The `PolicyEngine` finds all "active" policies matching relevance logic.
    *   It evaluates conditions (e.g., `resource.classification == 'confidential'`).
    *   It returns `allow` or `deny` based on the highest priority policy.
4.  **ReBAC Check**:
    *   Is the user the `owner` of Document 123?
    *   Is there a `can_edit` relationship?
5.  **Decision**:
    *   By default, if **any** engine returns `allowed=true`, access is granted (OR logic).
    *   If `requireAll=true` is set, **all** enabled engines must return `allowed=true`.

---

## 3. Database Schema

The implementation utilizes a relational database (PostgreSQL) with Sequelize ORM.

### 3.1 Core Models

#### `Policy` (ABAC)
Stores dynamic access rules.
*   `name`: Human-readable identifier.
*   `effect`: `allow` or `deny`.
*   `conditions`: JSONB object defining logic (e.g., `{"subject.department": {"$eq": "IT"}}`).
*   `resources`: JSONB array of patterns (e.g., `["document:*"]`).
*   `priority`: Integer (higher wins).
*   `is_system`: Boolean (prevents accidental deletion of core policies).
*   `scope`: `org_id` or `client_id` for multi-tenancy.

#### `Relationship` (ReBAC)
Stores graph edges between entities.
*   `source_type` / `source_id`: The "Subject" (e.g., User:123).
*   `relation_type`: The edge name (e.g., `owner`, `member`, `manager`).
*   `target_type` / `target_id`: The "Object" (e.g., Project:456).
*   `org_id`: Scope.

#### `ResourceAttribute` (ABAC Helper)
Stores metadata about resources to support ABAC decisions without querying external services during auth.
*   `resource_type` / `resource_id`.
*   `attributes`: JSONB (e.g., `{"classification": "top-secret", "status": "draft"}`).

### 3.2 Legacy/Base Models (RBAC)
*   `Roles`: Standard roles.
*   `Permissions`: atomic action permissions.
*   `RolePermission`: Many-to-many link.
*   `OrganizationMembership`: Links Users to Organizations with a specific Role.

---

## 4. API Reference (Management)

The module exposes valid REST endpoints to manage the rules at runtime.

**Base Path**: `/authorization` (Requires Authentication & Admin Permissions)

### 4.1 Policy Management
*   `GET /policies`: List paginated policies.
*   `POST /policies`: Create a new dynamic policy.
*   `GET /policies/:id`: View details.
*   `PUT /policies/:id`: Update logic.
*   `DELETE /policies/:id`: Archive/Delete.
*   `POST /policies/:id/test`: "Dry run" a policy against a mock context to verify logic.

### 4.2 Relationship Management
*   `GET /relationships`: View the graph.
*   `POST /relationships`: Create a edge (e.g., make User A owner of Resource B).
*   `DELETE /relationships/:id`: Remove edge.
*   `GET /relationships/check`: Quick API to test if a relationship exists.

### 4.3 Runtime Checks
*   `POST /check`: Perform a full Authorization check (RBAC+ABAC+ReBAC) via API. Useful for other microservices calling `auth-service` for decisions.
*   `POST /check-batch`: Check multiple permissions in one request (e.g., filtering a list of buttons in UI).

---

## 5. Integration Guide

### 5.1 Using Middleware (Express)
For endpoints within `auth-service` (or services sharing the module):

```javascript
const { authorize } = require('./modules/authorization/middleware');

// Simple usage (infers action from method, resource from URL)
router.get('/:id', authorize(), controller.get);

// Specific RBAC permission
router.post('/', authorize({ action: 'create', resourceType: 'project' }), controller.create);

// Complex ReBAC requirement (User must be owner)
router.delete('/:id', authorize({ 
    skipRBAC: true, 
    skipABAC: true,
    // Logic inside ReBAC engine will check for 'owner' relationship
}), controller.delete);
```

### 5.2 Programmatic Usage
Inside services or business logic:

```javascript
const AuthorizationService = require('./modules/authorization/engine/access-control');

const result = await AuthorizationService.checkAccess({
    user: currentUser,
    action: 'publish',
    resource: { type: 'article', id: '123' }
});

if (!result.allowed) {
    throw new Error(result.reason);
}
```

---

## 6. Future Improvements (Roadmap)

*   **Caching**: Implement Redis caching for Policy evaluation and Role lookups to reduce DB load (-10ms latency).
*   **Audit Logging**: Detailed capture of *why* access was denied (which policy failed) is partially implemented but could be expanded to a dedicated audit log table.
*   **UI Editor**: A visual "Policy Builder" in the frontend to generate the JSONB conditions without writing JSON manually.
