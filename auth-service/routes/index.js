/**
 * routes/index.js - Central Router Entry Point
 * 
 * ALL routes are mounted under the /auth prefix.
 * This is the single entry point for all route definitions.
 * 
 * URL Pattern: https://auth.local.test/auth/...
 * 
 * Domain Groups:
 * - /auth/login, /auth/callback, /auth/logout, /auth/refresh  → Core auth flows
 * - /auth/account/...       → User account management (profile, sessions, security)
 * - /auth/admin/...         → Keycloak Admin API (realms, clients, users)
 * - /auth/organizations/... → Organization CRUD, memberships, settings, requests
 * - /auth/workspaces/...    → Workspace management
 * - /auth/permissions/...   → RBAC (permissions, db-roles)
 * - /auth/roles/...         → Keycloak roles
 * - /auth/clients/...       → Client management + registration
 * - /auth/audit/...         → Audit logging
 * - /auth/trusted-devices/... → Trusted device management
 * - /auth/authz/...         → Enterprise Authorization (policies, relationships)
 * - /auth/internal/...      → Internal service APIs
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// Domain Router Imports
// ============================================================================

const authRouter = require('./auth');
const adminRouter = require('./admin');
const permissionsRouter = require('./permissions');
const clientsRouter = require('./clients');
const auditRouter = require('./audit');
const authorizationManagementRouter = require('../modules/authorization/routes/management.routes');
const organizationModule = require('../modules/organization');
const orgRolesRouter = require('./roles');

// ============================================================================
// Mount All Routes Under /auth
// ============================================================================

// --- Core Auth (login, callback, logout, refresh, client-requests) ---
router.use('/auth', clientsRouter);
router.use('/auth', authRouter);

// --- Admin API (Keycloak Admin operations) ---
router.use('/auth/admin', adminRouter);

// --- Organizations ---
router.use('/auth/organizations', organizationModule.crud);
router.use('/auth/organization-memberships', organizationModule.memberships);
router.use('/auth/org-onboarding', organizationModule.onboarding);
router.use('/auth/organizations/settings', organizationModule.settings);
router.use('/auth/organizations/requests', organizationModule.requests);
router.use('/auth/organizations', organizationModule.requests); // For /:id/requests

// --- RBAC ---
router.use('/auth/roles', require('./admin/roles.routes'));
router.use('/auth/permissions', permissionsRouter.permissions);
router.use('/auth/db-roles', permissionsRouter.dbRoles);
router.use('/auth/org-roles', orgRolesRouter);

// --- Users, Clients, Realms ---
router.use('/auth/users', require('./admin/users.routes'));
router.use('/auth/clients', require('./admin/clients.routes'));
router.use('/auth/realms', require('./admin/realms.routes'));

// --- Workspaces ---
router.use('/auth/workspaces', organizationModule.workspaces);

// --- Security & Audit ---
router.use('/auth/trusted-devices', require('./trusted-devices.route'));
router.use('/auth/audit', auditRouter);

// --- Enterprise Authorization (policies, relationships) ---
router.use('/auth/authz', authorizationManagementRouter);

// --- Internal Service APIs ---
router.use('/auth/internal', require('./internal.routes'));

// --- Test routes (development only) ---
router.use('/auth/test-auth', require('./test-auth-routes'));

module.exports = router;
