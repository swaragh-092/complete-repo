'use strict';

const {
    Workspace,
    WorkspaceMembership,
    Organization,
    OrganizationMembership,
    UserMetadata,
    sequelize
} = require('../config/database');
const { WORKSPACE_ROLES, MEMBER_STATUS, SYSTEM_LIMITS, ROLES } = require('../config/constants');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const AuditLogService = require('./audit.service');

/**
 * Helper function to check if user is a super admin
 */
const isSuperAdmin = (roles) => {
    return roles?.includes('superadmin') || roles?.includes(ROLES.SUPER_ADMIN);
};


class WorkspaceService {

    /**
     * Create a new workspace within an organization
     * @param {Object} params
     * @param {string[]} params.userRoles - User's roles (for super admin detection)
     */
    async createWorkspace({ userId, orgId, name, description, slug, userRoles = [] }) {
        const transaction = await sequelize.transaction();
        const { Role } = require('../config/database');

        try {
            // 1. Validate Organization Access
            const orgMembership = await OrganizationMembership.findOne({
                where: { user_id: userId, org_id: orgId },
                include: [{
                    model: Role,
                    as: 'Role',
                    attributes: ['id', 'name']
                }],
                transaction
            });

            if (!orgMembership) {
                // Allow super admins to create workspaces in any org
                if (!isSuperAdmin(userRoles)) {
                    throw new AppError('You must be a member of the organization to create a workspace', 403, 'ORG_ACCESS_DENIED');
                }
                logger.info('Super admin creating workspace in org without membership', { userId, orgId });
            } else {
                // CRITICAL: Enforce Org Admin/Owner role for workspace creation (non-super-admins)
                const userRole = orgMembership.Role?.name?.toLowerCase() || 'member';
                const ALLOWED_ROLES = ['admin', 'owner'];
                if (!ALLOWED_ROLES.includes(userRole) && !isSuperAdmin(userRoles)) {
                    throw new AppError('Only organization admins can create workspaces', 403, 'INSUFFICIENT_ORG_PERMISSIONS');
                }
            }

            // 1.5 Check Max Workspaces Limit
            const currentCount = await Workspace.count({
                where: { org_id: orgId },
                transaction
            });

            if (currentCount >= SYSTEM_LIMITS.MAX_WORKSPACES_PER_ORG) {
                throw new AppError(`Organization has reached the maximum limit of ${SYSTEM_LIMITS.MAX_WORKSPACES_PER_ORG} workspaces`, 400, 'MAX_WORKSPACES_REACHED');
            }

            // 2. Check Slug Uniqueness within Org
            const existingSlug = await Workspace.findOne({
                where: { org_id: orgId, slug },
                transaction
            });

            if (existingSlug) {
                throw new AppError(`Workspace ID '${slug}' already exists in this organization`, 409, 'SLUG_COLLISION');
            }

            // 3. Create Workspace
            const workspace = await Workspace.create({
                org_id: orgId,
                name,
                slug,
                description,
                created_by: userId,
                settings: {}
            }, { transaction });

            // 4. Add Creator as Admin
            await WorkspaceMembership.create({
                workspace_id: workspace.id,
                user_id: userId,
                role: WORKSPACE_ROLES.ADMIN,
                status: MEMBER_STATUS.ACTIVE,
                created_by: userId
            }, { transaction });

            // 5. Audit Log

            await AuditLogService.log({
                action: 'WORKSPACE_CREATE',
                actorId: userId,
                resourceType: 'WORKSPACE',
                resourceId: workspace.id,
                orgId: orgId,
                details: { name, slug },
                ipAddress: '127.0.0.1' // TODO: Pass from controller
            }, { transaction });

            await transaction.commit();
            logger.info(`Workspace created: ${name} (${workspace.id}) by user ${userId}`);

            return workspace;
        } catch (error) {
            await transaction.rollback();
            logger.error('Workspace creation failed', error);
            throw error;
        }
    }

