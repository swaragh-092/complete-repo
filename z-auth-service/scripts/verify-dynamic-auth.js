const { sequelize, Policy } = require('../config/database');
const AuthorizationService = require('../modules/authorization/engine/access-control');

async function testDynamicAuth() {
    console.log('--- Starting Dynamic Authorization Verification ---');

    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // 1. Create a Dynamic Policy (Allow access to specific workspace)
        const testPolicyName = 'Test-Dynamic-Allow-Workspace';
        await Policy.destroy({ where: { name: testPolicyName } }); // Cleanup

        console.log(`Creating dynamic policy: ${testPolicyName}...`);
        const policy = await Policy.create({
            name: testPolicyName,
            effect: 'allow',
            actions: ['workspace:view', 'workspace:manage'],
            resources: ['workspace'],
            subjects: {
                'email': { '$regex': '.*@example.com' } // Allow any example.com email
            },
            priority: 100,
            is_active: true
        });
        console.log('✅ Policy created');

        // 2. Simulare User Request
        const mockUser = {
            sub: 'user-123', // Matches expected field
            email: 'test@example.com',
            roles: [],
            permissions: []
        };

        const mockResource = {
            type: 'workspace',
            id: 'ws-100'
        };

        console.log('Testing access check (Mock User -> Workspace)...');

        // Check View
        const resultView = await AuthorizationService.checkAccess({
            user: mockUser,
            action: 'workspace:view',
            resource: mockResource,
            options: { skipRBAC: true }
        });

        if (resultView.allowed && resultView.method === 'ABAC') {
            console.log('✅ Access ALLOWED via ABAC (Expected)');
        } else {
            console.error('❌ Access DENIED (Unexpected)', resultView);
        }

        // Check Invalid User
        const mockInvalidUser = {
            sub: 'user-456',
            email: 'hacker@evil.com', // Should NOT match regex
        };

        const resultDeny = await AuthorizationService.checkAccess({
            user: mockInvalidUser,
            action: 'workspace:view',
            resource: mockResource,
            options: { skipRBAC: true }
        });

        if (!resultDeny.allowed) {
            console.log('✅ Access DENIED for invalid user (Expected)');
        } else {
            console.error('❌ Access ALLOWED for invalid user (Unexpected)', resultDeny);
        }

        // Cleanup
        await policy.destroy();
        console.log('✅ Cleanup complete');

    } catch (error) {
        console.error('❌ Validation failed:', error);
    } finally {
        await sequelize.close();
    }
}

testDynamicAuth();
