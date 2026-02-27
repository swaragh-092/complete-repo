'use strict';

const {
    OrganizationMembership,
    UserMetadata,
    Organization,
    Role,
    Permission,
    sequelize
} = require('../../../config/database');
const { AppError } = require('../../../middleware/errorHandler');
const logger = require('../../../utils/logger');

class MembershipService {
    /**
     * Create a new organization membership
     */
    static async createMembership({ userId, orgId, roleId, clientOrgModel }) {
        // Verify user exists
        const user = await UserMetadata.findByPk(userId);
        if (!user) {
            throw new AppError('User not found', 404, 'NOT_FOUND');
        }

        // Verify organization exists
        const organization = await Organization.findByPk(orgId);
        if (!organization) {
            throw new AppError('Organization not found', 404, 'NOT_FOUND');
        }

        // Verify role exists
        const role = await Role.findByPk(roleId);
        if (!role) {
            throw new AppError('Role not found', 404, 'NOT_FOUND');
        }

        // Check if membership already exists
        const existingMembership = await OrganizationMembership.findOne({
            where: { user_id: userId, org_id: orgId, role_id: roleId }
        });

        if (existingMembership) {
            throw new AppError('User already has this role in this organization', 409, 'CONFLICT');
        }

        // Single org mode enforcement
        const userExistingMemberships = await OrganizationMembership.findAll({
            where: { user_id: userId }
        });

        if (userExistingMemberships.length > 0 && clientOrgModel === 'single') {
            const existsInDifferentOrg = userExistingMemberships.some(
                membership => membership.org_id !== orgId
            );

            if (existsInDifferentOrg) {
                logger.info('⚠️ Single org mode: User already belongs to another organization');
                throw new AppError('This application only allows users to belong to one organization. Please leave your current organization first.', 409, 'SINGLE_ORGANIZATION_MODE', { current_org_id: userExistingMemberships[0].org_id });
            }
        }

        // Create the membership
        const newMembership = await OrganizationMembership.create({
            user_id: userId,
            org_id: orgId,
            role_id: roleId
        });

        // Auto-set primary org
        if (!user.primary_org_id) {
            await user.update({ primary_org_id: orgId });
            logger.info(`✅ Auto-set primary organization for user ${user.email} to ${orgId}`);
        }

        return {
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
        };
    }

    /**
     * Update an existing membership's role
     */
    static async updateMembershipRole(membershipId, newRoleId) {
        const membership = await OrganizationMembership.findByPk(membershipId, {
            include: [
                { model: UserMetadata, as: 'UserMetadata', attributes: ['email'] },
                { model: Organization, as: 'Organization', attributes: ['name'] },
                { model: Role, as: 'Role', attributes: ['name'] }
            ]
        });

        if (!membership) {
            throw new AppError('Organization membership not found', 404, 'NOT_FOUND');
        }

        const newRole = await Role.findByPk(newRoleId);
        if (!newRole) {
            throw new AppError('New role not found', 404, 'NOT_FOUND');
        }

        // Check for duplicates
        const duplicate = await OrganizationMembership.findOne({
            where: {
                user_id: membership.user_id,
                org_id: membership.org_id,
                role_id: newRoleId,
                id: { [sequelize.Op.ne]: membershipId }
            }
        });

        if (duplicate) {
            throw new AppError('User already has this role in this organization', 409, 'CONFLICT');
        }

        await membership.update({ role_id: newRoleId });

        // Build result imitating router's desired structure
        return {
            id: membership.id,
            user: { email: membership.UserMetadata?.email },
            organization: { name: membership.Organization?.name },
            old_role: { name: membership.Role?.name },
            new_role: {
                id: newRole.id,
                name: newRole.name
            }
        };
    }

    /**
     * Bulk assign memberships
     */
    static async bulkAssign({ userIds, orgId, roleId }) {
        const organization = await Organization.findByPk(orgId);
        if (!organization) {
            throw new AppError('Organization not found', 404, 'NOT_FOUND');
        }

        const role = await Role.findByPk(roleId);
        if (!role) {
            throw new AppError('Role not found', 404, 'NOT_FOUND');
        }

        const created = [];
        const errors = [];

        for (const userId of userIds) {
            try {
                const user = await UserMetadata.findByPk(userId);
                if (!user) {
                    errors.push({ user_id: userId, error: 'User not found' });
                    continue;
                }

                const existing = await OrganizationMembership.findOne({
                    where: { user_id: userId, org_id: orgId, role_id: roleId }
                });

                if (existing) {
                    errors.push({
                        user_id: userId,
                        email: user.email,
                        error: 'User already has this role in this organization'
                    });
                    continue;
                }

                const membership = await OrganizationMembership.create({
                    user_id: userId,
                    org_id: orgId,
                    role_id: roleId
                });

                created.push({
                    membership_id: membership.id,
                    user_id: userId,
                    email: user.email
                });
            } catch (error) {
                errors.push({ user_id: userId, error: error.message });
            }
        }

        return {
            organization: organization.name,
            role: role.name,
            created,
            errors,
            errorDetails: errors // camelCase match for route
        };
    }

    /**
     * Remove a membership instance
     */
    static async removeMembership(membershipId) {
        const membership = await OrganizationMembership.findByPk(membershipId, {
            include: [
                { model: UserMetadata, as: 'UserMetadata', attributes: ['email'] },
                { model: Organization, as: 'Organization', attributes: ['name'] },
                { model: Role, as: 'Role', attributes: ['name'] }
            ]
        });

        if (!membership) {
            throw new AppError('Organization membership not found', 404, 'NOT_FOUND');
        }

        const userInfo = {
            user_email: membership.UserMetadata?.email,
            organization_name: membership.Organization?.name,
            role_name: membership.Role?.name
        };

        await membership.destroy();
        return userInfo;
    }
}

module.exports = MembershipService;
