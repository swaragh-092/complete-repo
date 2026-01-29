// routes/db-roles.route.js - DATABASE ROLES CRUD (Separate from Keycloak)

const express = require('express');
const logger = require('../../utils/logger');
const Joi = require('joi');
const asyncHandler = require('../../middleware/asyncHandler');
const { authMiddleware, requireSuperAdmin } = require('../../middleware/authMiddleware');
const { AppError } = require('../../middleware/errorHandler');
const {
    Role,
    Permission,
    OrganizationMembership,
    RolePermission,
    UserMetadata,
    Organization,
    sequelize,
} = require('../../config/database');

const ResponseHandler = require('../../utils/responseHandler');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/* --------- Validation Schemas --------- */
const createRoleSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).allow('').optional(),
    is_system: Joi.boolean().optional().default(false),
    permissions: Joi.array().items(Joi.string().uuid()).optional() // Permission IDs
});

const updateRoleSchema = Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).allow('').optional(),
    permissions: Joi.array().items(Joi.string().uuid()).optional()
}).min(1);

const assignRoleSchema = Joi.object({
    user_id: Joi.string().uuid().required(),
    org_id: Joi.string().uuid().required()
});

/* --------- DATABASE ROLES CRUD ROUTES --------- */

// GET /api/db-roles - Get all database roles
router.get('/', asyncHandler(async (req, res) => {
    logger.info('📋 Fetching database roles');

    try {
        const roles = await Role.findAll({
            include: [
                {
                    model: Permission,
                    as: 'Permissions',
                    through: { attributes: [] },
                    required: false
                }
            ],
            order: [['name', 'ASC']]
        });

        // Enrich with user count
        const enrichedRoles = await Promise.all(roles.map(async (role) => {
            const userCount = await OrganizationMembership.count({
                where: { role_id: role.id }
            });

            return {
                id: role.id,
                name: role.name,
                description: role.description,
                is_system: role.is_system,
                created_at: role.created_at,
                updated_at: role.updated_at,
                permissions: role.Permissions.map(p => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    resource: p.resource,
                    action: p.action
                })),
                user_count: userCount,
                permission_count: role.Permissions.length
            };
        }));

        logger.info(`✅ Retrieved ${enrichedRoles.length} database roles`);
        logger.info(`✅ Retrieved ${enrichedRoles.length} database roles`);
        return ResponseHandler.success(res, enrichedRoles, 'Database roles retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Failed to fetch database roles:', error);
        throw new AppError('Failed to retrieve database roles', 500, 'FETCH_FAILED');
    }
}));

// GET /api/db-roles/:id - Get specific database role
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info('🔍 Fetching database role:', id);

    try {
        const role = await Role.findByPk(id, {
            include: [
                {
                    model: Permission,
                    as: 'Permissions',
                    through: { attributes: [] },
                    required: false
                }
            ]
        });

        if (!role) {
            throw new AppError('Database role not found', 404, 'NOT_FOUND');
        }

        // Get users with this role
        const memberships = await OrganizationMembership.findAll({
            where: { role_id: role.id },
            include: [
                {
                    model: UserMetadata,
                    attributes: ['id', 'email', 'keycloak_id']
                },
                {
                    model: Organization,
                    attributes: ['id', 'name']
                }
            ]
        });

        const enrichedRole = {
            id: role.id,
            name: role.name,
            description: role.description,
            is_system: role.is_system,
            created_at: role.created_at,
            updated_at: role.updated_at,
            permissions: role.Permissions.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                resource: p.resource,
                action: p.action
            })),
            users: memberships.map(m => ({
                user_id: m.UserMetadata.id,
                email: m.UserMetadata.email,
                keycloak_id: m.UserMetadata.keycloak_id,
                organization: {
                    id: m.Organization.id,
                    name: m.Organization.name
                }
            })),
            user_count: memberships.length,
            permission_count: role.Permissions.length
        };

        logger.info('✅ Database role details retrieved');
        logger.info('✅ Database role details retrieved');
        return ResponseHandler.success(res, enrichedRole, 'Database role details retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Failed to fetch database role:', error);
        throw new AppError('Failed to retrieve database role', 500, 'FETCH_FAILED');
    }
}));

