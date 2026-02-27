// routes/organization-memberships.route.js - Organization Membership CRUD

const express = require('express');
const logger = require('../../../utils/logger');
const Joi = require('joi');
const asyncHandler = require('../../../middleware/asyncHandler');
const { authMiddleware, requireSuperAdmin, requireRole } = require('../../../middleware/authMiddleware');
const { AppError } = require('../../../middleware/errorHandler');
const { createMembershipSchema, updateMembershipSchema, bulkAssignSchema } = require('../validators');
const {
    OrganizationMembership,
    UserMetadata,
    Organization,
    Role,
    Permission,
    sequelize
} = require('../../../config/database');
const MembershipService = require('../services/membership.service');

const ResponseHandler = require('../../../utils/responseHandler');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware, requireSuperAdmin);



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
    const { error, value } = createMembershipSchema.validate(req.body || {});

    if (error) {
        throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { user_id, org_id, role_id } = value;

    logger.info('➕ Creating organization membership:', { user_id, org_id, role_id });

    try {
        const clientOrgModel = req.body.organization_model || req.headers['x-organization-model'];

        const membership = await MembershipService.createMembership({
            userId: user_id,
            orgId: org_id,
            roleId: role_id,
            clientOrgModel
        });

        return ResponseHandler.created(res, {
            message: 'Organization membership created successfully',
            membership
        }, 'Organization membership created successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('❌ Organization membership creation failed:', error);
        throw new AppError('Failed to create organization membership', 500, 'CREATION_FAILED');
    }
}));

// PUT /api/organization-memberships/:id - Update membership (change role)
router.put('/:id', asyncHandler(async (req, res) => {
    const { error, value } = updateMembershipSchema.validate(req.body || {});

    if (error) {
        throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { role_id } = value;

    logger.info('✏️ Updating organization membership:', id);

    try {
        const membership = await MembershipService.updateMembershipRole(id, role_id);

        logger.info('✅ Organization membership updated successfully');

        return ResponseHandler.success(res, {
            message: 'Organization membership updated successfully',
            membership
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
        const membershipInfo = await MembershipService.removeMembership(id);

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
    const { error, value } = bulkAssignSchema.validate(req.body || {});

    if (error) {
        throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { user_ids, org_id, role_id } = value;

    logger.info('📦 Bulk assigning', user_ids.length, 'users to organization');

    try {
        const result = await MembershipService.bulkAssign({
            userIds: user_ids,
            orgId: org_id,
            roleId: role_id
        });

        logger.info(`✅ Bulk assignment completed: ${result.created.length} created, ${result.errors.length} errors`);

        return ResponseHandler.success(res, {
            message: `Bulk assignment completed`,
            organization: result.organization,
            role: result.role,
            created: result.created.length,
            errors: result.errors.length,
            memberships: result.created,
            error_details: result.errorDetails
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