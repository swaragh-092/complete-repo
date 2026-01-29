// routes/permissions.route.js - Permissions CRUD

const express = require('express');
const Joi = require('joi');
const asyncHandler = require('../../middleware/asyncHandler');
const { authMiddleware, requireSuperAdmin } = require('../../middleware/authMiddleware');
const { AppError } = require('../../middleware/errorHandler');
const {
    Permission,
    Role,
    RolePermission,
    sequelize
} = require('../../config/database');
const ResponseHandler = require('../../utils/responseHandler');
const logger = require('../../utils/logger');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/* --------- Validation Schemas --------- */
const createPermissionSchema = Joi.object({
    name: Joi.string().min(1).max(100).required().pattern(/^[a-z_]+:[a-z_]+$/i),
    description: Joi.string().max(500).allow('').optional(),
    resource: Joi.string().max(50).optional(),
    action: Joi.string().max(50).optional(),
    is_system: Joi.boolean().optional().default(false)
});

const updatePermissionSchema = Joi.object({
    name: Joi.string().min(1).max(100).optional().pattern(/^[a-z_]+:[a-z_]+$/i),
    description: Joi.string().max(500).allow('').optional(),
    resource: Joi.string().max(50).optional(),
    action: Joi.string().max(50).optional()
}).min(1);

/* --------- PERMISSIONS CRUD ROUTES --------- */

// GET /api/permissions - Get all permissions
router.get('/', asyncHandler(async (req, res) => {
    const { resource, action, is_system } = req.query;

    logger.info('📋 Fetching permissions with filters:', { resource, action, is_system });

    try {
        const whereClause = {};
        if (resource) whereClause.resource = resource;
        if (action) whereClause.action = action;
        if (is_system !== undefined) whereClause.is_system = is_system === 'true';

        const permissions = await Permission.findAll({
            where: whereClause,
            include: [
                {
                    model: Role,
                    as: 'Roles',
                    through: { attributes: [] },
                    required: false,
                    attributes: ['id', 'name', 'description']
                }
            ],
            order: [['resource', 'ASC'], ['action', 'ASC']]
        });

        const enrichedPermissions = permissions.map(permission => ({
            id: permission.id,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            is_system: permission.is_system,
            created_at: permission.created_at,
            updated_at: permission.updated_at,
            roles: permission.Roles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description
            })),
            role_count: permission.Roles.length
        }));

        logger.info(`✅ Retrieved ${enrichedPermissions.length} permissions`);
        return ResponseHandler.success(res, enrichedPermissions, 'Permissions retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Failed to fetch permissions:', error);
        throw new AppError('Failed to retrieve permissions', 500, 'FETCH_FAILED');
    }
}));

// GET /api/permissions/:id - Get specific permission
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info('🔍 Fetching permission:', id);

    try {
        const permission = await Permission.findByPk(id, {
            include: [
                {
                    model: Role,
                    as: 'Roles',
                    through: { attributes: [] },
                    required: false,
                    attributes: ['id', 'name', 'description', 'is_system']
                }
            ]
        });

        if (!permission) {
            throw new AppError('Permission not found', 404, 'NOT_FOUND');
        }

        const enrichedPermission = {
            id: permission.id,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            is_system: permission.is_system,
            created_at: permission.created_at,
            updated_at: permission.updated_at,
            roles: permission.Roles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description,
                is_system: role.is_system
            })),
            role_count: permission.Roles.length
        };

        logger.info('✅ Permission details retrieved');
        return ResponseHandler.success(res, enrichedPermission, 'Permission details retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Failed to fetch permission:', error);
        throw new AppError('Failed to retrieve permission', 500, 'FETCH_FAILED');
    }
}));

