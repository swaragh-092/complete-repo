'use strict';

/**
 * Role Management Routes
 * 
 * CRUD operations for custom org-scoped roles
 * System roles (owner, admin, member, viewer) cannot be modified
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { Role, Permission, RolePermission } = require('../config/database');
const { authorizeRBAC } = require('../modules/authorization/middleware');
const asyncHandler = require('../middleware/asyncHandler');
const ResponseHandler = require('../utils/responseHandler');
const { Op } = require('sequelize');

// Validation schemas
const createRoleSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    permissions: Joi.array().items(Joi.string()).optional()
});

const updateRoleSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional()
});

const assignPermissionsSchema = Joi.object({
    permissions: Joi.array().items(Joi.string()).required()
});

/**
 * GET /roles
 * List all roles for the organization (system + custom)
 */
router.get('/',
    authorizeRBAC('*:role:read'),
    asyncHandler(async (req, res) => {
        const orgId = req.headers['x-org-id'] || req.user?.organizations?.[0]?.id;

        if (!orgId) {
            return ResponseHandler.error(res, 'Organization context required', 400);
        }

        const roles = await Role.findAll({
            where: {
                [Op.or]: [
                    { org_id: null },      // System roles
                    { org_id: orgId }      // Org-specific custom roles
                ]
            },
            include: [{
                model: Permission,
                as: 'Permissions',
                through: { attributes: [] }
            }],
            order: [['is_system', 'DESC'], ['name', 'ASC']]
        });

        return ResponseHandler.success(res, {
            roles: roles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description,
                is_system: role.is_system,
                is_custom: role.org_id !== null,
                permissions: role.Permissions?.map(p => p.name) || []
            }))
        });
    })
);

/**
 * GET /roles/:id
 * Get single role details
 */
router.get('/:id',
    authorizeRBAC('*:role:read'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const orgId = req.headers['x-org-id'] || req.user?.organizations?.[0]?.id;

        const role = await Role.findOne({
            where: {
                id,
                [Op.or]: [
                    { org_id: null },
                    { org_id: orgId }
                ]
            },
            include: [{
                model: Permission,
                as: 'Permissions',
                through: { attributes: [] }
            }]
        });

        if (!role) {
            return ResponseHandler.error(res, 'Role not found', 404);
        }

        return ResponseHandler.success(res, {
            role: {
                id: role.id,
                name: role.name,
                description: role.description,
                is_system: role.is_system,
                is_custom: role.org_id !== null,
                permissions: role.Permissions?.map(p => p.name) || []
            }
        });
    })
);

/**
 * POST /roles
 * Create custom role for organization
 */
router.post('/',
    authorizeRBAC('*:role:create'),
    asyncHandler(async (req, res) => {
        const { error, value } = createRoleSchema.validate(req.body);
        if (error) {
            return ResponseHandler.error(res, error.details[0].message, 400);
        }

        const orgId = req.headers['x-org-id'] || req.user?.organizations?.[0]?.id;
        if (!orgId) {
            return ResponseHandler.error(res, 'Organization context required', 400);
        }

        const { name, description, permissions } = value;

        // Check if role name already exists in org
        const existing = await Role.findOne({
            where: {
                name,
                [Op.or]: [
                    { org_id: null },
                    { org_id: orgId }
                ]
            }
        });

        if (existing) {
            return ResponseHandler.error(res, 'Role name already exists', 409);
        }

        // Create the role
        const role = await Role.create({
            name,
            description,
            is_system: false,
            org_id: orgId
        });

        // Assign permissions if provided
        if (permissions && permissions.length > 0) {
            const permissionRecords = await Permission.findAll({
                where: { name: { [Op.in]: permissions } }
            });

            for (const perm of permissionRecords) {
                await RolePermission.create({
                    role_id: role.id,
                    permission_id: perm.id
                });
            }
        }

        // Reload with permissions
        await role.reload({
            include: [{
                model: Permission,
                as: 'Permissions',
                through: { attributes: [] }
            }]
        });

        return ResponseHandler.created(res, {
            message: 'Role created successfully',
            role: {
                id: role.id,
                name: role.name,
                description: role.description,
                is_system: role.is_system,
                is_custom: true,
                permissions: role.Permissions?.map(p => p.name) || []
            }
        });
    })
);

