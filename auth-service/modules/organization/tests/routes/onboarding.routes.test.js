const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../../../middleware/authMiddleware', () => ({
    authMiddleware: (req, res, next) => {
        req.user = {
            id: 'test-user-id',
            keycloak_id: 'kc-123',
            email: 'test@example.com',
            email_verified: true,
            hasPermission: () => true,
            hasRole: () => true,
            hasAnyRole: () => true,
            roles: ['admin']
        };
        next();
    },
    requireSuperAdmin: () => (req, res, next) => next()
}));

jest.mock('../../../../config/database', () => {
    return {
        Invitation: { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn(), update: jest.fn() },
        PendingInvitation: { findOne: jest.fn(), create: jest.fn() },
        Organization: { findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
        OrganizationMembership: { count: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
        UserMetadata: { findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
        Role: { findOne: jest.fn(), findByPk: jest.fn() },
        sequelize: {
            transaction: jest.fn(() => ({ commit: jest.fn(), rollback: jest.fn() }))
        }
    };
});

jest.mock('../../../../config', () => ({
    loadClients: jest.fn().mockResolvedValue({
        'test-client': { client_id: 'test-client-id' }
    })
}));

jest.mock('../../../../services/audit.service', () => ({
    log: jest.fn()
}));

jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
}));

jest.mock('../../services/organization.service', () => ({
    generateUniqueTenantId: jest.fn().mockResolvedValue('test-org'),
    createOrganization: jest.fn().mockResolvedValue({
        organization: { id: 'org-1', name: 'Test Org', tenant_id: 'test-org', status: 'active' },
        membership: { id: 'mem-1', user_id: 'test-user-id' },
        tenantId: 'test-org',
        ownerRole: { name: 'owner' }
    })
}));

jest.mock('../../services/invitation.service', () => ({
    sendOrganizationInvite: jest.fn().mockResolvedValue({
        invitation: { id: 'inv-1', status: 'pending', expires_at: new Date() },
        organization: { name: 'Test Org' },
        role: { name: 'Member' },
        invitationLink: 'http://test/link'
    }),
    acceptOrganizationInvite: jest.fn().mockResolvedValue({
        already_member: false,
        organization: { id: 'org-1', name: 'Test Org', tenant_id: 'test-org' },
        membership: { id: 'mem-1', created_at: new Date() },
        role: { name: 'Member' }
    }),
    hashInvitationCode: jest.fn().mockReturnValue('hashed-code'),
    generateInvitationCode: jest.fn().mockReturnValue('fake-code-123')
}));

jest.mock('crypto', () => ({
    randomBytes: jest.fn().mockReturnValue({ toString: () => 'fake-code-123' }),
    createHash: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-code')
    })
}));


const onboardingRouter = require('../../routes/onboarding.routes');
const { errorHandler, AppError } = require('../../../../middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api/org-onboarding', onboardingRouter);
app.use((err, req, res, next) => {
    console.error('TEST ERROR HIT:', err);
    errorHandler(err, req, res, next);
});

describe('Onboarding Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/org-onboarding/create', () => {
        it('should successfully create an organization', async () => {
            const response = await request(app)
                .post('/api/org-onboarding/create')
                .send({
                    name: 'My New Org',
                    client_key: 'test-client',
                    description: 'Test description'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.organization.name).toBe('Test Org');
            expect(response.body.data.tenant_mapping.client_key).toBe('test-client');
        });

        it('should fail with invalid payload', async () => {
            const response = await request(app)
                .post('/api/org-onboarding/create')
                .send({
                    name: 'A' // Too short
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('VALIDATION_ERROR');
        });
    });

    describe('POST /api/org-onboarding/join', () => {
        it('should successfully join an organization using an invite code', async () => {
            const response = await request(app)
                .post('/api/org-onboarding/join')
                .send({
                    invitation_code: 'valid-code-1234'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toBe('Successfully joined organization');
        });
    });

    describe('POST /api/org-onboarding/invitations', () => {
        it('should successfully send an invitation', async () => {
            const response = await request(app)
                .post('/api/org-onboarding/invitations')
                .send({
                    org_id: '123e4567-e89b-12d3-a456-426614174000',
                    invited_email: 'newbie@example.com',
                    role_id: '123e4567-e89b-12d3-a456-426614174001',
                    expires_in_days: 7
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.invitation.invited_email).toBe('newbie@example.com');
        });
    });
});
