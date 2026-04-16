// Test Data Seeder - Run this to populate your database with test organizations, roles, and permissions

const {
  Organization,
  Role,
  Permission,
  RolePermission,
  UserMetadata,
  OrganizationMembership
} = require('./config/database');

async function seedTestData() {
  console.log('🌱 Starting to seed test data...');

  try {
    // 1. Create Test Organizations
    console.log('📋 Creating test organizations...');

    const organizations = await Promise.all([
      Organization.create({
        name: 'Acme Corporation',
        tenant_id: 'acme-corp',
      }),
      Organization.create({
        name: 'TechStart Solutions',
        tenant_id: 'techstart',
      }),
      Organization.create({
        name: 'Global Enterprises',
        tenant_id: 'global-ent',
      }),
    ]);

    console.log(`✅ Created ${organizations.length} organizations`);

    // 2. Create Test Roles
    console.log('👤 Creating test roles...');

    const roles = await Promise.all([
      // System Roles
      Role.create({
        name: 'superadmin',
        description: 'Super Administrator with full system access',
        is_system: true,
      }),
      Role.create({
        name: 'system_admin',
        description: 'System Administrator',
        is_system: true,
      }),

      // Organization Owner Role (required for org creation)
      Role.create({
        name: 'owner',
        description: 'Organization Owner with full organization access',
        is_system: true,
      }),

      // Organization Roles
      Role.create({
        name: 'admin',
        description: 'Organization Administrator',
        is_system: false,
      }),
      Role.create({
        name: 'org_admin',
        description: 'Organization Administrator (legacy)',
        is_system: false,
      }),
      Role.create({
        name: 'org_manager',
        description: 'Organization Manager',
        is_system: false,
      }),
      Role.create({
        name: 'member',
        description: 'Organization Member',
        is_system: false,
      }),
      Role.create({
        name: 'org_member',
        description: 'Organization Member (legacy)',
        is_system: false,
      }),
      Role.create({
        name: 'viewer',
        description: 'Read-only access',
        is_system: false,
      }),
      Role.create({
        name: 'org_viewer',
        description: 'Organization Viewer (Read-only, legacy)',
        is_system: false,
      }),

      // Project Roles
      Role.create({
        name: 'project_manager',
        description: 'Project Manager',
        is_system: false,
      }),
      Role.create({
        name: 'developer',
        description: 'Developer',
        is_system: false,
      }),
    ]);

    console.log(`✅ Created ${roles.length} roles`);

    // 3. Create Test Permissions
    console.log('🔐 Creating test permissions...');

    const permissions = await Promise.all([
      // User Management Permissions
      Permission.create({
        name: 'user:create',
        description: 'Create new users',
        resource: 'user',
        action: 'create',
        is_system: true,
      }),
      Permission.create({
        name: 'user:read',
        description: 'View user information',
        resource: 'user',
        action: 'read',
        is_system: true,
      }),
      Permission.create({
        name: 'user:update',
        description: 'Update user information',
        resource: 'user',
        action: 'update',
        is_system: true,
      }),
      Permission.create({
        name: 'user:delete',
        description: 'Delete users',
        resource: 'user',
        action: 'delete',
        is_system: true,
      }),

      // Organization Management Permissions
      Permission.create({
        name: 'org:create',
        description: 'Create organizations',
        resource: 'organization',
        action: 'create',
        is_system: true,
      }),
      Permission.create({
        name: 'org:read',
        description: 'View organization information',
        resource: 'organization',
        action: 'read',
        is_system: false,
      }),
      Permission.create({
        name: 'org:update',
        description: 'Update organization settings',
        resource: 'organization',
        action: 'update',
        is_system: false,
      }),
      Permission.create({
        name: 'org:delete',
        description: 'Delete organizations',
        resource: 'organization',
        action: 'delete',
        is_system: true,
      }),

      // Project Management Permissions
      Permission.create({
        name: 'project:create',
        description: 'Create projects',
        resource: 'project',
        action: 'create',
        is_system: false,
      }),
      Permission.create({
        name: 'project:read',
        description: 'View projects',
        resource: 'project',
        action: 'read',
        is_system: false,
      }),
      Permission.create({
        name: 'project:update',
        description: 'Update projects',
        resource: 'project',
        action: 'update',
        is_system: false,
      }),
      Permission.create({
        name: 'project:delete',
        description: 'Delete projects',
        resource: 'project',
        action: 'delete',
        is_system: false,
      }),

      // Role Management Permissions
      Permission.create({
        name: 'role:create',
        description: 'Create roles',
        resource: 'role',
        action: 'create',
        is_system: true,
      }),
      Permission.create({
        name: 'role:read',
        description: 'View roles',
        resource: 'role',
        action: 'read',
        is_system: false,
      }),
      Permission.create({
        name: 'role:update',
        description: 'Update roles',
        resource: 'role',
        action: 'update',
        is_system: true,
      }),
      Permission.create({
        name: 'role:delete',
        description: 'Delete roles',
        resource: 'role',
        action: 'delete',
        is_system: true,
      }),
    ]);

    console.log(`✅ Created ${permissions.length} permissions`);

    // 4. Assign Permissions to Roles
    console.log('🔗 Assigning permissions to roles...');

    // Get roles and permissions for assignment
    const roleMap = {};
    const permMap = {};

    roles.forEach(role => roleMap[role.name] = role);
    permissions.forEach(perm => permMap[perm.name] = perm);

    // Define role-permission assignments
    const rolePermissions = [
      // Superadmin - All permissions
      { role: 'superadmin', permissions: permissions.map(p => p.name) },

      // System Admin - Most permissions except user:delete
      {
        role: 'system_admin', permissions: [
          'user:create', 'user:read', 'user:update',
          'org:create', 'org:read', 'org:update', 'org:delete',
          'project:create', 'project:read', 'project:update', 'project:delete',
          'role:create', 'role:read', 'role:update', 'role:delete'
        ]
      },

      // Org Admin - Organization and user management
      {
        role: 'org_admin', permissions: [
          'user:create', 'user:read', 'user:update',
          'org:read', 'org:update',
          'project:create', 'project:read', 'project:update', 'project:delete',
          'role:read'
        ]
      },

      // Org Manager - Project management
      {
        role: 'org_manager', permissions: [
          'user:read',
          'org:read',
          'project:create', 'project:read', 'project:update', 'project:delete',
          'role:read'
        ]
      },

      // Project Manager - Project management
      {
        role: 'project_manager', permissions: [
          'user:read',
          'org:read',
          'project:create', 'project:read', 'project:update',
          'role:read'
        ]
      },

      // Org Member - Basic project access
      {
        role: 'org_member', permissions: [
          'user:read',
          'org:read',
          'project:read', 'project:update',
          'role:read'
        ]
      },

      // Developer - Project development
      {
        role: 'developer', permissions: [
          'user:read',
          'org:read',
          'project:read', 'project:update',
          'role:read'
        ]
      },

      // Org Viewer - Read only
      {
        role: 'org_viewer', permissions: [
          'user:read',
          'org:read',
          'project:read',
          'role:read'
        ]
      },
    ];

    // Create role-permission associations
    for (const assignment of rolePermissions) {
      const role = roleMap[assignment.role];
      if (!role) continue;

      for (const permName of assignment.permissions) {
        const permission = permMap[permName];
        if (permission) {
          await RolePermission.create({
            role_id: role.id,
            permission_id: permission.id,
          });
        }
      }
    }

    console.log('✅ Assigned permissions to roles');

    // 5. Return created data for reference
    return {
      organizations,
      roles: roleMap,
      permissions: permMap,
      summary: {
        organizations: organizations.length,
        roles: roles.length,
        permissions: permissions.length,
        rolePermissions: rolePermissions.reduce((sum, rp) => sum + rp.permissions.length, 0)
      }
    };

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

// Helper function to assign user to organization with role
async function assignUserToOrganization(keycloakId, organizationName, roleName) {
  try {
    // Find user
    const user = await UserMetadata.findOne({ where: { keycloak_id: keycloakId } });
    if (!user) {
      throw new Error(`User with Keycloak ID ${keycloakId} not found`);
    }

    // Find organization
    const organization = await Organization.findOne({ where: { name: organizationName } });
    if (!organization) {
      throw new Error(`Organization ${organizationName} not found`);
    }

    // Find role
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    // Create organization membership
    const membership = await OrganizationMembership.create({
      user_id: user.id,
      org_id: organization.id,
      role_id: role.id,
    });

    console.log(`✅ Assigned user ${keycloakId} to ${organizationName} as ${roleName}`);
    return membership;

  } catch (error) {
    console.error('❌ Error assigning user to organization:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  seedTestData,
  assignUserToOrganization,
};

// If running directly
if (require.main === module) {
  seedTestData()
    .then((result) => {
      console.log('\n🎉 Test data seeding completed!');
      console.log('Summary:', result.summary);
      console.log('\nNext steps:');
      console.log('1. Use assignUserToOrganization() to assign users to organizations');
      console.log('2. Test the authorization endpoints');
      console.log('3. Check the /test-auth routes for verification');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}