// POST /api/permissions - Create new permission
router.post('/', asyncHandler(async (req, res) => {
    const { error, value } = createPermissionSchema.validate(req.body);

    if (error) {
        throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { name, description, resource, action, is_system } = value;

    logger.info('➕ Creating permission:', name);

    try {
        // Check if permission name already exists
        const existingPermission = await Permission.findOne({ where: { name } });
        if (existingPermission) {
            throw new AppError(`Permission '${name}' already exists`, 409, 'CONFLICT');
        }

        // Auto-extract resource and action from name if not provided
        let finalResource = resource;
        let finalAction = action;

        if (!finalResource || !finalAction) {
            const parts = name.split(':');
            if (parts.length === 2) {
                finalResource = finalResource || parts[0];
                finalAction = finalAction || parts[1];
            }
        }

        // Create the permission
        const newPermission = await Permission.create({
            name,
            description: description || '',
            resource: finalResource,
            action: finalAction,
            is_system: is_system || false
        });

        logger.info('✅ Permission created successfully');

        return ResponseHandler.created(res, {
            message: 'Permission created successfully',
            permission: {
                id: newPermission.id,
                name: newPermission.name,
                description: newPermission.description,
                resource: newPermission.resource,
                action: newPermission.action,
                is_system: newPermission.is_system,
                created_at: newPermission.created_at,
                roles: [],
                role_count: 0
            }
        }, 'Permission created successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Permission creation failed:', error);
        throw new AppError('Failed to create permission', 500, 'CREATION_FAILED');
    }
}));

// PUT /api/permissions/:id - Update permission
router.put('/:id', asyncHandler(async (req, res) => {
    const { error, value } = updatePermissionSchema.validate(req.body);

    if (error) {
        throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { name, description, resource, action } = value;

    logger.info('✏️ Updating permission:', id);

    try {
        const permission = await Permission.findByPk(id);

        if (!permission) {
            throw new AppError('Permission not found', 404, 'NOT_FOUND');
        }

        // Check if permission is system permission and prevent certain updates
        if (permission.is_system && name && name !== permission.name) {
            throw new AppError('Cannot rename system permissions', 403, 'FORBIDDEN');
        }

        // Update basic fields
        const updateData = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (resource !== undefined) updateData.resource = resource;
        if (action !== undefined) updateData.action = action;

        // Auto-extract resource and action from name if name is being updated
        if (name && (!resource && !action)) {
            const parts = name.split(':');
            if (parts.length === 2) {
                if (!resource) updateData.resource = parts[0];
                if (!action) updateData.action = parts[1];
            }
        }

        await permission.update(updateData);

        logger.info('✅ Permission updated successfully');

        return ResponseHandler.success(res, {
            message: 'Permission updated successfully',
            permission: {
                id: permission.id,
                name: permission.name,
                description: permission.description,
                resource: permission.resource,
                action: permission.action,
                is_system: permission.is_system,
                updated_at: permission.updated_at
            }
        }, 'Permission updated successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Permission update failed:', error);
        throw new AppError('Failed to update permission', 500, 'UPDATE_FAILED');
    }
}));

// DELETE /api/permissions/:id - Delete permission
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info('🗑️ Deleting permission:', id);

    try {
        const permission = await Permission.findByPk(id);

        if (!permission) {
            throw new AppError('Permission not found', 404, 'NOT_FOUND');
        }

        // Prevent deletion of system permissions
        if (permission.is_system) {
            throw new AppError('Cannot delete system permissions', 403, 'FORBIDDEN');
        }

        // Check if permission is assigned to roles
        const roleCount = await RolePermission.count({
            where: { permission_id: permission.id }
        });

        if (roleCount > 0) {
            throw new AppError(`Cannot delete permission '${permission.name}' as it is assigned to ${roleCount} role(s)`, 400, 'PERMISSION_IN_USE');
        }

        // Delete the permission
        await permission.destroy();

        logger.info('✅ Permission deleted successfully');

        return ResponseHandler.success(res, {
            message: `Permission '${permission.name}' deleted successfully`
        }, 'Permission deleted successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Permission deletion failed:', error);
        throw new AppError('Failed to delete permission', 500, 'DELETION_FAILED');
    }
}));

