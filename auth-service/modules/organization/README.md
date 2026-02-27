# Organization Module Architecture

This module handles multi-tenant organizations, workspaces, memberships, and onboarding flows (invitations, provisioning) within the Auth Service. 

It is designed to cleanly separate the "Business Entity" (the Company/Organization) from the "Authentication Identity" (the User in Keycloak) by building a **Membership Bridge** between them.

## Core Concepts & API Relationships

### 1. The Onboarding Flow (`/api/org-onboarding`)
*This is where the story begins when a new company signs up for your SaaS.*
- **Functionality**: When John from "Acme Corp" signs up, he hits `POST /create`. The system creates a globally unique `tenant_id` for "Acme Corp", creates the `Organization` record, and automatically links John to this new organization with the **Owner** role.
- **Invitations**: John now needs his team. He hits `POST /invitations` to send emails containing unique verification codes/links to his coworkers.
- **Joining**: When his coworkers click the email link, they hit `POST /join` (or `POST /accept-pending` if they log in first). The system consumes their invitation token and drops them directly into Acme Corp.

### 2. The Organization Core (`/api/organizations`)
*This API manages the physical tenant data.*
- **Functionality**: Once Acme Corp exists, this API allows John to manage the business entity itself. He can `PUT /:id` to change the company name or configure global settings like `client_key`.
- **Global Visibility**: SuperAdmins can use `GET /organizations` to see a list of *every single company* registered on the platform for billing or analytics.

### 3. The Memberships Link (`/api/organization-memberships`)
*This API represents the "Bridge" connecting a physical User to a physical Organization.*
- **Functionality**: Since one person could potentially belong to multiple companies (e.g., an external consultant), their identity isn't hardcoded to Acme Corp. Instead, a `Membership` record is created linking `User A` to `Organization B` with `Role C` (like Admin, Member, View-Only).
- **Day-to-day Management**: If John wants to promote a coworker from "Member" to "Admin", the frontend calls `PUT /organization-memberships/:id` to elevate their role in the database.
- **Leaving**: If a member quits the company, John hits `DELETE /organization-memberships/:id` to revoke all their access to Acme Corp without deleting their actual User Profile (since they still need their account to log into auth-service).

### 4. Workspaces (Sub-Divisions) (`/api/workspaces`)
*This API breaks down large Organizations into smaller logical groups.*
- **Functionality**: Acme Corp has 500 employees. John doesn't want the Marketing Team seeing the Engineering Team's data.
- **Relationship**: He uses `POST /workspaces` to create two generic containers inside Acme Corp. Using `POST /workspaces/:id/members`, he cherry-picks users from the sprawling `OrganizationMembership` pool and assigns them explicitly to the "Marketing Workspace". 
- **Security Check**: The API validates that you cannot invite someone into a Workspace unless they already have an overarching `OrganizationMembership` in that parent company.

---

## Technical Setup & Endpoints

All routes below require a valid `Bearer Token` for authentication. Depending on the frontend consumer, routes may optionally be prefixed with `/api` or `/auth`.

### 🏢 1. Organizations API
* **`GET /`** - List all organizations (with pagination and filters).
* **`GET /:id`** - Get details for a specific organization.
* **`POST /`** - Manually create a new organization.
* **`PUT /:id`** - Update organization details (requires SuperAdmin).
* **`DELETE /:id`** - Delete an organization (requires SuperAdmin).
* **`GET /:id/members`** - Get all members belonging to an organization.
* **`GET /stats/overview`** - Get statistical overview of organizations.
* **`GET /my/organizations`** - Get a list of organizations the currently authenticated user belongs to.

### 🚀 2. Onboarding API
* **`POST /create`** - Create a completely new organization (tenant) and become its Owner automatically.
* **`POST /join`** - Join an organization using a specific invitation code/token.
* **`POST /accept-pending`** - Automatically accept any pre-existing email invitations for the logged-in user.
* **`GET /invitations`** - View all pending invitations for your organization.
* **`POST /invitations`** - Send an invitation email to add a new colleague to your organization.
* **`DELETE /invitations/:id`** - Revoke a pending invitation (Owner/Admin/SuperAdmin only).
* **`POST /admin/provision`** - (SuperAdmin only) Provision a new client organization on their behalf.

