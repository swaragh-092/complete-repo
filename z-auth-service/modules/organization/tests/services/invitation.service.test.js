const InvitationService = require('../../services/invitation.service');
const { Invitation, PendingInvitation, Organization, OrganizationMembership, UserMetadata, Role, sequelize } = require('../../../../config/database');
const { AppError } = require('../../../../middleware/errorHandler');
const crypto = require('crypto');
const emailModule = require('../../../../services/email-client');
const AuditService = require('../../../../services/audit.service');

jest.mock('../../../../config/database', () => {
    return {
        Invitation: { findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
        PendingInvitation: { findOne: jest.fn(), create: jest.fn() },
        Organization: { findByPk: jest.fn() },
        OrganizationMembership: { findOne: jest.fn(), create: jest.fn() },
        UserMetadata: { findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
        Role: { findByPk: jest.fn() },
        sequelize: {
            transaction: jest.fn(() => ({ commit: jest.fn(), rollback: jest.fn() }))
        }
    };
});

jest.mock('../../../../services/email-client', () => ({
    send: jest.fn(),
    EMAIL_TYPES: { ORGANIZATION_INVITATION: 'ORGANIZATION_INVITATION' }
}));

jest.mock('../../../../services/audit.service', () => ({
    log: jest.fn()
}));

describe('InvitationService', () => {
    let mockTransaction;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelize.transaction.mockResolvedValue(mockTransaction);
    });

    describe('generateInvitationCode and hashInvitationCode', () => {
        it('should generate a 64 character hex string', () => {
            const code = InvitationService.generateInvitationCode();
            expect(code).toHaveLength(64);
            expect(typeof code).toBe('string');
        });

        it('should consistently hash the code', () => {
            const code = 'my-secret-code';
            const hash1 = InvitationService.hashInvitationCode(code);
            const hash2 = InvitationService.hashInvitationCode(code);

            expect(hash1).toBe(hash2);
            expect(hash1).toBe(crypto.createHash('sha256').update(code).digest('hex'));
        });
    });

    describe('sendOrganizationInvite', () => {
        const inviteData = {
            org_id: 'org-1',
            invited_email: 'newuser@test.com',
            role_id: 'role-1',
            expires_in_days: 7,
            message: 'Welcome to the team',
            user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin User' }
        };

        it('should throw Error if organization not found', async () => {
            Organization.findByPk.mockResolvedValue(null);

            await expect(InvitationService.sendOrganizationInvite(inviteData))
                .rejects.toThrow(AppError);

            expect(mockTransaction.rollback).toHaveBeenCalled();
        });

        it('should throw Error if role not found', async () => {
            Organization.findByPk.mockResolvedValue({ id: 'org-1' });
            Role.findByPk.mockResolvedValue(null);

            await expect(InvitationService.sendOrganizationInvite(inviteData))
                .rejects.toThrow('The specified role does not exist');

            expect(mockTransaction.rollback).toHaveBeenCalled();
        });

        it('should successfully create invitation request', async () => {
            Organization.findByPk.mockResolvedValue({ id: 'org-1', name: 'Test Org' });
            Role.findByPk.mockResolvedValue({ id: 'role-1', name: 'Member' });

            // Pending checks
            Invitation.findOne.mockResolvedValue(null);
            UserMetadata.findOne.mockResolvedValue(null);

            // Creation
            Invitation.create.mockResolvedValue({ id: 'inv-1', expires_at: new Date(), update: jest.fn() });

            const result = await InvitationService.sendOrganizationInvite(inviteData);

            expect(result.invitation.id).toBe('inv-1');
            expect(result.invitationLink).toContain('/join?code=');
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(AuditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'INVITATION_CREATED'
            }));

            // Emulate setImmediate resolving the async email trigger in standard run
            await new Promise(resolve => setImmediate(resolve));
            expect(emailModule.send).toHaveBeenCalled();
        });
    });

    describe('acceptOrganizationInvite', () => {
        const acceptData = {
            invitation_code: 'some-random-code',
            user: { keycloak_id: 'kc-test', email: 'newuser@test.com' }
        };

        it('should throw Error if invitation is invalid or used', async () => {
            Invitation.findOne.mockResolvedValue(null); // Invalid invite

            await expect(InvitationService.acceptOrganizationInvite(acceptData))
                .rejects.toThrow('Invitation code is invalid or has already been used');

            expect(mockTransaction.rollback).toHaveBeenCalled();
        });

        it('should throw Error if email does not match', async () => {
            Invitation.findOne.mockResolvedValue({
                invited_email: 'otheruser@test.com' // Mismatch
            });

            await expect(InvitationService.acceptOrganizationInvite(acceptData))
                .rejects.toThrow('This invitation was sent to a different email address');
        });

        it('should handle successful invite acceptance', async () => {
            const mockUpdate = jest.fn();
            Invitation.findOne.mockResolvedValue({
                id: 'inv-1',
                invited_email: 'newuser@test.com',
                org_id: 'org-1',
                role_id: 'role-1',
                update: mockUpdate,
                Organization: { name: 'Test Org' },
                Role: { name: 'Member' }
            });

            UserMetadata.findOne.mockResolvedValue(null);

            const mockUserUpdate = jest.fn();
            UserMetadata.create.mockResolvedValue({
                id: 'user-1',
                org_id: null,
                update: mockUserUpdate
            });

            OrganizationMembership.findOne.mockResolvedValue(null); // Not already a member
            OrganizationMembership.create.mockResolvedValue({ id: 'mem-1' });

            const result = await InvitationService.acceptOrganizationInvite(acceptData);

            expect(result.already_member).toBe(false);
            expect(mockUserUpdate).toHaveBeenCalledWith(expect.objectContaining({ org_id: 'org-1' }), expect.any(Object));
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'accepted' }), expect.any(Object));
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(AuditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'ORG_JOINED_VIA_INVITATION'
            }));
        });
    });

    describe('revokeInvitation', () => {
        it('should throw Error if invitation not found', async () => {
            Invitation.findOne.mockResolvedValue(null);

            await expect(InvitationService.revokeInvitation({
                invitationId: 'inv-nonexistent',
                user: { id: 'admin-1', email: 'admin@test.com' }
            })).rejects.toThrow('Invitation not found');

            expect(mockTransaction.rollback).toHaveBeenCalled();
        });

        it('should throw Error if invitation is not pending', async () => {
            Invitation.findOne.mockResolvedValue({
                id: 'inv-1',
                status: 'accepted',
                org_id: 'org-1',
                invited_email: 'user@test.com',
                Organization: { name: 'Test Org' },
                update: jest.fn()
            });

            await expect(InvitationService.revokeInvitation({
                invitationId: 'inv-1',
                user: { id: 'admin-1', email: 'admin@test.com' }
            })).rejects.toThrow('Only pending invitations can be revoked');

            expect(mockTransaction.rollback).toHaveBeenCalled();
        });

        it('should successfully revoke a pending invitation', async () => {
            const mockUpdate = jest.fn();
            Invitation.findOne.mockResolvedValue({
                id: 'inv-1',
                status: 'pending',
                org_id: 'org-1',
                invited_email: 'user@test.com',
                Organization: { name: 'Test Org' },
                update: mockUpdate
            });

            const result = await InvitationService.revokeInvitation({
                invitationId: 'inv-1',
                user: { id: 'admin-1', email: 'admin@test.com' }
            });

            expect(result.success).toBe(true);
            expect(result.invitation.status).toBe('revoked');
            expect(mockUpdate).toHaveBeenCalledWith(
                { status: 'revoked' },
                expect.objectContaining({})
            );
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(AuditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'INVITATION_REVOKED'
            }));
        });
    });

    describe('email_status tracking', () => {
        const inviteData = {
            org_id: 'org-1',
            invited_email: 'newuser@test.com',
            role_id: 'role-1',
            expires_in_days: 7,
            message: 'Welcome',
            user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin' }
        };

        it('should update email_status to delivered on successful email send', async () => {
            Organization.findByPk.mockResolvedValue({ id: 'org-1', name: 'Test Org' });
            Role.findByPk.mockResolvedValue({ id: 'role-1', name: 'Member' });
            Invitation.findOne.mockResolvedValue(null);
            UserMetadata.findOne.mockResolvedValue(null);

            const mockInvUpdate = jest.fn();
            Invitation.create.mockResolvedValue({
                id: 'inv-1',
                expires_at: new Date(),
                update: mockInvUpdate
            });

            emailModule.send.mockResolvedValue(true);

            await InvitationService.sendOrganizationInvite(inviteData);

            // Wait for setImmediate to fire
            await new Promise(resolve => setImmediate(resolve));

            expect(emailModule.send).toHaveBeenCalled();
            expect(mockInvUpdate).toHaveBeenCalledWith({ email_status: 'delivered' });
        });

        it('should update email_status to failed on email send failure', async () => {
            Organization.findByPk.mockResolvedValue({ id: 'org-1', name: 'Test Org' });
            Role.findByPk.mockResolvedValue({ id: 'role-1', name: 'Member' });
            Invitation.findOne.mockResolvedValue(null);
            UserMetadata.findOne.mockResolvedValue(null);

            const mockInvUpdate = jest.fn();
            Invitation.create.mockResolvedValue({
                id: 'inv-1',
                expires_at: new Date(),
                update: mockInvUpdate
            });

            emailModule.send.mockRejectedValue(new Error('SMTP connection failed'));

            await InvitationService.sendOrganizationInvite(inviteData);

            // Wait for setImmediate to fire
            await new Promise(resolve => setImmediate(resolve));

            expect(emailModule.send).toHaveBeenCalled();
            expect(mockInvUpdate).toHaveBeenCalledWith({ email_status: 'failed' });
        });
    });
});
