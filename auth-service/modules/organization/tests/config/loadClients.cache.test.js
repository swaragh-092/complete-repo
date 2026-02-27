'use strict';

// We need to mock Client and Realm before requiring config/index.js
const mockFindAll = jest.fn();
jest.mock('../../../../config/database', () => ({
    Client: { findAll: mockFindAll },
    Realm: {},
    Organization: {},
    UserMetadata: {},
    OrganizationMembership: {},
    Role: {},
    Permission: {},
    RolePermission: {},
    Workspace: {},
    WorkspaceMembership: {},
    sequelize: { transaction: jest.fn() }
}));

// Prevent keycloak.service lazy-load side effects
jest.mock('../../../../services/keycloak.service', () => jest.fn());

describe('loadClients TTL cache', () => {
    let loadClients, invalidateClientCache;

    const fakeClients = [
        {
            client_key: 'app-1',
            client_id: 'cid-1',
            client_secret: 'secret-1',
            callback_url: '/cb',
            redirect_url: '/rd',
            requires_tenant: false,
            requires_organization: false,
            Realm: { realm_name: 'test-realm', id: 'r-1' }
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        // Re-import to get fresh module with cache reset
        jest.resetModules();

        jest.mock('../../../../config/database', () => ({
            Client: { findAll: mockFindAll },
            Realm: {},
            Organization: {},
            UserMetadata: {},
            OrganizationMembership: {},
            Role: {},
            Permission: {},
            RolePermission: {},
            Workspace: {},
            WorkspaceMembership: {},
            sequelize: { transaction: jest.fn() }
        }));
        jest.mock('../../../../services/keycloak.service', () => jest.fn());

        const config = require('../../../../config/index');
        loadClients = config.loadClients;
        invalidateClientCache = config.invalidateClientCache;

        mockFindAll.mockResolvedValue(fakeClients);
    });

    it('should query DB on first call', async () => {
        const result = await loadClients();

        expect(mockFindAll).toHaveBeenCalledTimes(1);
        expect(result['app-1']).toBeDefined();
        expect(result['app-1'].realm).toBe('test-realm');
    });

    it('should return cached result on second call within TTL', async () => {
        await loadClients();
        await loadClients();

        // DB should only be queried once
        expect(mockFindAll).toHaveBeenCalledTimes(1);
    });

    it('should re-query DB after invalidateClientCache()', async () => {
        await loadClients();
        expect(mockFindAll).toHaveBeenCalledTimes(1);

        invalidateClientCache();
        await loadClients();

        expect(mockFindAll).toHaveBeenCalledTimes(2);
    });

    it('should always include auth-service in results', async () => {
        const result = await loadClients();

        expect(result['auth-service']).toBeDefined();
        expect(result['auth-service'].client_id).toBe('auth-service');
    });
});
