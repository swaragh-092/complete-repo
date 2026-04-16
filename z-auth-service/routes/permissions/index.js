/**
 * routes/permissions/index.js - Permissions Domain Router
 * 
 * Aggregates all RBAC (Role-Based Access Control) routes:
 * - Permissions: Permission CRUD operations
 * - DB Roles: Database role CRUD operations (separate from Keycloak roles)
 * 
 * Mount points:
 * - /permissions (Permission CRUD)
 * - /db-roles (Database Role CRUD)
 */

const permissionsRouter = require('./permissions.routes');
const dbRolesRouter = require('./db-roles.routes');

// Export individual routers for flexible mounting
module.exports = {
    permissions: permissionsRouter,
    dbRoles: dbRolesRouter
};
