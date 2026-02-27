const MembershipService = require('../../services/membership.service');
const { OrganizationMembership, UserMetadata, Organization, Role, sequelize } = require('../../../../config/database');
const { AppError } = require('../../../../middleware/errorHandler');

// Mock Dependencies
jest.mock('../../../../config/database', () => {
    const SequelizeMock = require('sequelize');
    return {
        OrganizationMembership: {
            findAll: jest.fn(),
            findByPk: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            count: jest.fn()
        },
        UserMetadata: {
            findByPk: jest.fn(),
            findOne: jest.fn()
        },
        Organization: {
            findByPk: jest.fn()
        },
        Role: {
            findByPk: jest.fn()
        },
        sequelize: {
            Op: SequelizeMock.Op
        }
    };
});

describe('MembershipService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createMembership', () => {
        const defaultData = {
            userId: 'user-1',
            orgId: 'org-1',
            roleId: 'role-1',
            clientOrgModel: 'multi'
        };

        it('should throw Error if user not found', async () => {
            UserMetadata.findByPk.mockResolvedValueOnce(null);

            await expect(MembershipService.createMembership(defaultData))
                .rejects
                .toThrow('User not found');
        });

        it('should throw Error if organization not found', async () => {
            UserMetadata.findByPk.mockResolvedValueOnce({ id: 'user-1' });
            Organization.findByPk.mockResolvedValueOnce(null);

            await expect(MembershipService.createMembership(defaultData))
                .rejects
                .toThrow('Organization not found');
        });

        it('should throw Error if role not found', async () => {
            UserMetadata.findByPk.mockResolvedValueOnce({ id: 'user-1' });
            Organization.findByPk.mockResolvedValueOnce({ id: 'org-1' });
            Role.findByPk.mockResolvedValueOnce(null);

            await expect(MembershipService.createMembership(defaultData))
                .rejects
                .toThrow('Role not found');
        });

        it('should throw Conflict if membership already exists', async () => {
            UserMetadata.findByPk.mockResolvedValueOnce({ id: 'user-1' });
            Organization.findByPk.mockResolvedValueOnce({ id: 'org-1' });
            Role.findByPk.mockResolvedValueOnce({ id: 'role-1' });
            OrganizationMembership.findOne.mockResolvedValueOnce({ id: 'mem-1' }); // Found existing

            await expect(MembershipService.createMembership(defaultData))
                .rejects
                .toThrow('User already has this role in this organization');
        });

        it('should block multiple org memberships in single org mode', async () => {
            UserMetadata.findByPk.mockResolvedValueOnce({ id: 'user-1' });
            Organization.findByPk.mockResolvedValueOnce({ id: 'org-1' });
            Role.findByPk.mockResolvedValueOnce({ id: 'role-1' });
            OrganizationMembership.findOne.mockResolvedValueOnce(null);

            // User already has membership in 'org-2'
            OrganizationMembership.findAll.mockResolvedValueOnce([{ org_id: 'org-2' }]);

            const singleOrgData = { ...defaultData, clientOrgModel: 'single' };

            await expect(MembershipService.createMembership(singleOrgData))
                .rejects
                .toThrow('This application only allows users to belong to one organization. Please leave your current organization first.');
        });

        it('should auto-set primary org on novel creation', async () => {
            const mockUserUpdate = jest.fn();
            UserMetadata.findByPk.mockResolvedValueOnce({ id: 'user-1', update: mockUserUpdate, primary_org_id: null });
            Organization.findByPk.mockResolvedValueOnce({ id: 'org-1', name: 'Test Org' });
            Role.findByPk.mockResolvedValueOnce({ id: 'role-1', name: 'Member' });
            OrganizationMembership.findOne.mockResolvedValueOnce(null);
            OrganizationMembership.findAll.mockResolvedValueOnce([]); // No existing

            OrganizationMembership.create.mockResolvedValueOnce({ id: 'mem-1' });

            const result = await MembershipService.createMembership(defaultData);

            expect(result.id).toBe('mem-1');
            expect(mockUserUpdate).toHaveBeenCalledWith({ primary_org_id: 'org-1' });
            expect(OrganizationMembership.create).toHaveBeenCalledWith({
                user_id: 'user-1',
                org_id: 'org-1',
                role_id: 'role-1'
            });
        });
    });

    describe('updateMembershipRole', () => {
        it('should throw Error if membership not found', async () => {
            OrganizationMembership.findByPk.mockResolvedValueOnce(null);
            await expect(MembershipService.updateMembershipRole('mem-1', 'role-2'))
                .rejects.toThrow('Organization membership not found');
        });

        it('should block duplicate role assignment', async () => {
            OrganizationMembership.findByPk.mockResolvedValueOnce({
                id: 'mem-1',
                user_id: 'user-1',
                org_id: 'org-1'
            });
            Role.findByPk.mockResolvedValueOnce({ id: 'role-2' });
            OrganizationMembership.findOne.mockResolvedValueOnce({ id: 'mem-2' }); // Duplicate found

            await expect(MembershipService.updateMembershipRole('mem-1', 'role-2'))
                .rejects.toThrow('User already has this role in this organization');
        });
    });

    describe('bulkAssign', () => {
        it('should return errors for missing users', async () => {
            Organization.findByPk.mockResolvedValueOnce({ id: 'org-1' });
            Role.findByPk.mockResolvedValueOnce({ id: 'role-1' });
            UserMetadata.findByPk.mockResolvedValueOnce(null); // User 1 missing

            const result = await MembershipService.bulkAssign({
                userIds: ['user-1'],
                orgId: 'org-1',
                roleId: 'role-1'
            });

            expect(result.errors.length).toBe(1);
            expect(result.created.length).toBe(0);
            expect(result.errorDetails[0]).toMatchObject({ error: 'User not found' });
        });
    });
});
