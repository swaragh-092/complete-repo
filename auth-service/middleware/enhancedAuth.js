// middleware/enhancedAuth.js - Advanced Authorization Middleware

const logger = require('../utils/logger');

/* --------- ENHANCED AUTHORIZATION FUNCTIONS --------- */

/**
 * Require Application Access (Keycloak Roles)
 * Checks if user has access to a specific application
 */
function requireAppAccess(appName) {
    return (req, res, next) => {
        const requiredRole = `${appName}_user`;

        if (!req.user || !req.user.hasRole(requiredRole)) {
            logger.warn(`App access denied: ${req.user?.email} needs ${requiredRole}`, {
                userId: req.user?.id,
                requiredRole,
                userRoles: req.user?.roles
            });

            return res.status(403).json({
                error: 'Application Access Denied',
                message: `You don't have access to ${appName}. Contact your administrator.`,
                code: 'APP_ACCESS_DENIED',
                required_role: requiredRole
            });
        }

        logger.info(`App access granted: ${appName}`, {
            userId: req.user.id,
            email: req.user.email,
            app: appName
        });

        next();
    };
}

/**
 * Require Business Permission (Database Permissions)
 * Checks if user has specific business permission
 */
function requirePermission(permission, options = {}) {
    return (req, res, next) => {
        const { orgId = null, paramName = 'orgId' } = options;
        const targetOrgId = orgId || req.params[paramName] || req.body.org_id;

        if (!req.user || !req.user.hasPermission(permission, targetOrgId)) {
            logger.warn(`Permission denied: ${req.user?.email} needs ${permission}`, {
                userId: req.user?.id,
                permission,
                orgId: targetOrgId,
                userPermissions: req.user?.permissions
            });

            return res.status(403).json({
                error: 'Insufficient Permissions',
                message: `You need '${permission}' permission to perform this action.`,
                code: 'PERMISSION_DENIED',
                required_permission: permission,
                organization_id: targetOrgId
            });
        }

        logger.info(`Permission granted: ${permission}`, {
            userId: req.user.id,
            email: req.user.email,
            permission,
            orgId: targetOrgId
        });

        next();
    };
}

/**
 * Require Organization Role
 * Checks if user has specific role within an organization
 */
function requireOrganizationRole(role, options = {}) {
    return (req, res, next) => {
        const { paramName = 'orgId', allowGlobal = false } = options;
        const orgId = req.params[paramName] || req.body.org_id;

        if (!orgId) {
            return res.status(400).json({
                error: 'Missing Organization',
                message: 'Organization ID is required for this operation',
                code: 'MISSING_ORG_ID'
            });
        }

        // Check if user has role in specific organization
        const hasOrgRole = req.user.hasRole(role, orgId);

        // Optionally allow global roles (like superadmin)
        const hasGlobalRole = allowGlobal && req.user.hasAnyRole(['superadmin', 'super_admin', 'admin']);

        if (!req.user || (!hasOrgRole && !hasGlobalRole)) {
            logger.warn(`Organization role denied: ${req.user?.email} needs ${role} in org ${orgId}`, {
                userId: req.user?.id,
                role,
                orgId,
                userOrganizations: req.user?.organizations
            });

            return res.status(403).json({
                error: 'Organization Access Denied',
                message: `You need '${role}' role in this organization to perform this action.`,
                code: 'ORG_ROLE_DENIED',
                required_role: role,
                organization_id: orgId
            });
        }

        logger.info(`Organization role granted: ${role}`, {
            userId: req.user.id,
            email: req.user.email,
            role,
            orgId,
            grantedVia: hasGlobalRole ? 'global' : 'organization'
        });

        next();
    };
}

/**
 * Require Organization Access
 * Checks if user belongs to specific organization(s)
 */
function requireOrganizationAccess(options = {}) {
    return (req, res, next) => {
        const { paramName = 'orgId', multiple = false } = options;

        let orgIds;
        if (multiple) {
            // Handle multiple org IDs from body or query
            orgIds = req.body.org_ids || req.query.org_ids || [];
            if (typeof orgIds === 'string') orgIds = [orgIds];
        } else {
            // Single org ID from params or body
            const orgId = req.params[paramName] || req.body.org_id;
            orgIds = orgId ? [orgId] : [];
        }

        if (orgIds.length === 0) {
            return res.status(400).json({
                error: 'Missing Organization',
                message: 'Organization ID(s) required for this operation',
                code: 'MISSING_ORG_ID'
            });
        }

        // Check if user has access to all required organizations
        const hasAccess = orgIds.every(orgId => req.user.isInOrganization(orgId));

        if (!req.user || !hasAccess) {
            logger.warn(`Organization access denied: ${req.user?.email} to orgs ${orgIds.join(', ')}`, {
                userId: req.user?.id,
                requestedOrgs: orgIds,
                userOrganizations: req.user?.organizations?.map(o => o.id)
            });

            return res.status(403).json({
                error: 'Organization Access Denied',
                message: 'You don\'t have access to the required organization(s).',
                code: 'ORG_ACCESS_DENIED',
                required_organizations: orgIds
            });
        }

        // Add accessible orgs to request for use in route handler
        req.accessibleOrgs = orgIds;

        next();
    };
}

/**
 * Require Any Permission from List
 * Checks if user has at least one permission from the list
 */
