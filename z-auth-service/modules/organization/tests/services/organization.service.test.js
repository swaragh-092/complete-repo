const OrganizationService = require('../../services/organization.service');
const { Organization, OrganizationMembership, UserMetadata, Role, TenantMapping, sequelize } = require('../../../../config/database');
const AuditService = require('../../../../services/audit.service');
const { AppError } = require('../../../../middleware/errorHandler');

// Mock Dependencies
jest.mock('../../../../config/database', () => {
    const SequelizeMock = require('sequelize');
    return {
        Organization: { findOne: jest.fn(), create: jest.fn() },
        OrganizationMembership: { create: jest.fn() },
        UserMetadata: { findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
        Role: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
        TenantMapping: { upsert: jest.fn() },
        sequelize: {
            transaction: jest.fn(() => ({ commit: jest.fn(), rollback: jest.fn() })),
            Op: SequelizeMock.Op
        }
    };
});

jest.mock('../../../../services/audit.service', () => ({
    log: jest.fn()
}));

jest.mock('uuid', () => ({
    v4: jest.fn().mockReturnValue('fake-hash')
}));

describe('OrganizationService', () => {
    let mockTransaction;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTransaction = { commit: jest.fn(), rollback: jest.fn(), finished: false };
        sequelize.transaction.mockResolvedValue(mockTransaction);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('generateUniqueTenantId', () => {
        it('should generate a simple slug for a regular name', async () => {
            Organization.findOne.mockResolvedValue(null);
            const tenantId = await OrganizationService.generateUniqueTenantId('My Company');
            expect(tenantId).toMatch(/^mycompany-[0-9a-z]{8}-[0-9a-z]{6}$/);
        });

        it('should clean up special characters', async () => {
            Organization.findOne.mockResolvedValue(null);
            const tenantId = await OrganizationService.generateUniqueTenantId('My @#$% Company!');
            expect(tenantId).toMatch(/^mycompany-[0-9a-z]{8}-[0-9a-z]{6}$/);
        });

        it('should append a counter if the tenant ID is taken', async () => {
            Organization.findOne
                .mockResolvedValueOnce({ id: 'org1' }) // First check finds collisions
                .mockResolvedValueOnce({ id: 'org2' })
                .mockResolvedValueOnce(null);          // Third check is free

            const tenantId = await OrganizationService.generateUniqueTenantId('Test Org');
            expect(tenantId).toMatch(/^testorg-[0-9a-z]{8}-[0-9a-z]{6}$/);
            expect(Organization.findOne).toHaveBeenCalledTimes(3);
        });
    });

    describe('createOrganization', () => {
        beforeEach(() => {
            // Mock out generation so integration tests are perfectly deterministic
            jest.spyOn(OrganizationService, 'generateUniqueTenantId').mockResolvedValue('new-org');
        });
        const defaultData = {
            name: 'New Org',
            description: 'A great organization',
            settings: { theme: 'dark' },
            user: { keycloak_id: 'kc-123', email: 'test@example.com' },
            client_key: 'test-client',
            isProvision: false,
            req: { ip: '127.0.0.1', get: () => 'Jest User Agent' }
        };

        it('should throw Conflict Error if organization name exists', async () => {
            Organization.findOne.mockResolvedValueOnce({ name: 'New Org' });

            await expect(OrganizationService.createOrganization(defaultData))
                .rejects
                .toThrow(AppError);

            expect(mockTransaction.rollback).toHaveBeenCalled();
        });

        it('should create Owner role if missing', async () => {
            Organization.findOne.mockResolvedValueOnce(null);
            Role.findOne.mockResolvedValueOnce(null);
            Role.create.mockResolvedValueOnce({ id: 'role-1', name: 'Owner' });
            UserMetadata.findOne.mockResolvedValueOnce({ id: 'user-1', update: jest.fn() });
            Organization.create.mockResolvedValueOnce({ id: 'org-1', name: 'New Org', tenant_id: 'new-org', status: 'active' });
            OrganizationMembership.create.mockResolvedValueOnce({ id: 'mem-1' });

            const result = await OrganizationService.createOrganization(defaultData);
            expect(result.ownerRole.id).toBe('role-1');
            expect(mockTransaction.commit).toHaveBeenCalled();
        });

        it('should handle full self-service creation successfully', async () => {
            // Mock unique checks and basic lookups
            Organization.findOne.mockResolvedValueOnce(null); // name check
            Role.findOne.mockResolvedValueOnce({ id: 'role-1', name: 'owner' });

            // Mock user metadata branch (User doesn't exist yet)
            UserMetadata.findOne.mockResolvedValueOnce(null);
            UserMetadata.create.mockResolvedValueOnce({ id: 'user-1', org_id: null, update: jest.fn() });

            // Mock creations
            Organization.create.mockResolvedValueOnce({ id: 'org-1', name: 'New Org', tenant_id: 'new-org', status: 'active' });
            OrganizationMembership.create.mockResolvedValueOnce({ id: 'mem-1' });

            const result = await OrganizationService.createOrganization(defaultData);

            expect(result.organization.id).toBe('org-1');
            expect(result.tenantId).toBe('new-org');
            expect(mockTransaction.commit).toHaveBeenCalled();

            // Verify TenantMapping
            expect(TenantMapping.upsert).toHaveBeenCalledWith({
                user_id: 'kc-123',
                tenant_id: 'new-org',
                client_key: 'test-client'
            }, { transaction: mockTransaction });

            // Verify Audit (Note: inside the service, audit is called OUTSIDE the transaction)
            expect(AuditService.log).not.toHaveBeenCalled(); // The refactored router does auditing, so service shouldn't do auditing except via caller
        });
    });
});
