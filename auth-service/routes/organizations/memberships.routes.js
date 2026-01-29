// routes/organization-memberships.route.js - Organization Membership CRUD

const express = require('express');
const logger = require('../../utils/logger');
const Joi = require('joi');
const asyncHandler = require('../../middleware/asyncHandler');
const { authMiddleware, requireSuperAdmin, requireRole } = require('../../middleware/authMiddleware');
const { AppError } = require('../../middleware/errorHandler');
const {
    OrganizationMembership,
    UserMetadata,
    Organization,
    Role,
    Permission,
    sequelize
} = require('../../config/database');

const ResponseHandler = require('../../utils/responseHandler');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/* --------- Validation Schemas --------- */
const createMembershipSchema = Joi.object({
    user_id: Joi.string().uuid().required(),
    org_id: Joi.string().uuid().required(),
    role_id: Joi.string().uuid().required()
});

const updateMembershipSchema = Joi.object({
    role_id: Joi.string().uuid().required()
});

const bulkAssignSchema = Joi.object({
    user_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
    org_id: Joi.string().uuid().required(),
    role_id: Joi.string().uuid().required()
});

/* --------- ORGANIZATION MEMBERSHIP CRUD ROUTES --------- */

// GET /api/organization-memberships - Get all memberships with filters
router.get('/', asyncHandler(async (req, res) => {
    const { user_id, org_id, role_id } = req.query;

    logger.info('📋 Fetching organization memberships with filters:', { user_id, org_id, role_id });

    try {
        const whereClause = {};
        if (user_id) whereClause.user_id = user_id;
        if (org_id) whereClause.org_id = org_id;
        if (role_id) whereClause.role_id = role_id;

        const memberships = await OrganizationMembership.findAll({
            where: whereClause,
            include: [
                {
                    model: UserMetadata,
                    as: 'UserMetadata',   // ✅ must match alias
                    attributes: ['id', 'email', 'keycloak_id', 'designation', 'department']
                },
                {
                    model: Organization,
                    as: 'Organization',   // ✅ must match alias
                    attributes: ['id', 'name', 'tenant_id']
                },
                {
                    model: Role,
                    as: 'Role',           // ✅ must match alias
                    attributes: ['id', 'name', 'description']
                }
            ],
            order: [
                [{ model: Organization, as: 'Organization' }, 'name', 'ASC'],
                [{ model: UserMetadata, as: 'UserMetadata' }, 'email', 'ASC']
            ]
        });


        const enrichedMemberships = memberships.map(membership => ({
            id: membership.id,
            user: {
                id: membership.UserMetadata.id,
                email: membership.UserMetadata.email,
                keycloak_id: membership.UserMetadata.keycloak_id,
                designation: membership.UserMetadata.designation,
                department: membership.UserMetadata.department
            },
            organization: {
                id: membership.Organization.id,
                name: membership.Organization.name,
                tenant_id: membership.Organization.tenant_id
            },
            role: {
                id: membership.Role.id,
                name: membership.Role.name,
                description: membership.Role.description
            }
        }));

        logger.info(`✅ Retrieved ${enrichedMemberships.length} organization memberships`);
        return ResponseHandler.success(res, enrichedMemberships, 'Organization memberships retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Failed to fetch organization memberships:', error);
        throw new AppError('Failed to retrieve organization memberships', 500, 'FETCH_FAILED');
    }
}));