function requireAnyPermission(permissions, options = {}) {
    return (req, res, next) => {
        const { orgId = null, paramName = 'orgId' } = options;
        const targetOrgId = orgId || req.params[paramName] || req.body.org_id;

        const hasAnyPermission = permissions.some(permission =>
            req.user.hasPermission(permission, targetOrgId)
        );

        if (!req.user || !hasAnyPermission) {
            logger.warn(`Any permission denied: ${req.user?.email} needs one of ${permissions.join(', ')}`, {
                userId: req.user?.id,
                requiredPermissions: permissions,
                userPermissions: req.user?.permissions,
                orgId: targetOrgId
            });

            return res.status(403).json({
                error: 'Insufficient Permissions',
                message: `You need at least one of these permissions: ${permissions.join(', ')}`,
                code: 'ANY_PERMISSION_DENIED',
                required_permissions: permissions,
                organization_id: targetOrgId
            });
        }

        next();
    };
}

/**
 * Require Resource Owner or Admin
 * Checks if user owns resource or is admin
 */
function requireResourceOwnerOrAdmin(options = {}) {
    return (req, res, next) => {
        const {
            userIdField = 'user_id',
            paramName = 'id',
            allowRoles = ['admin', 'superadmin', 'super_admin'],
            getResourceUserId = null
        } = options;

        // Check if user is admin first
        if (req.user.hasAnyRole(allowRoles)) {
            logger.info(`Admin access granted`, {
                userId: req.user.id,
                email: req.user.email,
                roles: req.user.roles
            });
            return next();
        }

        // Get resource user ID
        let resourceUserId;
        if (getResourceUserId && typeof getResourceUserId === 'function') {
            resourceUserId = getResourceUserId(req);
        } else {
            resourceUserId = req.body[userIdField] || req.params[paramName];
        }

        // Check if user owns the resource
        if (resourceUserId === req.user.id || resourceUserId === req.user.keycloak_id) {
            logger.info(`Resource owner access granted`, {
                userId: req.user.id,
                email: req.user.email,
                resourceUserId
            });
            return next();
        }

        logger.warn(`Resource access denied: not owner or admin`, {
            userId: req.user?.id,
            email: req.user?.email,
            resourceUserId,
            userRoles: req.user?.roles
        });

        return res.status(403).json({
            error: 'Resource Access Denied',
            message: 'You can only access your own resources or need admin privileges.',
            code: 'RESOURCE_ACCESS_DENIED'
        });
    };
}

/**
 * Dynamic Permission Check
 * Builds permission dynamically based on route and method
 */
function requireDynamicPermission(options = {}) {
    return (req, res, next) => {
        const {
            resource = null,
            getResource = null,
            actionMap = {
                'GET': 'read',
                'POST': 'create',
                'PUT': 'update',
                'PATCH': 'update',
                'DELETE': 'delete'
            }
        } = options;

        // Determine resource
        let targetResource = resource;
        if (getResource && typeof getResource === 'function') {
            targetResource = getResource(req);
        } else if (!targetResource) {
            // Extract from route path (e.g., /api/projects -> project)
            const pathParts = req.route.path.split('/');
            targetResource = pathParts[pathParts.length - 1].replace(/[^a-zA-Z0-9]/g, '');
        }

        // Determine action
        const action = actionMap[req.method] || 'access';

        // Build permission
        const permission = `${targetResource}:${action}`;

        // Check permission
        return requirePermission(permission)(req, res, next);
    };
}

/* --------- COMBINATION HELPERS --------- */

/**
 * Require App Access AND Permission
 */
function requireAppAndPermission(app, permission, options = {}) {
    return [
        requireAppAccess(app),
        requirePermission(permission, options)
    ];
}

/**
 * Require App Access AND Organization Role
 */
function requireAppAndOrgRole(app, role, options = {}) {
    return [
        requireAppAccess(app),
        requireOrganizationRole(role, options)
    ];
}

/**
 * Context-Aware Authorization
 * Determines authorization based on context
 */
function requireContextAuth(contexts) {
    return (req, res, next) => {
        // Example contexts:
        // - { type: 'app', value: 'pms' }
        // - { type: 'permission', value: 'project:create' }
        // - { type: 'org_role', value: 'admin', orgId: 'org1' }

        for (const context of contexts) {
            let middleware;

            switch (context.type) {
                case 'app':
                    middleware = requireAppAccess(context.value);
                    break;
                case 'permission':
                    middleware = requirePermission(context.value, context.options);
                    break;
                case 'org_role':
                    middleware = requireOrganizationRole(context.value, context.options);
                    break;
                case 'any_permission':
                    middleware = requireAnyPermission(context.value, context.options);
                    break;
                default:
                    continue;
            }

            // Try the middleware
            let hasAccess = false;
            middleware(req, { status: () => ({ json: () => { } }) }, (err) => {
                if (!err) hasAccess = true;
            });

            if (hasAccess) {
                return next(); // At least one context passed
            }
        }

        // No context passed
        return res.status(403).json({
            error: 'Access Denied',
            message: 'You don\'t meet any of the required authorization criteria.',
            code: 'CONTEXT_AUTH_FAILED'
        });
    };
}

module.exports = {
    // Basic authorization
    requireAppAccess,
    requirePermission,
    requireOrganizationRole,
    requireOrganizationAccess,
    requireAnyPermission,
    requireResourceOwnerOrAdmin,
    requireDynamicPermission,

    // Combination helpers
    requireAppAndPermission,
    requireAppAndOrgRole,
    requireContextAuth,

    // Your existing functions (enhanced)
    requireSuperAdmin: () => requireAppAccess('super').concat(requireOrganizationRole('super_admin', { allowGlobal: true })),
    requireRole: (role) => requireOrganizationRole(role, { allowGlobal: true }),

    // Utility functions
    checkAccess: (req, type, value, options = {}) => {
        switch (type) {
            case 'app': return req.user.hasRole(`${value}_user`);
            case 'permission': return req.user.hasPermission(value, options.orgId);
            case 'role': return req.user.hasRole(value, options.orgId);
            case 'org': return req.user.isInOrganization(value);
            default: return false;
        }
    }
};