// POST /api/db-roles - Create new database role
router.post('/', asyncHandler(async (req, res) => {
    const { error, value } = createRoleSchema.validate(req.body);

    if (error) {
        throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { name, description, is_system, permissions } = value;

    logger.info('➕ Creating database role:', name);

    try {
        // Check if role name already exists
        const existingRole = await Role.findOne({ where: { name } });
        if (existingRole) {
            throw new AppError(`Database role '${name}' already exists`, 409, 'CONFLICT');
        }

        // Create the role
        const newRole = await Role.create({
            name,
            description: description || '',
            is_system: is_system || false
        });

        // Assign permissions if provided
        if (permissions && permissions.length > 0) {
            // Verify all permissions exist
            const validPermissions = await Permission.findAll({
                where: { id: permissions }
            });

            if (validPermissions.length !== permissions.length) {
                await newRole.destroy(); // Rollback
                throw new AppError('One or more permission IDs are invalid', 400, 'INVALID_PERMISSIONS');
            }

            // Create role-permission relationships
            const rolePermissions = permissions.map(permissionId => ({
                role_id: newRole.id,
                permission_id: permissionId
            }));

            await RolePermission.bulkCreate(rolePermissions);
        }

        // Fetch the created role with permissions
        const createdRole = await Role.findByPk(newRole.id, {
            include: [
                {
                    model: Permission,
                    as: 'Permissions',
                    through: { attributes: [] },
                    required: false
                }
            ]
        });

        logger.info('✅ Database role created successfully');

        return ResponseHandler.created(res, {
            message: 'Database role created successfully',
            role: {
                id: createdRole.id,
                name: createdRole.name,
                description: createdRole.description,
                is_system: createdRole.is_system,
                permissions: createdRole.Permissions.map(p => ({
                    id: p.id,
                    name: p.name,
                    resource: p.resource,
                    action: p.action
                })),
                created_at: createdRole.created_at
            }
        }, 'Database role created successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Database role creation failed:', error);
        throw new AppError('Failed to create database role', 500, 'CREATION_FAILED');
    }
}));

// PUT /api/db-roles/:id - Update database role
router.put('/:id', asyncHandler(async (req, res) => {
    const { error, value } = updateRoleSchema.validate(req.body);

    if (error) {
        throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { name, description, permissions } = value;

    logger.info('✏️ Updating database role:', id);

    try {
        const role = await Role.findByPk(id);

        if (!role) {
            throw new AppError('Database role not found', 404, 'NOT_FOUND');
        }

        // Check if role is system role and prevent certain updates
        if (role.is_system && name && name !== role.name) {
            throw new AppError('Cannot rename system roles', 403, 'FORBIDDEN');
        }

        // Update basic fields
        const updateData = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;

        if (Object.keys(updateData).length > 0) {
            await role.update(updateData);
        }

        // Update permissions if provided
        if (permissions !== undefined) {
            // Remove existing permissions
            await RolePermission.destroy({
                where: { role_id: role.id }
            });

            // Add new permissions
            if (permissions.length > 0) {
                // Verify all permissions exist
                const validPermissions = await Permission.findAll({
                    where: { id: permissions }
                });

                if (validPermissions.length !== permissions.length) {
                    throw new AppError('One or more permission IDs are invalid', 400, 'INVALID_PERMISSIONS');
                }

                const rolePermissions = permissions.map(permissionId => ({
                    role_id: role.id,
                    permission_id: permissionId
                }));

                await RolePermission.bulkCreate(rolePermissions);
            }
        }

        // Fetch updated role
        const updatedRole = await Role.findByPk(role.id, {
            include: [
                {
                    model: Permission,
                    as: 'Permissions',
                    through: { attributes: [] },
                    required: false
                }
            ]
        });

        logger.info('✅ Database role updated successfully');

        return ResponseHandler.success(res, {
            message: 'Database role updated successfully',
            role: {
                id: updatedRole.id,
                name: updatedRole.name,
                description: updatedRole.description,
                is_system: updatedRole.is_system,
                permissions: updatedRole.Permissions.map(p => ({
                    id: p.id,
                    name: p.name,
                    resource: p.resource,
                    action: p.action
                })),
                updated_at: updatedRole.updated_at
            }
        }, 'Database role updated successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Database role update failed:', error);
        throw new AppError('Failed to update database role', 500, 'UPDATE_FAILED');
    }
}));

// DELETE /api/db-roles/:id - Delete database role
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info('🗑️ Deleting database role:', id);

    try {
        const role = await Role.findByPk(id);

        if (!role) {
            throw new AppError('Database role not found', 404, 'NOT_FOUND');
        }

        // Prevent deletion of system roles
        if (role.is_system) {
            throw new AppError('Cannot delete system roles', 403, 'FORBIDDEN');
        }

        // Check if role is assigned to users
        const userCount = await OrganizationMembership.count({
            where: { role_id: role.id }
        });

        if (userCount > 0) {
            throw new AppError(`Cannot delete role '${role.name}' as it is assigned to ${userCount} user(s)`, 400, 'ROLE_IN_USE');
        }

        // Delete role-permission relationships first
        await RolePermission.destroy({
            where: { role_id: role.id }
        });

        // Delete the role
        await role.destroy();

        logger.info('✅ Database role deleted successfully');

        return ResponseHandler.success(res, {
            message: `Database role '${role.name}' deleted successfully`
        }, 'Database role deleted successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Database role deletion failed:', error);
        throw new AppError('Failed to delete database role', 500, 'DELETION_FAILED');
    }
}));

