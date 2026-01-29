// middleware/authMiddleware.js - SIMPLIFIED AND WORKING

const { verifyJwt } = require('../services/jwt.service');
const { loadClients } = require('../config/index');
const { ROLES } = require('../config/constants');
const {
  UserMetadata,
  OrganizationMembership,
  Organization,
  Role,
  Permission,
  TenantMapping
} = require('../config/database');
const { extractRealmFromToken } = require('../utils/helper');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'No token provided',
      code: 'MISSING_TOKEN'
    });
  }

  const token = authHeader.split(' ')[1];


  const realm = extractRealmFromToken(token);



  try {
    // 1. Verify JWT token
    const decoded = await verifyJwt(token, realm);

    // ✅ FIX: Handle Keycloak tokens that may not have 'sub' claim
    // Use email/preferred_username as fallback identifier
    const userId = decoded.sub || null;
    const userEmail = decoded.email || decoded.preferred_username;

    if (!userId && !userEmail) {
      return res.status(401).json({
        error: 'Invalid token: missing user identifier (sub or email)',
        code: 'INVALID_TOKEN'
      });
    }

    // Token user identification logged for debugging (non-sensitive)
    logger.debug('Token user identification', {
      hasSub: !!decoded.sub,
      hasEmail: !!userEmail,
      azp: decoded.azp
    });

    // 2. Load client info
    const clients = await loadClients();
    const client = Object.values(clients).find(c => c.client_id === decoded.azp);
    logger.debug('Client lookup result', { clientId: client ? client.client_id : 'NOT FOUND' });

    if (!client) {
      logger.warn('No matching client for azp', { azp: decoded.azp });
      return res.status(400).json({
        error: 'Invalid client',
        code: 'INVALID_CLIENT'
      });
    }

    // 3. Find or create user
    // ✅ FIX: Look up by keycloak_id (sub) OR by email as fallback
    let user;
    if (userId) {
      user = await UserMetadata.findOne({
        where: { keycloak_id: userId }
      });
    }

    // Fallback: look up by email if no sub or user not found by sub
    if (!user && userEmail) {
      user = await UserMetadata.findOne({
        where: { email: userEmail }
      });
    }

    if (!user) {
      // Create new user with available identifier
      user = await UserMetadata.create({
        keycloak_id: userId || `email:${userEmail}`, // Use email-based ID if sub missing
        email: userEmail,
        is_active: true,
        last_login: new Date()
      });
    } else {
      // Update last login and sync keycloak_id if we now have sub
      const updateData = {
        last_login: new Date(),
        email: userEmail
      };
      if (userId && user.keycloak_id !== userId) {
        updateData.keycloak_id = userId; // Sync keycloak_id from token
      }
      await user.update(updateData);
    }

    // 4. Load user's roles and permissions SAFELY
    let dbRoles = [];
    let dbPermissions = [];
    let organizations = [];
    let permissions_by_org = {};
    let roles_by_org = {};

    try {
      const memberships = await OrganizationMembership.findAll({
        where: { user_id: user.id },
        include: [
          {
            model: Role,
            as: 'Role',
            include: [{
              model: Permission,
              as: 'Permissions',
              through: { attributes: [] },
              required: false
            }],
            required: false
          },
          {
            model: Organization,
            as: 'Organization',
            required: false
          }
        ],
      });

      // Process memberships safely
      memberships.forEach(membership => {
        const orgId = membership.org_id;

        if (membership.Role) {
          const roleName = membership.Role.name;
          if (!dbRoles.includes(roleName)) {
            dbRoles.push(roleName);
          }

          // Track roles by organization
          if (orgId) {
            if (!roles_by_org[orgId]) {
              roles_by_org[orgId] = [];
            }
            roles_by_org[orgId].push(roleName);
          }

          if (membership.Role.Permissions) {
            membership.Role.Permissions.forEach(permission => {
              if (!dbPermissions.includes(permission.name)) {
                dbPermissions.push(permission.name);
              }

              // Track permissions by organization
              if (orgId) {
                if (!permissions_by_org[orgId]) {
                  permissions_by_org[orgId] = [];
                }
                if (!permissions_by_org[orgId].some(p => p.name === permission.name)) {
                  permissions_by_org[orgId].push({ name: permission.name, id: permission.id });
                }
              }
            });
          }
        }

        if (membership.Organization) {
          organizations.push({
            id: membership.Organization.id,
            name: membership.Organization.name,
            tenant_id: membership.Organization.tenant_id,
            role: membership.Role?.name
          });
        }
      });
    } catch (membershipError) {
      logger.warn('Failed to load memberships, continuing with empty arrays:', membershipError.message);
      // Continue with empty arrays - this is OK for new users
    }

    // 5. Handle tenant mapping if needed
    let tenant_id = null;
    if (client.requires_tenant) {
      try {
        const tenantMapping = await TenantMapping.findOne({
          where: {
            user_id: user.keycloak_id,
            client_key: client.client_key
          }
        });

        if (tenantMapping) {
          tenant_id = tenantMapping.tenant_id;
        }
      } catch (tenantError) {
        logger.warn('Failed to load tenant mapping:', tenantError.message);
      }
    }

    // 6. Get Keycloak roles
    const keycloakRoles = [
      ...(decoded.realm_access?.roles || []),
      ...(decoded.resource_access?.[decoded.azp]?.roles || []),
      ...(decoded.roles || []) // Handle root-level roles
    ];

    // 7. Build user context
    req.user = {
      // Basic info
      id: user.id,
      keycloak_id: user.keycloak_id,
      sub: decoded.sub,
      email: decoded.email || user.email,
      name: decoded.name || decoded.preferred_username,
      preferred_username: decoded.preferred_username,
      realm: decoded.iss.split('/').pop(),

      // Client & tenant
      client_id: client.client_id,
      tenant_id,

      // Organizations and roles
      organizations,
      org_roles: dbRoles,
      permissions: dbPermissions,
      kc_roles: keycloakRoles,

      // Combined roles for easy checking
      roles: [...new Set([...dbRoles, ...keycloakRoles])],

      // Permissions and roles by organization (for hasPermission/hasRole with orgId)
      permissions_by_org,
      roles_by_org,

      // User metadata
      designation: user.designation,
      department: user.department,
      is_active: user.is_active,
      last_login: user.last_login,
      hasPermission: function (permission, orgId = null) {
        if (orgId) {
          return this.permissions_by_org[orgId]?.some(p => p.name === permission) || false;
        }
        return this.permissions.includes(permission);
      },

      hasRole: function (role, orgId = null) {
        if (orgId) {
          return this.organizations.some(org => org.id === orgId && org.role === role);
        }
        return this.roles.includes(role);
      },

      hasAnyRole: function (roles) {
        return roles.some(role => this.roles.includes(role));
      },

      isInOrganization: function (orgId) {
        return this.organizations.some(org => org.id === orgId);
      }
    };

    logger.info('User authenticated successfully', {
      userId: user.id,
      email: req.user.email,
      organizationsCount: organizations.length,
      rolesCount: req.user.roles.length,
      permissionsCount: dbPermissions.length
    });

    next();

  } catch (err) {
    logger.error('Authentication error:', {
      error: err.message
    });

    res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// Simplified role/permission checking functions
function requireSuperAdmin() {
  return (req, res, next) => {
    // Check for both 'superadmin' and 'super_admin' to be safe
    const hasRole = req.user && (
      req.user.roles.includes('superadmin') ||
      req.user.roles.includes(ROLES.SUPER_ADMIN)
    );

    if (!hasRole) {
      logger.warn(`Superadmin required for user ${req.user?.keycloak_id || 'unknown'}`);
      return res.status(403).json({
        error: 'Superadmin role required',
        code: 'SUPERADMIN_REQUIRED'
      });
    }
    next();
  };
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles.includes(role)) {
      logger.warn(`Role ${role} required for user ${req.user?.keycloak_id || 'unknown'}`);
      return res.status(403).json({
        error: `Role ${role} required`,
        code: 'ROLE_REQUIRED',
        required_role: role
      });
    }
    next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions.includes(permission)) {
      logger.warn(`Permission ${permission} required for user ${req.user?.keycloak_id || 'unknown'}`);
      return res.status(403).json({
        error: `Permission ${permission} required`,
        code: 'PERMISSION_REQUIRED',
        required_permission: permission
      });
    }
    next();
  };
}

function requireOrganizationAccess(orgIds) {
  return (req, res, next) => {
    if (!req.user || !req.user.organizations) {
      return res.status(403).json({ error: 'Organization access required' });
    }
    // orgIds can be an array of allowed organization IDs
    const userOrgs = req.user.organizations || [];
    const hasAccess = userOrgs.some(org => orgIds.includes(org.id));
    if (!hasAccess) {
      return res.status(403).json({ error: 'No access to this organization' });
    }
    next();
  }
}


module.exports = {
  authMiddleware,
  requireSuperAdmin,
  requireRole,
  requirePermission,
  requireOrganizationAccess,
};