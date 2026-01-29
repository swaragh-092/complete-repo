// Test Authorization API Routes - Add this to your Express app to test authorization

const express = require('express');
const { authMiddleware, requireRole, requirePermission, requireOrganizationAccess } = require('../middleware/authMiddleware');
const { assignUserToOrganization } = require('../seed-test-data');
const { UserMetadata, Organization, Role, Permission, OrganizationMembership } = require('../config/database');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Apply authentication to all test routes
router.use(authMiddleware);

/* ========== User Context Testing ========== */

// GET /test-auth/me - View current user's full authorization context
router.get('/me', asyncHandler(async (req, res) => {
  res.json({
    message: 'Current user authorization context',
    user: {
      id: req.user.id,
      keycloak_id: req.user.keycloak_id,
      email: req.user.email,
      name: req.user.name,

      // Organizations
      organizations: req.user.organizations,
      primary_organization: req.user.primary_organization,

      // Roles and Permissions
      keycloak_roles: req.user.kc_roles,
      database_roles: req.user.db_roles,
      all_roles: req.user.roles,
      permissions: req.user.permissions,
      permissions_by_org: req.user.permissions_by_org,

      // Context
      client_id: req.user.client_id,
      tenant_id: req.user.tenant_id,
      realm: req.user.realm,

      // Helper methods test
      helper_tests: {
        hasSuperadminRole: req.user.hasAnyRole(['superadmin']),
        hasUserReadPermission: req.user.hasPermission('user:read'),
        isInAnyOrg: req.user.organizations.length > 0
      }
    }
  });
}));

/* ========== Role-Based Testing ========== */

// GET /test-auth/superadmin-only - Test superadmin access
router.get('/superadmin-only', requireRole('superadmin'), (req, res) => {
  res.json({
    message: '🎉 Success! You have superadmin access',
    user: req.user.email,
    roles: req.user.roles
  });
});

// GET /test-auth/org-admin-only - Test organization admin access
router.get('/org-admin-only', requireRole('org_admin'), (req, res) => {
  res.json({
    message: '🎉 Success! You have org_admin access',
    user: req.user.email,
    roles: req.user.roles,
    organizations: req.user.organizations
  });
});

// GET /test-auth/any-admin - Test multiple role access (superadmin OR org_admin)
router.get('/any-admin', (req, res, next) => {
  if (!req.user.hasAnyRole(['superadmin', 'org_admin'])) {
    throw new AppError('Requires superadmin or org_admin role', 403, 'ACCESS_DENIED', { user_roles: req.user.roles });
  }

  res.json({
    message: '🎉 Success! You have admin access (superadmin OR org_admin)',
    user: req.user.email,
    matched_roles: req.user.roles.filter(r => ['superadmin', 'org_admin'].includes(r))
  });
});

/* ========== Permission-Based Testing ========== */

// GET /test-auth/can-create-users - Test user:create permission
router.get('/can-create-users', requirePermission('user:create'), (req, res) => {
  res.json({
    message: '🎉 Success! You can create users',
    user: req.user.email,
    permission: 'user:create',
    all_permissions: req.user.permissions
  });
});

// GET /test-auth/can-read-projects - Test project:read permission
router.get('/can-read-projects', requirePermission('project:read'), (req, res) => {
  res.json({
    message: '🎉 Success! You can read projects',
    user: req.user.email,
    permission: 'project:read',
    all_permissions: req.user.permissions
  });
});

// GET /test-auth/can-manage-org - Test organization management permissions
router.get('/can-manage-org', (req, res, next) => {
  const requiredPermissions = ['org:read', 'org:update'];
  const hasAllPermissions = requiredPermissions.every(perm =>
    req.user.hasPermission(perm)
  );

  if (!hasAllPermissions) {
    throw new AppError('Requires org:read AND org:update permissions', 403, 'ACCESS_DENIED', { required_permissions: requiredPermissions, user_permissions: req.user.permissions });
  }

  res.json({
    message: '🎉 Success! You can manage organizations',
    user: req.user.email,
    required_permissions: requiredPermissions,
    user_permissions: req.user.permissions
  });
});

/* ========== Organization-Specific Testing ========== */