// POST /api/db-roles/:id/assign - Assign database role to user in organization
router.post('/:id/assign', asyncHandler(async (req, res) => {
    const { error, value } = assignRoleSchema.validate(req.body);

    if (error) {
        throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { user_id, org_id } = value;

    logger.info('🎯 Assigning database role:', id, 'to user:', user_id, 'in org:', org_id);

    try {
        const role = await Role.findByPk(id);
        if (!role) {
            throw new AppError('Database role not found', 404, 'NOT_FOUND');
        }

        const user = await UserMetadata.findByPk(user_id);
        if (!user) {
            throw new AppError('User not found', 404, 'NOT_FOUND');
        }

        const org = await Organization.findByPk(org_id);
        if (!org) {
            throw new AppError('Organization not found', 404, 'NOT_FOUND');
        }

        // Check if assignment already exists
        const existing = await OrganizationMembership.findOne({
            where: {
                user_id,
                org_id,
                role_id: id
            }
        });

        if (existing) {
            throw new AppError('User already has this role in this organization', 409, 'CONFLICT');
        }

        // Create the assignment
        await OrganizationMembership.create({
            user_id,
            org_id,
            role_id: id
        });

        logger.info('✅ Database role assigned successfully');

        return ResponseHandler.success(res, {
            message: `Database role '${role.name}' assigned to user in organization '${org.name}' successfully`
        }, 'Database role assigned successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Database role assignment failed:', error);
        throw new AppError('Failed to assign database role', 500, 'ASSIGNMENT_FAILED');
    }
}));

// DELETE /api/db-roles/:id/assign - Remove database role from user in organization
router.delete('/:id/assign', requireSuperAdmin(), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { user_id, org_id } = req.query;

    if (!user_id || !org_id) {
        throw new AppError('user_id and org_id parameters are required', 400, 'VALIDATION_ERROR');
    }

    logger.info('🎯 Removing database role:', id, 'from user:', user_id, 'in org:', org_id);

    try {
        const role = await Role.findByPk(id);
        if (!role) {
            throw new AppError('Database role not found', 404, 'NOT_FOUND');
        }

        const membership = await OrganizationMembership.findOne({
            where: {
                user_id,
                org_id,
                role_id: id
            }
        });

        if (!membership) {
            throw new AppError('Role assignment not found', 404, 'NOT_FOUND');
        }

        await membership.destroy();

        logger.info('✅ Database role removed successfully');

        return ResponseHandler.success(res, {
            message: `Database role '${role.name}' removed from user successfully`
        }, 'Database role removed successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Database role removal failed:', error);
        throw new AppError('Failed to remove database role', 500, 'REMOVAL_FAILED');
    }
}));

// GET /api/db-roles/stats - Get database roles statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
    logger.info('📊 Fetching database roles statistics');

    try {
        const totalRoles = await Role.count();
        const systemRoles = await Role.count({ where: { is_system: true } });
        const customRoles = totalRoles - systemRoles;

        const totalAssignments = await OrganizationMembership.count();
        const totalPermissions = await Permission.count();

        // Most used roles
        const roleUsage = await Role.findAll({
            attributes: [
                'id',
                'name',
                [
                    sequelize.fn('COUNT', sequelize.col('OrganizationMemberships.id')),
                    'usage_count'
                ]
            ],
            include: [
                {
                    model: OrganizationMembership,
                    attributes: [],
                    required: false
                }
            ],
            group: ['Role.id'],
            order: [[sequelize.literal('usage_count'), 'DESC']],
            limit: 5
        });

        const stats = {
            total_roles: totalRoles,
            system_roles: systemRoles,
            custom_roles: customRoles,
            total_assignments: totalAssignments,
            total_permissions: totalPermissions,
            most_used_roles: roleUsage.map(role => ({
                id: role.id,
                name: role.name,
                usage_count: parseInt(role.dataValues.usage_count)
            }))
        };

        logger.info('✅ Database roles statistics retrieved');
        logger.info('✅ Database roles statistics retrieved');
        return ResponseHandler.success(res, stats, 'Database roles statistics retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Failed to fetch database roles statistics:', error);
        throw new AppError('Failed to retrieve database roles statistics', 500, 'STATS_FAILED');
    }
}));

module.exports = router;