// GET /api/organization-memberships/:id - Get specific membership
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info('🔍 Fetching organization membership:', id);

    try {
        const membership = await OrganizationMembership.findAll({
            where: {
                id
            },
            include: [
                {
                    model: UserMetadata,
                    as: 'UserMetadata',   // ✅ must match alias
                    attributes: ['id', 'email', 'keycloak_id', 'designation', 'department']
                },
                {
                    model: Organization,
                    as: 'Organization',   // ✅ must match alias
                    attributes: ['id', 'name', 'tenant_id']
                },
                {
                    model: Role,
                    as: 'Role',           // ✅ must match alias
                    attributes: ['id', 'name', 'description']
                }
            ],
            order: [
                [{ model: Organization, as: 'Organization' }, 'name', 'ASC'],
                [{ model: UserMetadata, as: 'UserMetadata' }, 'email', 'ASC']
            ]
        });

        if (!membership) {
            throw new AppError('Organization membership not found', 404, 'NOT_FOUND');
        }

        // Check if user can access this membership info
        if (!req.user.roles.includes('superadmin') &&
            !req.user.roles.includes('admin') &&
            membership.user_id !== req.user.id) {

            // Check if user is admin of the organization
            const isOrgAdmin = req.user.organizations.some(org =>
                org.id === membership.org_id &&
                (org.role === 'admin' || org.role === 'org_admin')
            );

            if (!isOrgAdmin) {
                throw new AppError('You do not have permission to view this membership', 403, 'ACCESS_DENIED');
            }
        }

        const enrichedMembership = {
            id: membership.id,
            user: {
                id: membership.UserMetadata.id,
                email: membership.UserMetadata.email,
                keycloak_id: membership.UserMetadata.keycloak_id,
                designation: membership.UserMetadata.designation,
                department: membership.UserMetadata.department,
                is_active: membership.UserMetadata.is_active
            },
            organization: {
                id: membership.Organization.id,
                name: membership.Organization.name,
                tenant_id: membership.Organization.tenant_id
            },
            role: {
                id: membership.Role.id,
                name: membership.Role.name,
                description: membership.Role.description,
                is_system: membership.Role.is_system,
                permissions: membership.Role.Permissions.map(p => ({
                    id: p.id,
                    name: p.name,
                    resource: p.resource,
                    action: p.action
                }))
            }
        };

        logger.info('✅ Organization membership details retrieved');
        return ResponseHandler.success(res, enrichedMembership, 'Organization membership details retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Failed to fetch organization membership:', error.message);
        throw new AppError('Failed to retrieve organization membership', 500, 'FETCH_FAILED');
    }
}));

