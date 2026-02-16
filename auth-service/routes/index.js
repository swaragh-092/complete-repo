/**
 * routes/index.js - Central Router Entry Point
 * 
 * This file aggregates all domain routers and mounts them at their respective paths.
 * It serves as the single entry point for all route definitions.
 * 
 * IMPORTANT: All external URLs remain unchanged from the original implementation.
 * Only the internal code organization has been improved.
 * 
 * Domain Groups:
 * - auth: Core authentication (login, logout, callback, token refresh)
 * - account: User account management (sessions, 2FA, security settings)
 * - admin: Keycloak Admin API (realms, clients, users, roles)
 * - organizations: Organization CRUD, memberships, and onboarding
 * - permissions: Database RBAC (permissions and db-roles)
 * - clients: Client registration requests workflow
 * - audit: Audit logging and history
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// Domain Router Imports
// ============================================================================

// Auth domain - core authentication and account management
const authRouter = require('./auth');

// Admin domain - Keycloak Admin API operations
const adminRouter = require('./admin');

// Organizations domain - org CRUD, memberships, onboarding
const organizationsRouter = require('./organizations');

// Permissions domain - RBAC (permissions and database roles)
const permissionsRouter = require('./permissions');

// Clients domain - client registration requests
const clientsRouter = require('./clients');

// Audit domain - audit logging
const auditRouter = require('./audit');

// Authorization Module - Enterprise Authorization Management
const authorizationModule = require('../modules/authorization');
const authorizationManagementRouter = require('../modules/authorization/routes/management.routes');

// ============================================================================
// Mount Domain Routers
// IMPORTANT: External URLs remain unchanged
// ============================================================================

// Client registration routes (mounted first to prevent shadowing by authRouter)
router.use('/auth', clientsRouter);

// Auth routes: /auth/*
router.use('/auth', authRouter);

// Admin API routes: /api/admin/*
router.use('/api/admin', adminRouter);

// Realms routes: /realms/* (backward compatibility - duplicate mount)
// NOTE: Realms are also accessible via /api/admin/realms
router.use('/realms', require('./admin/realms.routes'));

// Roles routes: /roles/* (backward compatibility)
router.use('/roles', require('./admin/roles.routes'));
router.use('/auth/roles', require('./admin/roles.routes')); // For auth-client compatibility

// Users routes: /users/* (backward compatibility)
router.use('/users', require('./admin/users.routes'));

// Clients routes: /clients/* (backward compatibility for admin client routes)
// Note: Client registration requests are mounted separately
router.use('/clients', require('./admin/clients.routes'));

// Organization routes
router.use('/auth/organizations', organizationsRouter.crud);
router.use('/organizations', organizationsRouter.crud); // Frontend compatibility
router.use('/organization-memberships', organizationsRouter.memberships);
router.use('/org-onboarding', organizationsRouter.onboarding);
router.use('/auth/org-onboarding', organizationsRouter.onboarding); // For auth-client compatibility

// Permissions routes
router.use('/permissions', permissionsRouter.permissions);
router.use('/auth/permissions', permissionsRouter.permissions); // For auth-client compatibility
router.use('/db-roles', permissionsRouter.dbRoles);
router.use('/auth/db-roles', permissionsRouter.dbRoles); // For auth-client compatibility

// Client registration routes (different from admin client routes)
router.use('/auth', clientsRouter);

// Audit routes
router.use('/auth/audit', auditRouter);

// Authorization Management API (Enterprise)
// Exposed under /api/v1/authz for policy and relationship management
// Protected by RBAC (policy:read, etc.) within the routes themselves
router.use('/api/v1/authz', authorizationManagementRouter);

// RBAC Org-Scoped Roles API (custom roles per organization)
const orgRolesRouter = require('./roles');
router.use('/api/org-roles', orgRolesRouter);
router.use('/auth/api/org-roles', orgRolesRouter); // For auth-client compatibility

// Trusted devices routes
router.use('/auth/trusted-devices', require('./trusted-devices.route'));

// Workspace routes
router.use('/auth/workspaces', require('./workspaces.routes')); // For auth-client compatibility
router.use('/workspaces', require('./workspaces.routes')); // For auth-ui compatibility

// Test auth routes (development only)
router.use('/test-auth', require('./test-auth-routes'));



module.exports = router;