/**
 * PUT /roles/:id
 * Update custom role (system roles cannot be modified)
 */
router.put('/:id',
    authorizeRBAC('*:role:update'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { error, value } = updateRoleSchema.validate(req.body);
        if (error) {
            return ResponseHandler.error(res, error.details[0].message, 400);
        }

        const orgId = req.headers['x-org-id'] || req.user?.organizations?.[0]?.id;

        const role = await Role.findOne({
            where: { id, org_id: orgId }
        });

        if (!role) {
            return ResponseHandler.error(res, 'Role not found or is a system role', 404);
        }

        if (role.is_system) {
            return ResponseHandler.error(res, 'System roles cannot be modified', 403);
        }

        await role.update(value);

        return ResponseHandler.success(res, {
            message: 'Role updated successfully',
            role: {
                id: role.id,
                name: role.name,
                description: role.description
            }
        });
    })
);

/**
 * DELETE /roles/:id
 * Delete custom role (system roles cannot be deleted)
 */
router.delete('/:id',
    authorizeRBAC('*:role:delete'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const orgId = req.headers['x-org-id'] || req.user?.organizations?.[0]?.id;

        const role = await Role.findOne({
            where: { id, org_id: orgId }
        });

        if (!role) {
            return ResponseHandler.error(res, 'Role not found or is a system role', 404);
        }

        if (role.is_system) {
            return ResponseHandler.error(res, 'System roles cannot be deleted', 403);
        }

        // Delete role-permission associations first
        await RolePermission.destroy({ where: { role_id: id } });
        await role.destroy();

        return ResponseHandler.success(res, { message: 'Role deleted successfully' });
    })
);

/**
 * POST /roles/:id/permissions
 * Assign permissions to a custom role
 */
router.post('/:id/permissions',
    authorizeRBAC('*:role:update'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { error, value } = assignPermissionsSchema.validate(req.body);
        if (error) {
            return ResponseHandler.error(res, error.details[0].message, 400);
        }

        const orgId = req.headers['x-org-id'] || req.user?.organizations?.[0]?.id;

        const role = await Role.findOne({
            where: { id, org_id: orgId }
        });

        if (!role) {
            return ResponseHandler.error(res, 'Role not found or is a system role', 404);
        }

        if (role.is_system) {
            return ResponseHandler.error(res, 'System role permissions cannot be modified', 403);
        }

        const { permissions } = value;

        // Clear existing permissions
        await RolePermission.destroy({ where: { role_id: id } });

        // Assign new permissions
        const permissionRecords = await Permission.findAll({
            where: { name: { [Op.in]: permissions } }
        });

        for (const perm of permissionRecords) {
            await RolePermission.create({
                role_id: id,
                permission_id: perm.id
            });
        }

        // Reload with permissions
        await role.reload({
            include: [{
                model: Permission,
                as: 'Permissions',
                through: { attributes: [] }
            }]
        });

        return ResponseHandler.success(res, {
            message: 'Permissions updated successfully',
            role: {
                id: role.id,
                name: role.name,
                permissions: role.Permissions?.map(p => p.name) || []
            }
        });
    })
);

/**
 * GET /roles/permissions/available
 * List all available permissions
 */
router.get('/permissions/available',
    authorizeRBAC('*:role:read'),
    asyncHandler(async (req, res) => {
        const permissions = await Permission.findAll({
            attributes: ['id', 'name', 'description', 'resource', 'action'],
            order: [['resource', 'ASC'], ['action', 'ASC']]
        });

        return ResponseHandler.success(res, { permissions });
    })
);

module.exports = router;