### 👥 3. Memberships API
* **`GET /`** - List all memberships system-wide (Admin/SuperAdmin).
* **`GET /:id`** - Get the details of a specific membership record.
* **`POST /`** - Manually create a membership (bypass invitation flow).
* **`PUT /:id`** - Update a user's role within an organization.
* **`DELETE /:id`** - Remove a user from an organization completely.
* **`POST /bulk-assign`** - Add multiple users reading from an array to an organization at once.
* **`GET /user/:userId`** - Fetch all memberships specifically tied to a target user.
* **`GET /stats/overview`** - View membership distribution statistics.

### 🗂️ 4. Workspaces API
* **`GET /`** - List all workspaces in the current context.
* **`POST /`** - Create a new workspace.
* **`GET /:id`** - Get details for a specific workspace.
* **`PUT /:id`** - Update workspace details.
* **`DELETE /:id`** - Delete a workspace.
* **`GET /:id/members`** - List all members within a workspace.
* **`POST /:id/members`** - Add an existing organization user into the workspace.
* **`PUT /:id/members/:userId`** - Update a user's role within this specific workspace.
* **`DELETE /:id/members/:userId`** - Remove a user from the workspace.
* **`POST /:id/invitations`** - Invite a user explicitly into a workspace.
* **`GET /:id/invitations`** - View pending invitations to this workspace.
* **`DELETE /:id/invitations/:invitationId`** - Revoke/Cancel an invitation.
* **`GET /invitations/preview`** - Preview details of a workspace invitation before accepting.
* **`POST /invitations/accept`** - Accept the workspace invitation and join.

## Database Entity Relationships (ERD)

The Organization module relies on a relational model linking Users to Tenants via join tables. 

### Core Models

* **`Organization`**: The root tenant entity representing a Company.
* **`UserMetadata`**: Represents the physical person (mirrored from Keycloak).
* **`Role`**: Represents global definitions of permissions (e.g., SuperAdmin, OrgAdmin, Member).

### The Join Tables (The "Glue")

#### `OrganizationMembership`
This table links a `User` to an `Organization` and assigns them a `Role`.
* **Foreign Keys**: `org_id` -> `Organization.id`, `user_id` -> `UserMetadata.id`, `role_id` -> `Role.id`
* **Rule**: A user can have many OrganizationMemberships, but only *one per specific Organization*.

#### `Workspace`
This table represents a sub-grouping owned by an Organization (e.g., "Engineering Team").
* **Foreign Keys**: `org_id` -> `Organization.id`, `created_by` -> `UserMetadata.id`
* **Rule**: An Organization `hasMany` Workspaces. A Workspace belongs to exactly one Organization.

#### `WorkspaceMembership`
This table links a `User` directly to a specific `Workspace`, independent of their overarching Organization role.
* **Foreign Keys**: `workspace_id` -> `Workspace.id`, `user_id` -> `UserMetadata.id`
* **Rule**: You cannot be a member of a Workspace unless you hold a valid `OrganizationMembership` for its parent Organization. Workspace roles (`viewer`, `editor`, `admin`) are strictly isolated to the Workspace scope and do not elevate your parent Organization role.

#### `Invitation` & `WorkspaceInvitation`
These tables store pending invites explicitly sent to email addresses.
* **Foreign Keys**: `org_id` / `workspace_id` -> Parent ID, `invited_by` -> `UserMetadata.id`, `role_id` -> `Role.id`
* **Status Lifecycle**: `pending` → `accepted` | `expired` | `revoked`
* **`email_status`**: Tracks async email delivery — `sending` (default) → `delivered` | `failed`
* **Rule**: Once an Invitation token is consumed via `/accept-pending` or `/join`, it is marked as `accepted` and converted into a permanent `OrganizationMembership` or `WorkspaceMembership` record. Pending invitations can be revoked via `DELETE /invitations/:id`.

---

## Validation

All request payload validation is centralized using Joi schemas to ensure consistent data structures and error handling. 
The schemas are exported from the `validators/index.js` module. By centralizing the validations, the route controllers remain clean and focused on business logic instead of payload inspection.

**Design Note**: All validation blocks use `.validate(req.body || {})` explicitly to prevent Node.js destructuring crashes (`Cannot destructure property 'name' of 'value' as it is undefined`) when clients send empty or structurally invalid payloads.

---

## Configuration

### Client Cache TTL

`loadClients()` caches the DB-loaded client registry in memory with a configurable TTL to avoid a database query on every request.

| Env Variable          | Default          | Description                                       |
| --------------------- | ---------------- | ------------------------------------------------- |
| `CLIENT_CACHE_TTL_MS` | `300000` (5 min) | Time-to-live for the client cache in milliseconds |

To manually bust the cache (e.g., after adding a new client via admin), call `invalidateClientCache()` from `config/index.js`.

