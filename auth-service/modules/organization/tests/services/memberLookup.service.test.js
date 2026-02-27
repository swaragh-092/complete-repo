'use strict';

const MemberLookupService = require('../../services/memberLookup.service');

// ─── Mock Sequelize models ────────────────────────────────────────────────────
const mockFindAll = jest.fn();
const mockUserFindAll = jest.fn();
const WorkspaceMembership = { findAll: mockFindAll };
const UserMetadata = { findAll: mockUserFindAll };
const Workspace = {};

// ─── Mock KeycloakService ─────────────────────────────────────────────────────
const mockGetUser = jest.fn();
jest.mock('../../../../services/keycloak.service', () => {
    return jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        getUser: mockGetUser
    }));
});

describe('MemberLookupService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('lookup()', () => {
        it('should return correct user+workspace pairs for given user_ids and workspace_ids', async () => {
            // Arrange: two users across two workspaces
            mockFindAll.mockResolvedValue([
                {
                    user_id: 'user-1',
                    workspace_id: 'ws-1',
                    role: 'admin',
                    status: 'active',
                    Workspace: { id: 'ws-1', name: 'Engineering' },
                    UserMetadata: { id: 'user-1', email: 'john@test.com', keycloak_id: 'kc-user-1' }
                },
                {
                    user_id: 'user-1',
                    workspace_id: 'ws-2',
                    role: 'viewer',
                    status: 'active',
                    Workspace: { id: 'ws-2', name: 'Design' },
                    UserMetadata: { id: 'user-1', email: 'john@test.com', keycloak_id: 'kc-user-1' }
                },
                {
                    user_id: 'user-2',
                    workspace_id: 'ws-1',
                    role: 'editor',
                    status: 'active',
                    Workspace: { id: 'ws-1', name: 'Engineering' },
                    UserMetadata: { id: 'user-2', email: 'jane@test.com', keycloak_id: 'kc-user-2' }
                }
            ]);

            mockGetUser
                .mockResolvedValueOnce({ id: 'kc-user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' })
                .mockResolvedValueOnce({ id: 'kc-user-2', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' });

            mockUserFindAll.mockResolvedValue([
                { id: 'user-1', keycloak_id: 'kc-user-1' },
                { id: 'user-2', keycloak_id: 'kc-user-2' }
            ]);

            // Act
            const result = await MemberLookupService.lookup({
                userIds: ['user-1', 'user-2'],
                workspaceIds: ['ws-1', 'ws-2'],
                models: { WorkspaceMembership, UserMetadata, Workspace }
            });

            // Assert
            expect(result.members).toHaveLength(2);

            const user1 = result.members.find(m => m.user.id === 'user-1');
            expect(user1.user.name).toBe('John Doe');
            expect(user1.user.email).toBe('john@test.com');
            expect(user1.workspaces).toHaveLength(2);
            expect(user1.workspaces[0]).toMatchObject({ id: 'ws-1', name: 'Engineering', role: 'admin' });
            expect(user1.workspaces[1]).toMatchObject({ id: 'ws-2', name: 'Design', role: 'viewer' });

            const user2 = result.members.find(m => m.user.id === 'user-2');
            expect(user2.user.name).toBe('Jane Smith');
            expect(user2.workspaces).toHaveLength(1);
        });

        it('should filter by workspace_ids only when user_ids not provided', async () => {
            mockFindAll.mockResolvedValue([
                {
                    user_id: 'user-3',
                    workspace_id: 'ws-1',
                    role: 'viewer',
                    status: 'active',
                    Workspace: { id: 'ws-1', name: 'Engineering' },
                    UserMetadata: { id: 'user-3', email: 'alex@test.com', keycloak_id: 'kc-user-3' }
                }
            ]);

            mockGetUser.mockResolvedValueOnce({ id: 'kc-user-3', firstName: 'Alex', lastName: 'Turner', email: 'alex@test.com' });

            const result = await MemberLookupService.lookup({
                workspaceIds: ['ws-1'],
                models: { WorkspaceMembership, UserMetadata, Workspace }
            });

            expect(result.members).toHaveLength(1);
            expect(result.members[0].user.name).toBe('Alex Turner');

            // Verify WHERE clause only included workspace_id
            const whereClause = mockFindAll.mock.calls[0][0].where;
            expect(whereClause.workspace_id).toBeDefined();
            expect(whereClause.user_id).toBeUndefined();
        });

        it('should filter by user_ids only when workspace_ids not provided', async () => {
            mockFindAll.mockResolvedValue([
                {
                    user_id: 'user-1',
                    workspace_id: 'ws-5',
                    role: 'admin',
                    status: 'active',
                    Workspace: { id: 'ws-5', name: 'QA' },
                    UserMetadata: { id: 'user-1', email: 'john@test.com', keycloak_id: 'kc-user-1' }
                }
            ]);

            mockGetUser.mockResolvedValueOnce({ id: 'kc-user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' });

            mockUserFindAll.mockResolvedValue([{ id: 'user-1', keycloak_id: 'kc-user-1' }]);

            const result = await MemberLookupService.lookup({
                userIds: ['user-1'],
                models: { WorkspaceMembership, UserMetadata, Workspace }
            });

            expect(result.members).toHaveLength(1);

            const whereClause = mockFindAll.mock.calls[0][0].where;
            expect(whereClause.user_id).toBeDefined();
            expect(whereClause.workspace_id).toBeUndefined();
        });

        it('should return empty members array for non-existent IDs', async () => {
            mockFindAll.mockResolvedValue([]);
            mockUserFindAll.mockResolvedValue([]);

            const result = await MemberLookupService.lookup({
                userIds: ['non-existent-id'],
                models: { WorkspaceMembership, UserMetadata, Workspace }
            });

            expect(result.members).toEqual([]);
            expect(mockGetUser).not.toHaveBeenCalled();
        });

        it('should reject when both user_ids and workspace_ids are empty', async () => {
            await expect(
                MemberLookupService.lookup({
                    userIds: [],
                    workspaceIds: [],
                    models: { WorkspaceMembership, UserMetadata, Workspace }
                })
            ).rejects.toThrow('At least one of user_ids or workspace_ids must be provided');
        });

        it('should gracefully handle Keycloak failures by falling back to email-only name', async () => {
            mockFindAll.mockResolvedValue([
                {
                    user_id: 'user-1',
                    workspace_id: 'ws-1',
                    role: 'admin',
                    status: 'active',
                    Workspace: { id: 'ws-1', name: 'Engineering' },
                    UserMetadata: { id: 'user-1', email: 'john@test.com', keycloak_id: 'kc-user-1' }
                }
            ]);

            mockGetUser.mockRejectedValueOnce(new Error('Keycloak unreachable'));

            mockUserFindAll.mockResolvedValue([{ id: 'user-1', keycloak_id: 'kc-user-1' }]);

            const result = await MemberLookupService.lookup({
                userIds: ['user-1'],
                models: { WorkspaceMembership, UserMetadata, Workspace }
            });

            // Should still return data, just without resolved name
            expect(result.members).toHaveLength(1);
            expect(result.members[0].user.name).toBe('john@test.com'); // fallback to email
        });
    });
});