// GET /test-auth/org/:orgId/access - Test organization-specific access
router.get('/org/:orgId/access', requireOrganizationAccess('orgId'), asyncHandler(async (req, res) => {
  const { orgId } = req.params;

  // Get organization details
  const organization = await Organization.findByPk(orgId);

  res.json({
    message: '🎉 Success! You have access to this organization',
    user: req.user.email,
    organization: {
      id: organization?.id,
      name: organization?.name,
      tenant_id: organization?.tenant_id
    },
    user_role_in_org: req.user.organizations.find(org => org.id === orgId)?.role,
    user_organizations: req.user.organizations
  });
}));

// GET /test-auth/org/:orgId/admin - Test organization admin access
router.get('/org/:orgId/admin', requireOrganizationAccess('orgId'), (req, res, next) => {
  const { orgId } = req.params;
  const userOrgData = req.user.organizations.find(org => org.id === orgId);

  if (!userOrgData || !['org_admin', 'superadmin'].includes(userOrgData.role)) {
    throw new AppError('Requires org_admin role in this organization', 403, 'ACCESS_DENIED', { user_role_in_org: userOrgData?.role || 'none', required_roles: ['org_admin', 'superadmin'] });
  }

  res.json({
    message: '🎉 Success! You are an admin of this organization',
    user: req.user.email,
    organization_id: orgId,
    user_role: userOrgData.role
  });
}, (req, res) => {
  // This won't be reached if middleware fails
});

/* ========== Multi-Organization Testing ========== */

// GET /test-auth/multi-org-access - Test access across multiple organizations
router.get('/multi-org-access', (req, res) => {
  const orgAccess = req.user.organizations.map(org => ({
    organization: {
      id: org.id,
      name: org.name,
      tenant_id: org.tenant_id
    },
    role: org.role,
    permissions_in_org: req.user.permissions_by_org[org.id] || []
  }));

  res.json({
    message: 'Multi-organization access summary',
    user: req.user.email,
    total_organizations: req.user.organizations.length,
    organizations: orgAccess,
    is_multi_org_user: req.user.organizations.length > 1
  });
});

/* ========== Administrative Testing ========== */

// POST /test-auth/assign-to-org - Assign current user to an organization
router.post('/assign-to-org', asyncHandler(async (req, res) => {
  try {
    const { organizationName, roleName } = req.body;

    if (!organizationName || !roleName) {
      throw new AppError('Missing required fields', 400, 'MISSING_FIELDS', { required: ['organizationName', 'roleName'] });
    }

    const membership = await assignUserToOrganization(
      req.user.keycloak_id,
      organizationName,
      roleName
    );

    res.json({
      message: 'Successfully assigned to organization',
      assignment: {
        user: req.user.email,
        organization: organizationName,
        role: roleName,
        membership_id: membership.id
      },
      note: 'Please make a new request to see updated permissions'
    });

  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Assignment failed', 400, 'ASSIGNMENT_FAILED', { originalError: error.message });
  }
}));

// GET /test-auth/available-orgs - List available organizations to join
router.get('/available-orgs', asyncHandler(async (req, res) => {
  try {
    const allOrgs = await Organization.findAll({
      attributes: ['id', 'name', 'tenant_id']
    });

    const availableRoles = await Role.findAll({
      where: { is_system: false },
      attributes: ['id', 'name', 'description']
    });

    res.json({
      message: 'Available organizations and roles',
      organizations: allOrgs,
      roles: availableRoles,
      current_user_orgs: req.user.organizations
    });

  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch organizations', 500, 'FETCH_FAILED', { originalError: error.message });
  }
}));

/* ========== Permission Testing Helpers ========== */

// GET /test-auth/check-permission/:permission - Check if user has specific permission
router.get('/check-permission/:permission', (req, res) => {
  const { permission } = req.params;
  const orgId = req.query.orgId;

  const hasPermission = req.user.hasPermission(permission, orgId);

  res.json({
    permission: permission,
    organization_id: orgId || 'global',
    has_permission: hasPermission,
    user: req.user.email,
    all_permissions: orgId
      ? req.user.permissions_by_org[orgId] || []
      : req.user.permissions
  });
});

// GET /test-auth/check-role/:role - Check if user has specific role
router.get('/check-role/:role', (req, res) => {
  const { role } = req.params;
  const orgId = req.query.orgId;

  const hasRole = req.user.hasRole(role, orgId);

  res.json({
    role: role,
    organization_id: orgId || 'global',
    has_role: hasRole,
    user: req.user.email,
    all_roles: req.user.roles,
    org_roles: orgId
      ? req.user.organizations.filter(org => org.id === orgId).map(org => org.role)
      : req.user.db_roles
  });
});

module.exports = router;