    /**
     * Get all workspaces a user has access to (globally or per org)
     * @param {string} userId - User's database ID
     * @param {string} orgId - Optional org filter
     * @param {string[]} userRoles - User's roles (for super admin detection)
     */
    async getUserWorkspaces(userId, orgId = null, userRoles = []) {
        try {
            // Super Admin Bypass - return all workspaces (optionally filtered by org)
            if (isSuperAdmin(userRoles)) {
                logger.info('Super admin fetching all workspaces', { userId, orgId });
                const whereClause = orgId ? { org_id: orgId } : {};

                const workspaces = await Workspace.findAll({
                    where: whereClause,
                    include: [{
                        model: Organization,
                        as: 'Organization',
                        attributes: ['id', 'name', 'tenant_id']
                    }]
                });

                return workspaces.map(w => ({
                    membership_id: null, // Super admin doesn't have membership
                    role: 'superadmin',
                    workspace: w,
                    organization: w.Organization
                }));
            }

            // Regular users - only workspaces they have membership in
            const whereClause = { user_id: userId, status: 'active' };

            const memberships = await WorkspaceMembership.findAll({
                where: whereClause,
                include: [{
                    model: Workspace,
                    as: 'Workspace',
                    where: orgId ? { org_id: orgId } : {}, // Filter by Org if provided
                    include: [{
                        model: Organization,
                        as: 'Organization',
                        attributes: ['id', 'name', 'tenant_id']
                    }]
                }]
            });

            return memberships.map(m => ({
                membership_id: m.id,
                role: m.role,
                workspace: m.Workspace,
                organization: m.Workspace.Organization
            }));
        } catch (error) {
            logger.error('Get user workspaces failed', error);
            throw new AppError('Failed to fetch workspaces', 500);
        }
    }
    /**
     * Add a member to a workspace
     */
    async addMember({ requesterId, workspaceId, targetUserId, role = 'viewer' }) {
        const transaction = await sequelize.transaction();

        try {
            // 1. Check Requester Permissions (Must be Admin of Workspace)
            const requesterMembership = await WorkspaceMembership.findOne({
                where: { workspace_id: workspaceId, user_id: requesterId, role: WORKSPACE_ROLES.ADMIN, status: MEMBER_STATUS.ACTIVE },
                transaction
            });

            if (!requesterMembership) {
                // Fallback: Check if requester is Org Admin/Owner (The "Owner is God" rule)
                const workspace = await Workspace.findByPk(workspaceId, { transaction });
                if (!workspace) throw new AppError('Workspace not found', 404);

                // TODO: Implement sophisticated Org Role check here if needed
                // For now, strict workspace admin requirement
                throw new AppError('Only workspace admins can add members', 403, 'ACCESS_DENIED');
            }

            // 2. Check Target User Organization Membership
            // CRITICAL: Target user MUST be in the parent organization first
            const workspace = await Workspace.findByPk(workspaceId, { transaction });
            const targetOrgMembership = await OrganizationMembership.findOne({
                where: { org_id: workspace.org_id, user_id: targetUserId },
                transaction
            });

            if (!targetOrgMembership) {
                throw new AppError('User must be a member of the organization first', 400, 'USER_NOT_IN_ORG');
            }

            // 3. Add to Workspace
            const [membership, created] = await WorkspaceMembership.findOrCreate({
                where: { workspace_id: workspaceId, user_id: targetUserId },
                defaults: { role, status: 'active', created_by: requesterId },
                transaction
            });

            if (!created) {
                // Determine if we should update role or throw error
                throw new AppError('User is already in this workspace', 409, 'ALREADY_MEMBER');
            }

            await transaction.commit();
            logger.info(`User ${targetUserId} added to workspace ${workspaceId} as ${role}`);
            return membership;

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }


    /**
     * Get all members of a workspace
     */
    async getMembers(workspaceId) {
        try {
            return await WorkspaceMembership.findAll({
                where: { workspace_id: workspaceId, status: MEMBER_STATUS.ACTIVE },
                include: [{
                    model: UserMetadata,
                    as: 'UserMetadata',
                    attributes: ['id', 'email', 'keycloak_id'] // minimized attributes
                }]
            });
        } catch (error) {
            logger.error('Get workspace members failed', error);
            throw error;
        }
    }

    /**
     * Remove a member from a workspace
     */
    async removeMember({ requesterId, workspaceId, targetUserId }) {
        const transaction = await sequelize.transaction();
        try {
            // 1. Check Requester Permissions (Must be Admin)
            const requesterMembership = await WorkspaceMembership.findOne({
                where: { workspace_id: workspaceId, user_id: requesterId, role: WORKSPACE_ROLES.ADMIN, status: MEMBER_STATUS.ACTIVE },
                transaction
            });

            if (!requesterMembership) {
                // Fallback: Check if requester is Org Admin (Not implemented yet, sticking to workspace admin)
                throw new AppError('Only workspace admins can remove members', 403, 'ACCESS_DENIED');
            }

            // 2. Prevent removing self if last admin (Last Admin Guard)
            if (requesterId === targetUserId) {
                const adminCount = await WorkspaceMembership.count({
                    where: { workspace_id: workspaceId, role: WORKSPACE_ROLES.ADMIN, status: MEMBER_STATUS.ACTIVE },
                    transaction
                });
                if (adminCount <= 1) {
                    throw new AppError('Cannot leave: You are the last admin. Promote someone else first.', 400, 'LAST_ADMIN_GUARD');
                }
            }

            // 3. Remove Member
            const deleted = await WorkspaceMembership.destroy({
                where: { workspace_id: workspaceId, user_id: targetUserId },
                transaction
            });

            if (deleted === 0) {
                throw new AppError('Member not found', 404, 'NOT_FOUND');
            }

            await transaction.commit();
            logger.info(`User ${targetUserId} removed from workspace ${workspaceId} by ${requesterId}`);
            return true;

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get workspace details by ID (if user has access)
     */
    async getWorkspaceById(workspaceId, userId) {
        try {
            const workspace = await Workspace.findByPk(workspaceId, {
                include: [
                    {
                        model: WorkspaceMembership,
                        as: 'Memberships',
                        where: { user_id: userId, status: 'active' },
                        required: true // Inner Join - ensures access
                    }
                ]
            });

            if (!workspace) {
                throw new AppError('Workspace not found or access denied', 404, 'NOT_FOUND');
            }

            return workspace;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update workspace details (name, description)
     */
    async updateWorkspace({ requesterId, workspaceId, name, description }) {
        const transaction = await sequelize.transaction();
        try {
            // Check admin access
            const membership = await WorkspaceMembership.findOne({
                where: { workspace_id: workspaceId, user_id: requesterId, role: 'admin', status: 'active' },
                transaction
            });

            if (!membership) {
                throw new AppError('Only workspace admins can edit workspace details', 403, 'ACCESS_DENIED');
            }

            const workspace = await Workspace.findByPk(workspaceId, { transaction });
            if (!workspace) throw new AppError('Workspace not found', 404, 'NOT_FOUND');

            if (name) workspace.name = name;
            if (description !== undefined) workspace.description = description;

            await workspace.save({ transaction });
            await transaction.commit();

            logger.info(`Workspace ${workspaceId} updated by ${requesterId}`);
            return workspace;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Soft delete a workspace (set deleted_at)
     */
    async deleteWorkspace({ requesterId, workspaceId }) {
        const transaction = await sequelize.transaction();
        try {
            // Check admin access
            const membership = await WorkspaceMembership.findOne({
                where: { workspace_id: workspaceId, user_id: requesterId, role: 'admin', status: 'active' },
                transaction
            });

            if (!membership) {
                throw new AppError('Only workspace admins can delete workspaces', 403, 'ACCESS_DENIED');
            }

            const workspace = await Workspace.findByPk(workspaceId, { transaction });
            if (!workspace) throw new AppError('Workspace not found', 404, 'NOT_FOUND');

            // Soft delete
            workspace.deleted_at = new Date();
            await workspace.save({ transaction });

            // Also deactivate all memberships
            await WorkspaceMembership.update(
                { status: MEMBER_STATUS.SUSPENDED },
                { where: { workspace_id: workspaceId }, transaction }
            );

            await transaction.commit();
            logger.info(`Workspace ${workspaceId} deleted by ${requesterId}`);
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Update member role within workspace
     */
    async updateMemberRole({ requesterId, workspaceId, targetUserId, newRole }) {
        const transaction = await sequelize.transaction();
        try {
            // Check admin access
            const requesterMembership = await WorkspaceMembership.findOne({
                where: { workspace_id: workspaceId, user_id: requesterId, role: 'admin', status: 'active' },
                transaction
            });

            if (!requesterMembership) {
                throw new AppError('Only workspace admins can change roles', 403, 'ACCESS_DENIED');
            }

            // Validate new role
            const validRoles = ['viewer', 'editor', 'admin'];
            if (!validRoles.includes(newRole)) {
                throw new AppError('Invalid role. Must be viewer, editor, or admin', 400, 'INVALID_ROLE');
            }

            // Find target membership
            const targetMembership = await WorkspaceMembership.findOne({
                where: { workspace_id: workspaceId, user_id: targetUserId, status: MEMBER_STATUS.ACTIVE },
                transaction
            });

            if (!targetMembership) {
                throw new AppError('Member not found', 404, 'NOT_FOUND');
            }

            // If demoting from admin, check Last Admin Guard
            if (targetMembership.role === 'admin' && newRole !== 'admin') {
                const adminCount = await WorkspaceMembership.count({
                    where: { workspace_id: workspaceId, role: WORKSPACE_ROLES.ADMIN, status: MEMBER_STATUS.ACTIVE },
                    transaction
                });
                if (adminCount <= 1) {
                    throw new AppError('Cannot demote: This is the last admin. Promote someone else first.', 400, 'LAST_ADMIN_GUARD');
                }
            }

            targetMembership.role = newRole;
            await targetMembership.save({ transaction });

            await transaction.commit();
            logger.info(`User ${targetUserId} role changed to ${newRole} in workspace ${workspaceId} by ${requesterId}`);
            return targetMembership;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // ============== INVITATION METHODS ==============

    /**
     * Send workspace invitation via email
     */
    async sendInvitation({ requesterId, workspaceId, email, role, message }) {
        const { WorkspaceInvitation, Organization } = require('../config/database');
        const emailModule = require('../modules/email');

        const transaction = await sequelize.transaction();
        try {
            // 1. Verify requester is admin
            const requesterMembership = await WorkspaceMembership.findOne({
                where: { workspace_id: workspaceId, user_id: requesterId, role: WORKSPACE_ROLES.ADMIN, status: MEMBER_STATUS.ACTIVE },
                transaction
            });
            if (!requesterMembership) {
                throw new AppError('Only workspace admins can send invitations', 403, 'ACCESS_DENIED');
            }

            // 2. Get workspace and org details
            const workspace = await Workspace.findByPk(workspaceId, { transaction });
            if (!workspace) throw new AppError('Workspace not found', 404, 'NOT_FOUND');

            const organization = await Organization.findByPk(workspace.org_id, { transaction });

            // 3. Check for existing pending invitation
            const existingInvite = await WorkspaceInvitation.findOne({
                where: { workspace_id: workspaceId, invited_email: email, status: 'pending' },
                transaction
            });
            if (existingInvite && !existingInvite.isExpired()) {
                throw new AppError('An invitation has already been sent to this email', 409, 'ALREADY_INVITED');
            }

            // 4. Create invitation
            const code = WorkspaceInvitation.generateCode();
            const codeHash = WorkspaceInvitation.hashCode(code);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            const invitation = await WorkspaceInvitation.create({
                workspace_id: workspaceId,
                invited_email: email,
                role: role || WORKSPACE_ROLES.VIEWER,
                code_hash: codeHash,
                invited_by: requesterId,
                expires_at: expiresAt,
                message: message || null,
                status: 'pending'
            }, { transaction });

            // 5. Get inviter email
            const inviter = await UserMetadata.findByPk(requesterId, { attributes: ['email'], transaction });

            // 6. Send email (non-blocking)
            const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/workspace-invite?code=${code}`;

            setImmediate(async () => {
                try {
                    await emailModule.send({
                        type: emailModule.EMAIL_TYPES.WORKSPACE_INVITATION,
                        to: email,
                        data: {
                            workspaceName: workspace.name,
                            organizationName: organization?.name || 'Organization',
                            inviterEmail: inviter?.email || 'A team member',
                            role: role || WORKSPACE_ROLES.VIEWER,
                            message: message,
                            invitationLink,
                            expiresAt: expiresAt.toLocaleDateString()
                        }
                    });
                    logger.info(`Workspace invitation email sent to ${email}`);
                } catch (emailErr) {
                    logger.error('Failed to send workspace invitation email:', emailErr);
                }
            });

            await transaction.commit();
            logger.info(`Workspace invitation created for ${email} to workspace ${workspaceId}`);
            return invitation;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get pending invitations for a workspace
     */
    async getInvitations(workspaceId) {
        const { WorkspaceInvitation } = require('../config/database');
        return await WorkspaceInvitation.findAll({
            where: { workspace_id: workspaceId, status: 'pending' },
            include: [{
                model: UserMetadata,
                as: 'Inviter',
                attributes: ['email']
            }],
            order: [['created_at', 'DESC']]
        });
    }

    /**
     * Revoke a pending invitation
     */
    async revokeInvitation({ requesterId, workspaceId, invitationId }) {
        const { WorkspaceInvitation } = require('../config/database');
        const transaction = await sequelize.transaction();
        try {
            // Verify admin
            const membership = await WorkspaceMembership.findOne({
                where: { workspace_id: workspaceId, user_id: requesterId, role: WORKSPACE_ROLES.ADMIN, status: MEMBER_STATUS.ACTIVE },
                transaction
            });
            if (!membership) {
                throw new AppError('Only workspace admins can revoke invitations', 403, 'ACCESS_DENIED');
            }

            const invitation = await WorkspaceInvitation.findOne({
                where: { id: invitationId, workspace_id: workspaceId },
                transaction
            });
            if (!invitation) throw new AppError('Invitation not found', 404, 'NOT_FOUND');

            invitation.status = 'revoked';
            await invitation.save({ transaction });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Accept workspace invitation (called when user clicks the email link)
     * @param {string} code - The raw invitation code from the URL
     * @param {string} userId - The authenticated user's ID
     */
    async acceptInvitation({ code, userId }) {
        const { WorkspaceInvitation, Organization } = require('../config/database');
        const { INVITATION_STATUS } = require('../config/constants');

        const transaction = await sequelize.transaction();
        try {
            // 1. Find invitation by code hash
            const codeHash = WorkspaceInvitation.hashCode(code);
            const invitation = await WorkspaceInvitation.findOne({
                where: { code_hash: codeHash },
                include: [{
                    model: Workspace,
                    as: 'Workspace'
                }],
                transaction
            });

            if (!invitation) {
                throw new AppError('Invalid or expired invitation', 400, 'INVALID_INVITATION');
            }

            // 2. Check status
            if (invitation.status !== INVITATION_STATUS.PENDING) {
                throw new AppError(`Invitation has already been ${invitation.status}`, 400, 'INVITATION_USED');
            }

            // 3. Check expiry
            if (invitation.isExpired()) {
                invitation.status = INVITATION_STATUS.EXPIRED;
                await invitation.save({ transaction });
                await transaction.commit();
                throw new AppError('Invitation has expired', 400, 'INVITATION_EXPIRED');
            }

            // 4. Get user email to verify it matches
            const user = await UserMetadata.findByPk(userId, { transaction });
            if (!user) {
                throw new AppError('User not found', 404, 'USER_NOT_FOUND');
            }

            // Optional: Check email matches (can be relaxed for flexibility)
            // if (user.email.toLowerCase() !== invitation.invited_email.toLowerCase()) {
            //     throw new AppError('This invitation was sent to a different email', 403, 'EMAIL_MISMATCH');
            // }

            // 5. Check if user is already a member
            const existingMembership = await WorkspaceMembership.findOne({
                where: { workspace_id: invitation.workspace_id, user_id: userId, status: MEMBER_STATUS.ACTIVE },
                transaction
            });

            if (existingMembership) {
                throw new AppError('You are already a member of this workspace', 409, 'ALREADY_MEMBER');
            }

            // 6. Check if user is in the organization (required for workspace membership)
            const workspace = invitation.Workspace;
            const orgMembership = await OrganizationMembership.findOne({
                where: { user_id: userId, org_id: workspace.org_id },
                transaction
            });

            if (!orgMembership) {
                // User must join org first - for now, throw error
                // Future: Could auto-add to org or trigger org invite
                throw new AppError('You must be a member of the organization first. Contact an admin.', 403, 'NOT_IN_ORG');
            }

            // 7. Create workspace membership
            const membership = await WorkspaceMembership.create({
                workspace_id: invitation.workspace_id,
                user_id: userId,
                role: invitation.role,
                status: MEMBER_STATUS.ACTIVE,
                created_by: userId
            }, { transaction });

            // 8. Mark invitation as accepted
            invitation.status = INVITATION_STATUS.ACCEPTED;
            invitation.accepted_by = userId;
            invitation.accepted_at = new Date();
            await invitation.save({ transaction });

            await transaction.commit();
            logger.info(`User ${userId} accepted workspace invitation for ${invitation.workspace_id}`);

            return {
                membership,
                workspace: {
                    id: workspace.id,
                    name: workspace.name,
                    slug: workspace.slug
                }
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get invitation details by code (for preview before accepting)
     */
    async getInvitationByCode(code) {
        const { WorkspaceInvitation, Organization } = require('../config/database');
        const { INVITATION_STATUS } = require('../config/constants');

        const codeHash = WorkspaceInvitation.hashCode(code);
        const invitation = await WorkspaceInvitation.findOne({
            where: { code_hash: codeHash },
            include: [{
                model: Workspace,
                as: 'Workspace',
                include: [{
                    model: Organization,
                    as: 'Organization',
                    attributes: ['id', 'name']
                }]
            }, {
                model: UserMetadata,
                as: 'Inviter',
                attributes: ['email']
            }],
            attributes: ['id', 'invited_email', 'role', 'status', 'expires_at', 'message', 'created_at']
        });

        if (!invitation) {
            throw new AppError('Invalid invitation link', 400, 'INVALID_INVITATION');
        }

        // Check if expired but not yet marked
        if (invitation.status === INVITATION_STATUS.PENDING && invitation.isExpired()) {
            return {
                ...invitation.toJSON(),
                status: 'expired',
                isValid: false
            };
        }

        return {
            ...invitation.toJSON(),
            isValid: invitation.status === INVITATION_STATUS.PENDING
        };
    }
}

module.exports = new WorkspaceService();