// GET /api/permissions/by-resource/:resource - Get permissions by resource
router.get('/by-resource/:resource', asyncHandler(async (req, res) => {
    const { resource } = req.params;

    logger.info('🔍 Fetching permissions for resource:', resource);

    try {
        const permissions = await Permission.findAll({
            where: { resource },
            include: [
                {
                    model: Role,
                    as: 'Roles',
                    through: { attributes: [] },
                    required: false,
                    attributes: ['id', 'name']
                }
            ],
            order: [['action', 'ASC']]
        });

        const enrichedPermissions = permissions.map(permission => ({
            id: permission.id,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            is_system: permission.is_system,
            roles: permission.Roles.map(role => ({
                id: role.id,
                name: role.name
            })),
            role_count: permission.Roles.length
        }));

        logger.info(`✅ Retrieved ${enrichedPermissions.length} permissions for resource ${resource}`);
        return ResponseHandler.success(res, enrichedPermissions, 'Permissions retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Failed to fetch permissions by resource:', error);
        throw new AppError('Failed to retrieve permissions by resource', 500, 'FETCH_FAILED');
    }
}));

// GET /api/permissions/stats - Get permission statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
    logger.info('📊 Fetching permission statistics');

    try {
        const totalPermissions = await Permission.count();
        const systemPermissions = await Permission.count({ where: { is_system: true } });
        const customPermissions = totalPermissions - systemPermissions;

        // Count by resource
        const resourceCounts = await Permission.findAll({
            attributes: [
                'resource',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['resource'],
            order: [[sequelize.literal('count'), 'DESC']],
            limit: 10
        });

        // Count by action
        const actionCounts = await Permission.findAll({
            attributes: [
                'action',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['action'],
            order: [[sequelize.literal('count'), 'DESC']],
            limit: 10
        });

        const stats = {
            total_permissions: totalPermissions,
            system_permissions: systemPermissions,
            custom_permissions: customPermissions,
            by_resource: resourceCounts.map(item => ({
                resource: item.resource,
                count: parseInt(item.dataValues.count)
            })),
            by_action: actionCounts.map(item => ({
                action: item.action,
                count: parseInt(item.dataValues.count)
            }))
        };

        logger.info('✅ Permission statistics retrieved');
        return ResponseHandler.success(res, stats, 'Permission statistics retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Failed to fetch permission statistics:', error);
        throw new AppError('Failed to retrieve permission statistics', 500, 'STATS_FAILED');
    }
}));

// POST /api/permissions/bulk - Bulk create permissions
router.post('/bulk', asyncHandler(async (req, res) => {
    const { permissions } = req.body;

    if (!Array.isArray(permissions) || permissions.length === 0) {
        throw new AppError('permissions array is required and must not be empty', 400, 'VALIDATION_ERROR');
    }

    logger.info('📦 Bulk creating', permissions.length, 'permissions');

    try {
        const createdPermissions = [];
        const errors = [];

        for (const permissionData of permissions) {
            try {
                const { error, value } = createPermissionSchema.validate(permissionData);

                if (error) {
                    errors.push({
                        permission: permissionData.name || 'unknown',
                        error: error.details[0].message
                    });
                    continue;
                }

                // Check if permission already exists
                const existingPermission = await Permission.findOne({
                    where: { name: value.name }
                });

                if (existingPermission) {
                    errors.push({
                        permission: value.name,
                        error: 'Permission already exists'
                    });
                    continue;
                }

                // Auto-extract resource and action if not provided
                let finalResource = value.resource;
                let finalAction = value.action;

                if (!finalResource || !finalAction) {
                    const parts = value.name.split(':');
                    if (parts.length === 2) {
                        finalResource = finalResource || parts[0];
                        finalAction = finalAction || parts[1];
                    }
                }

                const newPermission = await Permission.create({
                    name: value.name,
                    description: value.description || '',
                    resource: finalResource,
                    action: finalAction,
                    is_system: value.is_system || false
                });

                createdPermissions.push(newPermission);
            } catch (error) {
                errors.push({
                    permission: permissionData.name || 'unknown',
                    error: error.message
                });
            }
        }

        logger.info(`✅ Bulk creation completed: ${createdPermissions.length} created, ${errors.length} errors`);

        return ResponseHandler.success(res, {
            message: `Bulk permission creation completed`,
            created: createdPermissions.length,
            errors: errors.length,
            permissions: createdPermissions.map(p => ({
                id: p.id,
                name: p.name,
                resource: p.resource,
                action: p.action
            })),
            error_details: errors
        }, 'Bulk permission creation completed successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Bulk permission creation failed:', error);
        throw new AppError('Failed to bulk create permissions', 500, 'BULK_CREATION_FAILED');
    }
}));

module.exports = router;