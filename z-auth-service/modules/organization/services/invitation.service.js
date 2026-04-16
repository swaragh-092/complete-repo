'use strict';

const {
    Invitation,
    PendingInvitation,
    Organization,
    OrganizationMembership,
    UserMetadata,
    Role,
    sequelize
} = require('../../../config/database');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { AppError } = require('../../../middleware/errorHandler');
const logger = require('../../../utils/logger');
const emailModule = require('../../../services/email-client');
const AuditService = require('../../../services/audit.service');

class InvitationService {

    static generateInvitationCode() {
        return crypto.randomBytes(32).toString('hex');
    }

    static hashInvitationCode(code) {
        return crypto.createHash('sha256').update(code).digest('hex');
    }

    /**
     * Send an organization invitation
     */
    static async sendOrganizationInvite(data) {
        const { org_id, invited_email, role_id, expires_in_days, message, user } = data;
        const transaction = await sequelize.transaction();

        try {
            // 1. Verify organization exists
            const organization = await Organization.findByPk(org_id, { transaction });
            if (!organization) {
                throw new AppError('The specified organization does not exist', 404, 'ORGANIZATION_NOT_FOUND');
            }

            // 2. Verify role exists
            const role = await Role.findByPk(role_id, { transaction });
            if (!role) {
                throw new AppError('The specified role does not exist', 404, 'ROLE_NOT_FOUND');
            }

            // 3. Check for existing pending invitation
            const existingInvitation = await Invitation.findOne({
                where: {
                    org_id,
                    invited_email,
                    status: 'pending'
                },
                transaction
            });

            if (existingInvitation) {
                throw new AppError(`A pending invitation for ${invited_email} already exists for this organization`, 409, 'INVITATION_ALREADY_EXISTS');
            }

            // 4. Check if user is already a member
            const existingUser = await UserMetadata.findOne({ where: { email: invited_email }, transaction });
            if (existingUser) {
                const existingMembership = await OrganizationMembership.findOne({
                    where: { user_id: existingUser.id, org_id },
                    transaction
                });

                if (existingMembership) {
                    throw new AppError('This user is already a member of the organization', 409, 'MEMBER_ALREADY_EXISTS');
                }
            }

            // 5. Generate codes
            const invitationCode = this.generateInvitationCode();
            const codeHash = this.hashInvitationCode(invitationCode);

            // 6. Create invitation
            const invitation = await Invitation.create({
                org_id,
                invited_email,
                role_id,
                code_hash: codeHash,
                invited_by: user.id,
                expires_at: new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000),
                status: 'pending'
            }, { transaction });

            // 7. Create audit log
            await AuditService.log({
                action: 'INVITATION_CREATED',
                userId: user.id,
                orgId: org_id,
                metadata: {
                    invitation_id: invitation.id,
                    invited_email,
                    role_name: role.name,
                    expires_at: invitation.expires_at,
                    created_by: user.email
                }
            });

            await transaction.commit();

            // 8. Build link and send email asynchronously
            const baseUrl = process.env.ACCOUNT_UI_URL || process.env.FRONTEND_URL || 'https://account.local.test:5174';
            const invitationLink = `${baseUrl}/join?code=${invitationCode}`;

            setImmediate(async () => {
                try {
                    await emailModule.send({
                        type: emailModule.EMAIL_TYPES.ORGANIZATION_INVITATION,
                        to: invited_email,
                        data: {
                            organizationName: organization.name,
                            inviterEmail: user.email,
                            inviterName: user.name || user.email,
                            roleName: role.name,
                            invitationLink: invitationLink,
                            expiresAt: invitation.expires_at,
                            message: message || null,
                            appName: process.env.APP_NAME || 'SSO Platform'
                        }
                    });
                    logger.info('📧 Invitation email sent successfully to:', invited_email);
                    await invitation.update({ email_status: 'delivered' });
                } catch (emailError) {
                    logger.error('📧 Failed to send invitation email:', emailError);
                    await invitation.update({ email_status: 'failed' });
                }
            });

            return {
                invitation,
                organization,
                role,
                invitationLink
            };

        } catch (error) {
            await transaction.rollback();
            logger.error('Invitation creation failed', {
                error: error.message,
                stack: error.stack,
                orgId: org_id,
                invitedEmail: invited_email
            });
            throw error;
        }
    }

    /**
     * Accept a pending invitation code
     */
    static async acceptOrganizationInvite(data) {
        const { invitation_code, user } = data;
        const codeHash = this.hashInvitationCode(invitation_code);
        const transaction = await sequelize.transaction();

        try {
            // 1. Find valid invitation
            const invitation = await Invitation.findOne({
                where: {
                    code_hash: codeHash,
                    status: 'pending'
                },
                include: [
                    { model: Organization, attributes: ['id', 'name', 'tenant_id', 'status'] },
                    { model: Role, attributes: ['id', 'name', 'description'] }
                ],
                transaction
            });

            if (!invitation) {
                await transaction.rollback();
                throw new AppError('Invitation code is invalid or has already been used', 404, 'INVALID_INVITATION');
            }

            // 2. Check expiry
            if (invitation.expires_at && new Date() > invitation.expires_at) {
                await invitation.update({ status: 'expired' }, { transaction });
                await transaction.rollback();
                throw new AppError('This invitation has expired', 410, 'INVITATION_EXPIRED');
            }

            // 3. Verify email match
            if (invitation.invited_email !== user.email) {
                await transaction.rollback();
                throw new AppError('This invitation was sent to a different email address', 403, 'EMAIL_MISMATCH');
            }

            // 4. Ensure user metadata exists
            let userMetadata = await UserMetadata.findOne({
                where: { keycloak_id: user.keycloak_id },
                transaction
            });

            if (!userMetadata) {
                userMetadata = await UserMetadata.create({
                    keycloak_id: user.keycloak_id,
                    email: user.email,
                    is_active: true,
                    last_login: new Date()
                }, { transaction });
            }

            // 5. Check if user is already a member
            const existingMembership = await OrganizationMembership.findOne({
                where: { user_id: userMetadata.id, org_id: invitation.org_id },
                transaction
            });

            if (existingMembership) {
                await invitation.update({
                    status: 'accepted',
                    accepted_by: userMetadata.id,
                    accepted_at: new Date()
                }, { transaction });

                await transaction.commit();
                return {
                    already_member: true,
                    membership: existingMembership,
                    organization: invitation.Organization
                };
            }

            // 6. Create membership
            const membership = await OrganizationMembership.create({
                user_id: userMetadata.id,
                org_id: invitation.org_id,
                role_id: invitation.role_id
            }, { transaction });

            // 7. Update User's primary org if not set
            if (!userMetadata.org_id) {
                await userMetadata.update({
                    org_id: invitation.org_id,
                    primary_org_id: invitation.org_id
                }, { transaction });
            }

            // 8. Mark invitation as accepted
            await invitation.update({
                status: 'accepted',
                accepted_by: userMetadata.id,
                accepted_at: new Date()
            }, { transaction });

            // 9. Create audit log
            await AuditService.log({
                action: 'ORG_JOINED_VIA_INVITATION',
                userId: userMetadata.id,
                orgId: invitation.org_id,
                metadata: {
                    org_name: invitation.Organization.name,
                    user_email: user.email,
                    role_name: invitation.Role.name,
                    invitation_id: invitation.id,
                    invited_by: invitation.invited_by
                }
            });

            await transaction.commit();

            return {
                already_member: false,
                membership,
                organization: invitation.Organization,
                role: invitation.Role
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Revoke a pending invitation
     */
    static async revokeInvitation({ invitationId, user }) {
        const transaction = await sequelize.transaction();

        try {
            // 1. Find the invitation
            const invitation = await Invitation.findOne({
                where: { id: invitationId },
                include: [
                    { model: Organization, attributes: ['id', 'name'] }
                ],
                transaction
            });

            if (!invitation) {
                throw new AppError('Invitation not found', 404, 'INVITATION_NOT_FOUND');
            }

            // 2. Only pending invitations can be revoked
            if (invitation.status !== 'pending') {
                throw new AppError(
                    `Cannot revoke invitation with status "${invitation.status}". Only pending invitations can be revoked.`,
                    400,
                    'INVALID_INVITATION_STATUS'
                );
            }

            // 3. Update status to revoked
            await invitation.update({ status: 'revoked' }, { transaction });

            // 4. Audit log
            await AuditService.log({
                action: 'INVITATION_REVOKED',
                userId: user.id,
                orgId: invitation.org_id,
                metadata: {
                    invitation_id: invitationId,
                    invited_email: invitation.invited_email,
                    revoked_by: user.email,
                    org_name: invitation.Organization?.name
                }
            });

            await transaction.commit();

            logger.info('Invitation revoked successfully', {
                invitationId,
                orgId: invitation.org_id,
                revokedBy: user.id
            });

            return {
                success: true,
                invitation: {
                    id: invitation.id,
                    invited_email: invitation.invited_email,
                    status: 'revoked'
                }
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = InvitationService;