// POST /api/organization-memberships - Create new membership
router.post('/', asyncHandler(async (req, res) => {
    const { error, value } = createMembershipSchema.validate(req.body);

    if (error) {
        throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { user_id, org_id, role_id } = value;

    logger.info('➕ Creating organization membership:', { user_id, org_id, role_id });

    try {
        // Verify user exists
        const user = await UserMetadata.findByPk(user_id);
        if (!user) {
            throw new AppError('User not found', 404, 'NOT_FOUND');
        }

        // Verify organization exists
        const organization = await Organization.findByPk(org_id);
        if (!organization) {
            throw new AppError('Organization not found', 404, 'NOT_FOUND');
        }

        // Verify role exists
        const role = await Role.findByPk(role_id);
        if (!role) {
            throw new AppError('Role not found', 404, 'NOT_FOUND');
        }

        // Check if membership already exists
        const existingMembership = await OrganizationMembership.findOne({
            where: { user_id, org_id, role_id }
        });

        if (existingMembership) {
            throw new AppError('User already has this role in this organization', 409, 'CONFLICT');
        }

        // ✅ SINGLE ORG MODE ENFORCEMENT
        // Check if user already has memberships (for single org mode clients)
        const userExistingMemberships = await OrganizationMembership.findAll({
            where: { user_id }
        });

        // If user already has memberships, check if this org/client is in single mode
        if (userExistingMemberships.length > 0) {
            // Check the user's primary organization setting
            const userWithOrg = await UserMetadata.findByPk(user_id, {
                attributes: ['id', 'org_id', 'primary_org_id']
            });

            // Get the client context if available from request body
            const clientOrgModel = req.body.organization_model || req.headers['x-organization-model'];

            if (clientOrgModel === 'single') {
                // Check if user is trying to join a DIFFERENT organization
                const existsInDifferentOrg = userExistingMemberships.some(
                    membership => membership.org_id !== org_id
                );

                if (existsInDifferentOrg) {
                    logger.info('⚠️ Single org mode: User already belongs to another organization');
                    throw new AppError('This application only allows users to belong to one organization. Please leave your current organization first.', 409, 'SINGLE_ORGANIZATION_MODE', { current_org_id: userExistingMemberships[0].org_id });
                }
            }
        }

        // Create the membership
        const newMembership = await OrganizationMembership.create({
            user_id,
            org_id,
            role_id
        });

        // ✅ AUTO-SET PRIMARY ORG
        // If user has no primary org, set this one
        if (!user.primary_org_id) {
            await user.update({ primary_org_id: org_id });
            logger.info(`✅ Auto-set primary organization for user ${user.email} to ${org_id}`);
        }

        logger.info('✅ Organization membership created successfully');

        return ResponseHandler.created(res, {
            message: 'Organization membership created successfully',
            membership: {
                id: newMembership.id,
                user: {
                    id: user.id,
                    email: user.email
                },
                organization: {
                    id: organization.id,
                    name: organization.name
                },
                role: {
                    id: role.id,
                    name: role.name
                }
            }
        }, 'Organization membership created successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Organization membership creation failed:', error);
        throw new AppError('Failed to create organization membership', 500, 'CREATION_FAILED');
    }
}));

// PUT /api/organization-memberships/:id - Update membership (change role)
router.put('/:id', asyncHandler(async (req, res) => {
    const { error, value } = updateMembershipSchema.validate(req.body);

    if (error) {
        throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { role_id } = value;

    logger.info('✏️ Updating organization membership:', id);

    try {
        const membership = await OrganizationMembership.findByPk(id, {
            include: [
                { model: UserMetadata, attributes: ['email'] },
                { model: Organization, attributes: ['name'] },
                { model: Role, attributes: ['name'] }
            ]
        });

        if (!membership) {
            throw new AppError('Organization membership not found', 404, 'NOT_FOUND');
        }

        // Verify new role exists
        const newRole = await Role.findByPk(role_id);
        if (!newRole) {
            throw new AppError('New role not found', 404, 'NOT_FOUND');
        }

        // Check if this would create a duplicate
        const duplicate = await OrganizationMembership.findOne({
            where: {
                user_id: membership.user_id,
                org_id: membership.org_id,
                role_id: role_id,
                id: { [sequelize.Op.ne]: id } // Exclude current membership
            }
        });

        if (duplicate) {
            throw new AppError('User already has this role in this organization', 409, 'CONFLICT');
        }

        // Update the membership
        await membership.update({ role_id });

        logger.info('✅ Organization membership updated successfully');

        return ResponseHandler.success(res, {
            message: 'Organization membership updated successfully',
            membership: {
                id: membership.id,
                user: {
                    email: membership.UserMetadata.email
                },
                organization: {
                    name: membership.Organization.name
                },
                old_role: {
                    name: membership.Role.name
                },
                new_role: {
                    id: newRole.id,
                    name: newRole.name
                }
            }
        }, 'Organization membership updated successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Organization membership update failed:', error);
        throw new AppError('Failed to update organization membership', 500, 'UPDATE_FAILED');
    }
}));

// DELETE /api/organization-memberships/:id - Remove membership
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info('🗑️ Deleting organization membership:', id);

    try {
        const membership = await OrganizationMembership.findByPk(id, {
            include: [
                { model: UserMetadata, attributes: ['email'] },
                { model: Organization, attributes: ['name'] },
                { model: Role, attributes: ['name'] }
            ]
        });

        if (!membership) {
            throw new AppError('Organization membership not found', 404, 'NOT_FOUND');
        }

        const membershipInfo = {
            user_email: membership.UserMetadata.email,
            organization_name: membership.Organization.name,
            role_name: membership.Role.name
        };

        // Delete the membership
        await membership.destroy();

        logger.info('✅ Organization membership deleted successfully');

        return ResponseHandler.success(res, {
            message: `Removed ${membershipInfo.user_email} from ${membershipInfo.organization_name} (${membershipInfo.role_name} role)`
        }, 'Organization membership deleted successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Organization membership deletion failed:', error);
        throw new AppError('Failed to delete organization membership', 500, 'DELETION_FAILED');
    }
}));

