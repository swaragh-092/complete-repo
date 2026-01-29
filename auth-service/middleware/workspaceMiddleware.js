'use strict';

const { WorkspaceMembership, Workspace } = require('../config/database');
const { AppError } = require('./errorHandler');
const { ROLES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Helper function to check if user is a super admin
 */
const isSuperAdmin = (user) => {
    return user?.roles?.includes('superadmin') || user?.roles?.includes(ROLES.SUPER_ADMIN);
};

/**
 * Middleware to check if user has access to the requested workspace.
 * Expects workspaceId in req.params.workspaceId, req.params.id (if route is /workspaces/:id),
 * or req.body.workspace_id
 */
const requireWorkspaceAccess = (requiredRole = null) => {
    return async (req, res, next) => {
        try {
            const workspaceId = req.params.workspaceId || req.params.id || req.body.workspace_id || req.query.workspace_id;
            const userId = req.user.id || req.user.UserMetadata?.id; // Handle different user object structures

            if (!workspaceId) {
                return next(new AppError('Workspace ID is required', 400));
            }

            // Super Admin Bypass - super admins have access to all workspaces
            if (isSuperAdmin(req.user)) {
                logger.info('Super admin bypass for workspace access', { userId, workspaceId });
                // Load workspace for context
                const workspace = await Workspace.findByPk(workspaceId);
                if (!workspace) {
                    return next(new AppError('Workspace not found', 404, 'WORKSPACE_NOT_FOUND'));
                }
                req.workspace = workspace;
                req.workspaceMembership = { role: 'admin' }; // Grant admin-level access
                req.isSuperAdmin = true;
                return next();
            }

            // Check Membership
            const membership = await WorkspaceMembership.findOne({
                where: {
                    workspace_id: workspaceId,
                    user_id: userId,
                    status: 'active'
                },
                include: [{
                    model: Workspace,
                    as: 'Workspace' // To attach workspace context if needed
                }]
            });

            if (!membership) {
                return next(new AppError('Access denied to this workspace', 403, 'WORKSPACE_ACCESS_DENIED'));
            }

            // Check Role Permissions (Hierarchical: admin > editor > viewer)
            if (requiredRole) {
                const roles = ['viewer', 'editor', 'admin'];
                const userRoleIndex = roles.indexOf(membership.role);
                const requiredRoleIndex = roles.indexOf(requiredRole);

                if (userRoleIndex < requiredRoleIndex) {
                    return next(new AppError(`Insufficient permissions. Required: ${requiredRole}`, 403, 'INSUFFICIENT_PERMISSIONS'));
                }
            }

            // Attach workspace context to request
            req.workspace = membership.Workspace;
            req.workspaceMembership = membership;

            next();
        } catch (error) {
            logger.error('Workspace access check failed', error);
            next(new AppError('Internal validation error', 500));
        }
    };
};

/**
 * Middleware to check if user has permission to manage resources in an organization.
 * Used for operations like creating workspaces within an org.
 * @param {string} requiredRole - Minimum org role required (owner, admin, member)
 */
const requireOrgPermission = (requiredRole = 'admin') => {
    const { OrganizationMembership, Role } = require('../config/database');

    return async (req, res, next) => {
        try {
            // Get org_id from body (POST), query (GET), or params
            const orgId = req.body.org_id || req.query.org_id || req.params.orgId;
            const userId = req.user.id || req.user.UserMetadata?.id;

            if (!orgId) {
                return next(new AppError('Organization ID is required', 400, 'ORG_ID_REQUIRED'));
            }

            // Super Admin Bypass - super admins have full org permissions
            if (isSuperAdmin(req.user)) {
                logger.info('Super admin bypass for org permission', { userId, orgId, requiredRole });
                req.orgMembership = null; // No membership but still has access
                req.targetOrgId = orgId;
                req.userOrgRole = 'superadmin';
                req.isSuperAdmin = true;
                return next();
            }

            // Check Organization Membership with Role included
            const membership = await OrganizationMembership.findOne({
                where: {
                    org_id: orgId,
                    user_id: userId
                },
                include: [{
                    model: Role,
                    as: 'Role',
                    attributes: ['id', 'name']
                }]
            });

            if (!membership) {
                return next(new AppError('You are not a member of this organization', 403, 'NOT_ORG_MEMBER'));
            }

            // Get role name from the included Role model
            const userRole = membership.Role?.name?.toLowerCase() || 'member';

            // Role hierarchy: owner > admin > member
            const roles = ['member', 'admin', 'owner'];
            const userRoleIndex = roles.indexOf(userRole);
            const requiredRoleIndex = roles.indexOf(requiredRole);

            if (userRoleIndex < requiredRoleIndex) {
                return next(new AppError(`Insufficient permissions. Required: ${requiredRole}, You have: ${userRole}`, 403, 'INSUFFICIENT_ORG_PERMISSION'));
            }

            // Attach org context to request
            req.orgMembership = membership;
            req.targetOrgId = orgId;
            req.userOrgRole = userRole;

            logger.info('Org permission check passed', {
                userId,
                orgId,
                role: userRole,
                requiredRole
            });

            next();
        } catch (error) {
            logger.error('Org permission check failed', error);
            next(new AppError('Internal permission validation error', 500));
        }
    };
};

module.exports = { requireWorkspaceAccess, requireOrgPermission };