// POST /api/organization-memberships/bulk-assign - Bulk assign users to org with role
router.post('/bulk-assign', asyncHandler(async (req, res) => {
    const { error, value } = bulkAssignSchema.validate(req.body);

    if (error) {
        throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { user_ids, org_id, role_id } = value;

    logger.info('📦 Bulk assigning', user_ids.length, 'users to organization');

    try {
        // Verify organization and role exist
        const organization = await Organization.findByPk(org_id);
        if (!organization) {
            throw new AppError('Organization not found', 404, 'NOT_FOUND');
        }

        const role = await Role.findByPk(role_id);
        if (!role) {
            throw new AppError('Role not found', 404, 'NOT_FOUND');
        }

        const created = [];
        const errors = [];

        for (const user_id of user_ids) {
            try {
                // Verify user exists
                const user = await UserMetadata.findByPk(user_id);
                if (!user) {
                    errors.push({
                        user_id,
                        error: 'User not found'
                    });
                    continue;
                }

                // Check if membership already exists
                const existing = await OrganizationMembership.findOne({
                    where: { user_id, org_id, role_id }
                });

                if (existing) {
                    errors.push({
                        user_id,
                        email: user.email,
                        error: 'User already has this role in this organization'
                    });
                    continue;
                }

                // Create membership
                const membership = await OrganizationMembership.create({
                    user_id,
                    org_id,
                    role_id
                });

                created.push({
                    membership_id: membership.id,
                    user_id,
                    email: user.email
                });
            } catch (error) {
                errors.push({
                    user_id,
                    error: error.message
                });
            }
        }

        logger.info(`✅ Bulk assignment completed: ${created.length} created, ${errors.length} errors`);

        return ResponseHandler.success(res, {
            message: `Bulk assignment completed`,
            organization: organization.name,
            role: role.name,
            created: created.length,
            errors: errors.length,
            memberships: created,
            error_details: errors
        }, 'Bulk assignment completed successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Bulk assignment failed:', error);
        throw new AppError('Failed to bulk assign users to organization', 500, 'BULK_ASSIGNMENT_FAILED');
    }
}));

// GET /api/organization-memberships/user/:userId - Get user's memberships
router.get('/user/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Check if user can access this info
    if (!req.user.roles.includes('superadmin') &&
        !req.user.roles.includes('admin') &&
        userId !== req.user.id) {
        throw new AppError('You can only view your own memberships', 403, 'ACCESS_DENIED');
    }

    logger.info('👤 Fetching memberships for user:', userId);

    try {
        const memberships = await OrganizationMembership.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Organization,
                    attributes: ['id', 'name', 'tenant_id']
                },
                {
                    model: Role,
                    attributes: ['id', 'name', 'description'],
                    include: [
                        {
                            model: Permission,
                            as: 'Permissions',
                            through: { attributes: [] },
                            attributes: ['id', 'name', 'resource', 'action']
                        }
                    ]
                }
            ]
        });

        const userMemberships = memberships.map(membership => ({
            id: membership.id,
            organization: {
                id: membership.Organization.id,
                name: membership.Organization.name,
                tenant_id: membership.Organization.tenant_id
            },
            role: {
                id: membership.Role.id,
                name: membership.Role.name,
                description: membership.Role.description,
                permissions: membership.Role.Permissions.map(p => ({
                    id: p.id,
                    name: p.name,
                    resource: p.resource,
                    action: p.action
                }))
            }
        }));

        logger.info(`✅ Retrieved ${userMemberships.length} memberships for user`);
        return ResponseHandler.success(res, {
            user_id: userId,
            memberships: userMemberships,
            total_memberships: userMemberships.length
        }, 'User memberships retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Failed to fetch user memberships:', error);
        throw new AppError('Failed to retrieve user memberships', 500, 'FETCH_FAILED');
    }
}));

// GET /api/organization-memberships/stats - Get membership statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
    logger.info('📊 Fetching organization membership statistics');

    try {
        const totalMemberships = await OrganizationMembership.count();

        // Memberships by role
        const roleCounts = await OrganizationMembership.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('OrganizationMembership.id')), 'count']
            ],
            include: [
                {
                    model: Role,
                    as: 'Role',   // ✅ must match alias
                    attributes: ['id', 'name']
                }
            ],
            group: ['Role.id', 'Role.name'],
            order: [[sequelize.literal('count'), 'DESC']],
            limit: 10
        });

        const orgCounts = await OrganizationMembership.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('OrganizationMembership.id')), 'count']
            ],
            include: [
                {
                    model: Organization,
                    as: 'Organization',   // ✅ must match alias
                    attributes: ['id', 'name']
                }
            ],
            group: ['Organization.id', 'Organization.name'],
            order: [[sequelize.literal('count'), 'DESC']],
            limit: 10
        });

        const stats = {
            total_memberships: totalMemberships,
            by_role: roleCounts.map(item => ({
                role: {
                    id: item.Role.id,
                    name: item.Role.name
                },
                count: parseInt(item.dataValues.count)
            })),
            by_organization: orgCounts.map(item => ({
                organization: {
                    id: item.Organization.id,
                    name: item.Organization.name
                },
                count: parseInt(item.dataValues.count)
            }))
        };

        logger.info('✅ Organization membership statistics retrieved');
        return ResponseHandler.success(res, stats, 'Organization membership statistics retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Failed to fetch membership statistics: default', error.message);
        throw new AppError('Failed to retrieve membership statistics', 500, 'STATS_FAILED');
    }
}));

module.exports = router;