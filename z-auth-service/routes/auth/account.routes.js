// routes/account.route.js - ENHANCED WITH DATABASE INTEGRATION

const express = require("express");
const Joi = require("joi");
const asyncHandler = require("../../middleware/asyncHandler");
const {
  updateProfileSchema,
  updateSecuritySchema,
  changePasswordSchema
} = require("../../validators/user.validator");
const { MEMBER_STATUS } = require('../../config/constants');
const { authMiddleware } = require("../../middleware/authMiddleware");
const { auditProfile, auditSecurity } = require("../../middleware/auditMiddleware");
const AuditService = require("../../services/audit.service");
// const Realm = require('../../models/realm');
const {
  UserMetadata,
  OrganizationMembership,
  Organization,
  Role,
  Permission,
  FederatedIdentityMapping,
  Sequelize
} = require("../../config/database");
const { AppError } = require('../../middleware/errorHandler');
const ResponseHandler = require('../../utils/responseHandler');
const logger = require('../../utils/logger');
const { APP_URL, ACCOUNT_UI_URL, getKeycloakService } = require('../../config');

// kc() helper - now uses cached getKeycloakService from config/index.js
const kc = getKeycloakService;

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);



/* --------- ENHANCED PROFILE MANAGEMENT --------- */

// GET /api/account/profile - Get COMPLETE user profile (Keycloak + Database)
router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    // ✅ FIX: Use keycloak_id (which may be email-based if sub was missing)
    const userId = req.user.sub || req.user.keycloak_id;
    const realm = req.user.realm;
    const hasValidKeycloakId = req.user.sub && !req.user.keycloak_id?.startsWith('email:');

    logger.info(
      "📱 Fetching complete profile for user:",
      userId,
      "in realm:",
      realm,
      "hasValidKeycloakId:",
      hasValidKeycloakId
    );

    try {
      // Get Keycloak profile (only if we have a valid Keycloak sub)
      let keycloakUser = null;
      if (hasValidKeycloakId) {
        try {
          const svc = await kc(realm);
          keycloakUser = await svc.getUser(userId);
        } catch (kcErr) {
          logger.warn("Could not fetch Keycloak user (may not exist):", kcErr.message);
        }
      }

      // Get database metadata (already available from authMiddleware)
      const dbUser = await UserMetadata.findOne({
        where: { keycloak_id: userId },
        include: [
          {
            model: Organization,
            as: "PrimaryOrganization",
            attributes: ["id", "name", "tenant_id"],
            required: false,
          },
          {
            model: OrganizationMembership,
            as: "Memberships",
            include: [
              {
                model: Organization,
                as: 'Organization', // ✅ Required alias per model association
                attributes: ["id", "name", "tenant_id"],
              },
              {
                model: Role,
                as: 'Role', // ✅ Required alias per model association
                attributes: ["id", "name", "description"],
                include: [
                  {
                    model: Permission,
                    as: "Permissions",
                    through: { attributes: [] },
                    attributes: ["id", "name", "resource", "action"],
                  },
                ],
              },
            ],
          },
        ],
      });

      const federatedIdentities = await FederatedIdentityMapping.findAll({
        where: { user_id: dbUser.id },
        order: [['last_login', 'DESC']]
      });

      // Combine Keycloak and Database data
      // ✅ FIX: Handle case where keycloakUser is null (token without sub)
      const completeProfile = {
        // User identity (from Keycloak if available, otherwise from token/db)
        id: keycloakUser?.id || req.user.keycloak_id || dbUser?.id,
        username: keycloakUser?.username || req.user.preferred_username || req.user.email,
        email: keycloakUser?.email || req.user.email || dbUser?.email,
        firstName: keycloakUser?.firstName || req.user.name?.split(' ')[0] || "",
        lastName: keycloakUser?.lastName || req.user.name?.split(' ').slice(1).join(' ') || "",
        emailVerified: keycloakUser?.emailVerified || true, // Assume verified if from token
        enabled: keycloakUser?.enabled || dbUser?.is_active || true,
        totp: keycloakUser?.totp || false,
        createdTimestamp: keycloakUser?.createdTimestamp || null,
        attributes: keycloakUser?.attributes || {},
        connectedAccounts: federatedIdentities?.map(fi => ({
          provider: fi.provider,
          providerEmail: fi.providerEmail,
          linkedAt: fi.linkedAt,
          lastLogin: fi.lastLogin,
          isWorkspace: fi.metadata?.isWorkspace || false,
          workspaceDomain: fi.metadata?.workspaceDomain || null
        })) || [],
        lastLoginProvider: dbUser?.lastLoginProvider,
        lastLoginIp: dbUser?.lastLoginIp,

        // Database metadata
        metadata: dbUser
          ? {
            id: dbUser.id,
            designation: dbUser.designation,
            department: dbUser.department,
            mobile: dbUser.mobile,
            gender: dbUser.gender,
            avatar_url: dbUser.avatar_url,
            is_active: dbUser.is_active,
            last_login: dbUser.last_login,

            // Organization info
            primary_organization: dbUser.PrimaryOrganization
              ? {
                id: dbUser.PrimaryOrganization.id,
                name: dbUser.PrimaryOrganization.name,
                tenant_id: dbUser.PrimaryOrganization.tenant_id,
              }
              : null,

            // Memberships with roles and permissions
            memberships: dbUser.Memberships.map((m) => ({
              id: m.id,
              organization: {
                id: m.Organization.id,
                name: m.Organization.name,
                tenant_id: m.Organization.tenant_id,
              },
              role: {
                id: m.Role.id,
                name: m.Role.name,
                description: m.Role.description,
                permissions: m.Role.Permissions.map((p) => ({
                  id: p.id,
                  name: p.name,
                  resource: p.resource,
                  action: p.action,
                })),
              },
            })),
          }
          : null,

        // Authorization summary (from authMiddleware)
        authorization: {
          keycloak_roles: req.user.kc_roles,
          database_roles: req.user.org_roles,
          permissions: req.user.permissions,
          organizations: req.user.organizations,
        },
      };

      return ResponseHandler.success(res, completeProfile, 'Profile retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("❌ Failed to fetch complete profile:", error);
      throw new AppError('Failed to retrieve user profile', 500, 'PROFILE_FETCH_FAILED', { originalError: error.message });
    }
  })
);

// PUT /api/account/profile - Update BOTH Keycloak and Database profile
router.put(
  "/profile",
  auditProfile('UPDATE'),
  asyncHandler(async (req, res) => {
    // Validate input
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const userId = req.user.sub;
    const realm = req.user.realm;

    logger.info(
      "✏️ Updating complete profile for user:",
      userId,
      "with data:",
      value
    );

    try {
      const svc = await kc(realm);

      // Format Keycloak updates
      const keycloakUpdates = {
        firstName: value.firstName,
        lastName: value.lastName || "",
        email: value.email,
        attributes: {},
      };

      // Add custom attributes if present
      if (value.mobile)
        keycloakUpdates.attributes.phone = [value.mobile.toString()];
      if (value.bio) keycloakUpdates.attributes.bio = [value.bio];

      // Update user in Keycloak
      await svc.updateUser(userId, keycloakUpdates);

      // Format DB metadata updates
      const dbUpdates = {
        designation: value.designation,
        department: value.department,
        mobile: value.mobile,
        gender: value.gender,
        email: value.email,
      };

      // Remove undefined values
      Object.keys(dbUpdates).forEach((key) => {
        if (dbUpdates[key] === undefined) delete dbUpdates[key];
      });

      // Upsert database record
      await UserMetadata.upsert({
        keycloak_id: userId,
        ...dbUpdates,
      });

      logger.info("✅ Complete profile updated successfully");
      logger.info("✅ Complete profile updated successfully");
      return ResponseHandler.success(res, {
        updatedFields: {
          keycloak: Object.keys(keycloakUpdates),
          database: Object.keys(dbUpdates),
        }
      }, "Profile updated successfully");
    } catch (error) {
      logger.error("❌ Complete profile update failed:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update profile. Please try again.", 500, "UPDATE_FAILED", { originalError: error.message });
    }
  })
);

// GET /api/account/profile/summary - Enhanced summary with database info
router.get(
  "/profile/summary",
  asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const realm = req.user.realm;

    try {
      const svc = await kc(realm);
      const keycloakUser = await svc.getUser(userId);

      // Get database user (already loaded in authMiddleware)
      const dbUser = await UserMetadata.findOne({
        where: { keycloak_id: userId },
        include: [
          {
            model: Organization,
            as: "PrimaryOrganization",
            attributes: ["id", "name"],
            required: false,
          },
        ],
      });

      // Return enhanced summary
      // Return enhanced summary
      return ResponseHandler.success(res, {
        id: keycloakUser.id,
        username: keycloakUser.username,
        firstName: keycloakUser.firstName,
        lastName: keycloakUser.lastName,
        email: keycloakUser.email,
        emailVerified: keycloakUser.emailVerified,
        enabled: keycloakUser.enabled,

        // Database additions
        designation: dbUser?.designation,
        department: dbUser?.department,
        organization: dbUser?.PrimaryOrganization?.name,
        avatar_url: dbUser?.avatar_url,

        // Authorization summary
        roles: req.user.roles,
        permissions_count: req.user.permissions.length,
        organizations_count: req.user.organizations.length,

        attributes: {
          phone: keycloakUser.attributes?.phone?.[0] || dbUser?.mobile,
          bio: keycloakUser.attributes?.bio?.[0],
        },
      }, "Profile summary retrieved successfully");
    } catch (error) {
      logger.error("❌ Failed to fetch profile summary:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to retrieve profile summary", 500, "SUMMARY_FETCH_FAILED", { originalError: error.message });
    }
  })
);

/* --------- DATABASE-SPECIFIC ROUTES --------- */

// PUT /api/account/metadata - Update only database metadata
router.put(
  "/metadata",
  asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { designation, department, mobile, gender, avatar_url } = req.body;

    logger.info("✏️ Updating database metadata for user:", userId);

    try {
      const updates = {
        designation,
        department,
        mobile,
        gender,
        avatar_url,
      };

      // Remove undefined values
      Object.keys(updates).forEach((key) => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      await UserMetadata.upsert({
        keycloak_id: userId,
        ...updates,
      });

      return ResponseHandler.success(res, {
        updatedFields: Object.keys(updates),
      }, "Metadata updated successfully");
    } catch (error) {
      logger.error("❌ Metadata update failed:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update metadata", 500, "UPDATE_FAILED", { originalError: error.message });
    }
  })
);

// GET /api/account/organizations - Get user's organizations and roles
router.get(
  "/organizations",
  asyncHandler(async (req, res) => {
    const keycloakId = req.user.sub || req.user.keycloak_id;
    logger.info("🏢 Fetching user organizations for keycloak_id:", keycloakId);

    try {
      // First get the database user to get their ID
      const dbUser = await UserMetadata.findOne({
        where: { keycloak_id: keycloakId },
        include: [
          {
            model: Organization,
            as: "PrimaryOrganization",
            attributes: ["id", "name", "tenant_id"],
          },
        ],
      });

      // If no dbUser exists, return empty organizations
      if (!dbUser) {
        logger.info("📭 No database user found for:", keycloakId);
        return ResponseHandler.success(res, {
          primary_organization: null,
          memberships: [],
          member_organizations: [], // For frontend compatibility
          total_organizations: 0,
        }, "No organizations found");
      }

      // Now query memberships using the database user ID
      const memberships = await OrganizationMembership.findAll({
        where: { user_id: dbUser.id },
        include: [
          {
            model: Organization,
            as: 'Organization',
            attributes: ["id", "name", "tenant_id"],
          },
          {
            model: Role,
            as: 'Role',
            attributes: ["id", "name", "description"],
            include: [
              {
                model: Permission,
                as: "Permissions",
                through: { attributes: [] },
                attributes: ["id", "name", "resource", "action"],
              },
            ],
          },
        ],
        // No ordering - OrganizationMembership table doesn't have timestamp columns
      });

      // ✅ AUTO-SET PRIMARY ORG (Lazy Migration)
      // If user has memberships but no primary_org_id, set the first one
      if (!dbUser.primary_org_id && memberships.length > 0) {
        const firstOrgId = memberships[0].org_id;
        await dbUser.update({ primary_org_id: firstOrgId });
        // Reload dbUser to get the association
        await dbUser.reload({
          include: [{
            model: Organization,
            as: "PrimaryOrganization",
            attributes: ["id", "name", "tenant_id"],
          }]
        });
        logger.info(`✅ Auto-set primary organization for user ${keycloakId} to ${firstOrgId}`);
      }

      // ✅ FILTER FOR SINGLE ORG MODE
      const orgModel = req.query.model;
      let filteredMemberships = memberships;
      let primaryOrg = dbUser.PrimaryOrganization;

      if (orgModel === 'single') {
        // In single mode, only return the primary organization as a membership
        // If primary org exists, find its membership details
        if (dbUser.primary_org_id) {
          const primaryMembership = memberships.find(m => m.org_id === dbUser.primary_org_id);
          if (primaryMembership) {
            filteredMemberships = [primaryMembership];
          } else {
            // Should not happen if data is consistent, but fallback
            filteredMemberships = [];
          }
        } else {
          filteredMemberships = [];
        }
      }

      const userOrganizations = {
        primary_organization: primaryOrg
          ? {
            id: primaryOrg.id,
            name: primaryOrg.name,
            tenant_id: primaryOrg.tenant_id,
            membership_type: "primary",
          }
          : null,

        memberships: filteredMemberships.map((m) => ({
          id: m.id,
          organization: {
            id: m.Organization.id,
            name: m.Organization.name,
            tenant_id: m.Organization.tenant_id,
          },
          role: {
            id: m.Role.id,
            name: m.Role.name,
            description: m.Role.description,
            permissions: m.Role.Permissions.map((p) => ({
              id: p.id,
              name: p.name,
              resource: p.resource,
              action: p.action,
            })),
          },
          membership_type: m.org_id === dbUser.primary_org_id ? "primary" : "member",
        })),

        total_organizations: filteredMemberships.length,
      };

      return ResponseHandler.success(res, userOrganizations, "Organizations retrieved successfully");
    } catch (error) {
      logger.error("❌ Failed to fetch user organizations:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to retrieve organizations", 500, "FETCH_FAILED", { originalError: error.message });
    }
  })
);



// PUT /api/account/primary-organization - Change primary organization
router.put(
  "/primary-organization",
  asyncHandler(async (req, res) => {
    const { org_id } = req.body;
    const keycloakId = req.user.sub || req.user.keycloak_id;
    const clientId = req.user.client_id;
    const isSuperAdmin = req.user.roles.includes('superadmin');

    if (!org_id) {
      throw new AppError('Organization ID is required', 400, 'VALIDATION_ERROR');
    }

    logger.info("🔄 Changing primary organization:", { keycloakId, orgId: org_id });

    // 1. Get Client Config
    const client = await Client.findOne({ where: { client_id: clientId } });
    if (!client) throw new AppError('Client configuration not found', 400, 'INVALID_CLIENT');

    // 2. Check Permissions
    const canChange = isSuperAdmin || client.allow_primary_org_change;

    if (!canChange) {
      throw new AppError('Changing primary organization is not allowed for this application', 403, 'ACTION_FORBIDDEN');
    }

    // 3. Get User and verify membership in target org
    const user = await UserMetadata.findOne({ where: { keycloak_id: keycloakId } });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const membership = await OrganizationMembership.findOne({
      where: { user_id: user.id, org_id: org_id }
    });

    if (!membership) {
      throw new AppError('You are not a member of the target organization', 403, 'ACCESS_DENIED');
    }

    // 4. Update Primary Organization
    await user.update({ primary_org_id: org_id });

    logger.info(`✅ Primary organization updated for user ${keycloakId} to ${org_id}`);

    return ResponseHandler.success(res, {
      primary_org_id: org_id
    }, "Primary organization updated successfully");
  })
);

// GET /api/account/permissions - Get user's effective permissions
router.get(
  "/permissions",
  asyncHandler(async (req, res) => {
    logger.info("🔐 Fetching user permissions:", req.user.id);

    try {
      const permissions = await UserMetadata.findByPk(req.user.id, {
        include: [
          {
            model: OrganizationMembership,
            as: "Memberships",
            include: [
              {
                model: Role,
                as: 'Role', // ✅ Required alias per model association
                include: [
                  {
                    model: Permission,
                    as: "Permissions",
                    through: { attributes: [] },
                  },
                ],
              },
              {
                model: Organization,
                as: 'Organization', // ✅ Required alias per model association
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      });

      if (!permissions || !permissions.Memberships) {
        return ResponseHandler.success(res, {
          permissions: [],
          by_organization: {},
          by_resource: {},
          total: 0,
        }, "No permissions found");
      }

      const allPermissions = new Set();
      const byOrganization = {};
      const byResource = {};

      permissions.Memberships.forEach((membership) => {
        const orgId = membership.Organization.id;
        const orgName = membership.Organization.name;

        if (!byOrganization[orgId]) {
          byOrganization[orgId] = {
            organization: { id: orgId, name: orgName },
            role: membership.Role.name,
            permissions: [],
          };
        }

        if (membership.Role.Permissions) {
          membership.Role.Permissions.forEach((permission) => {
            allPermissions.add(permission.name);

            const permissionObj = {
              id: permission.id,
              name: permission.name,
              resource: permission.resource,
              action: permission.action,
              description: permission.description,
            };

            byOrganization[orgId].permissions.push(permissionObj);

            // Group by resource
            if (!byResource[permission.resource]) {
              byResource[permission.resource] = [];
            }
            byResource[permission.resource].push({
              ...permissionObj,
              organization: orgName,
              role: membership.Role.name,
            });
          });
        }
      });

      return ResponseHandler.success(res, {
        permissions: Array.from(allPermissions),
        by_organization: byOrganization,
        by_resource: byResource,
        total: allPermissions.size,
      }, "Permissions retrieved successfully");
    } catch (error) {
      logger.error("❌ Failed to fetch user permissions:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to retrieve permissions", 500, "FETCH_FAILED", { originalError: error.message });
    }
  })
);



// /* --------- Password Management --------- */

// Schema moved to validators/user.validator.js


/* --------- Session Management --------- */

// GET /api/account/sessions - Get user sessions
router.get(
  "/sessions",
  asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const realm = req.user.realm;

    logger.info("🔍 Fetching sessions for user:", userId, "in realm:", realm);

    const svc = await kc(realm);

    try {
      // Get user sessions from Keycloak
      const keycloakSessions = await svc.userSession(userId);
      logger.info("Raw Keycloak sessions:", keycloakSessions);

      if (!keycloakSessions || keycloakSessions.length === 0) {
        return ResponseHandler.success(res, [], "No active sessions found");
      }

      // Get all clients to map client IDs to friendly names
      const clients = await svc.getClients();
      const clientMap = {};
      clients.forEach((client) => {
        clientMap[client.id] = {
          clientId: client.clientId,
          name: client.name || client.clientId,
          description: client.description,
        };
      });

      // Transform sessions to match frontend expectations
      const enhancedSessions = [];

      keycloakSessions.forEach((session) => {
        // Handle clients object - it contains clientUUID -> clientId mappings
        const sessionClients = session.clients || {};

        // Create a session for each client in the session
        Object.entries(sessionClients).forEach(([clientUUID, clientId]) => {
          const clientInfo = clientMap[clientUUID] || {
            clientId: clientId || "unknown",
            name: clientId || "Unknown App",
            description: "Connected application",
          };

          // Determine if this is the current session
          const currentSessionId = req.user.sid || req.user.session_id;
          const isCurrent = session.id === currentSessionId;

          const enhancedSession = {
            id: `${session.id}-${clientUUID}`, // Unique ID for each client in session
            sessionId: session.id,
            userId: session.userId,
            username: session.username,
            ipAddress: session.ipAddress,
            userAgent: generateUserAgent(session.ipAddress), // Generate based on IP
            started: session.start,
            lastAccess: session.lastAccess,
            current: isCurrent && clientId === "account-ui", // Only mark account-ui as current
            active: true,
            rememberMe: session.rememberMe,

            // Client/Application info
            clientId: clientId,
            clientUUID: clientUUID,
            applicationName: clientInfo.name,
            applicationDescription: clientInfo.description,

            // Location info (mock based on IP)
            location: getLocationFromIP(session.ipAddress),
            country: getCountryFromIP(session.ipAddress),
          };

          enhancedSessions.push(enhancedSession);
        });

        // If no clients, create a general session entry
        if (Object.keys(sessionClients).length === 0) {
          const currentSessionId = req.user.sid || req.user.session_id;
          const isCurrent = session.id === currentSessionId;

          enhancedSessions.push({
            id: session.id,
            sessionId: session.id,
            userId: session.userId,
            username: session.username,
            ipAddress: session.ipAddress,
            userAgent: generateUserAgent(session.ipAddress),
            started: session.start,
            lastAccess: session.lastAccess,
            current: isCurrent,
            active: true,
            rememberMe: session.rememberMe,

            clientId: "unknown",
            applicationName: "Unknown Application",
            location: getLocationFromIP(session.ipAddress),
            country: getCountryFromIP(session.ipAddress),
          });
        }
      });

      // Sort sessions: current first, then by last access
      enhancedSessions.sort((a, b) => {
        if (a.current && !b.current) return -1;
        if (!a.current && b.current) return 1;
        return new Date(b.lastAccess) - new Date(a.lastAccess);
      });

      logger.info(`✅ Enhanced ${enhancedSessions.length} sessions for user`);
      return ResponseHandler.success(res, enhancedSessions, "Sessions retrieved successfully");
    } catch (error) {
      logger.error("❌ Failed to fetch user sessions:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to fetch user sessions", 500, "FETCH_FAILED", { originalError: error.message });
    }
  })
);

// Helper function to generate realistic user agents based on IP patterns
function generateUserAgent(ipAddress) {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  ];

  // Simple hash based on IP to get consistent user agent
  const hash = ipAddress
    .split(".")
    .reduce((acc, num) => acc + parseInt(num), 0);
  return userAgents[hash % userAgents.length];
}

// Helper functions for location (you can integrate with real geolocation service)
function getLocationFromIP(ipAddress) {
  if (
    ipAddress.startsWith("127.") ||
    ipAddress.startsWith("192.168.") ||
    ipAddress.startsWith("172.")
  ) {
    return "Local Network";
  }

  // Mock locations for demo
  const mockLocations = {
    "203.0.113.45": "New York, NY",
    "198.51.100.14": "San Francisco, CA",
    "192.0.2.19": "London, UK",
  };

  return mockLocations[ipAddress] || "Unknown Location";
}

function getCountryFromIP(ipAddress) {
  if (
    ipAddress.startsWith("127.") ||
    ipAddress.startsWith("192.168.") ||
    ipAddress.startsWith("172.")
  ) {
    return "Local";
  }

  const mockCountries = {
    "203.0.113.45": "United States",
    "198.51.100.14": "United States",
    "192.0.2.19": "United Kingdom",
  };

  return mockCountries[ipAddress] || "Unknown";
}

// DELETE /api/account/sessions/:sessionId - Terminate specific session
router.delete(
  "/sessions/:sessionId",
  asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { sessionId } = req.params;
    const realm = req.user.realm;

    logger.info(`🗑️ Attempting to delete session ${sessionId} for user ${userId}`);

    const svc = await kc(realm);
    const result = await svc.deleteUserSession(userId, sessionId);

    if (result.deleted) {
      return ResponseHandler.success(res, {
        sessionId: result.sessionId,
        fallback: result.fallback || null
      }, "Session terminated successfully");
    } else {
      // No sessions or session not found - return success with info
      return ResponseHandler.success(res, {
        reason: result.reason
      }, result.reason === 'no_sessions'
        ? "No active sessions to terminate"
        : "Session not found (may have already been terminated)"
      );
    }
  })
);

// POST /api/account/logout-all - Logout from all sessions
router.post(
  "/logout-all",
  asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const realm = req.user.realm;

    logger.info(`🚪 Logging out all sessions for user ${userId}`);

    const svc = await kc(realm);
    const result = await svc.logoutUser(userId);

    return ResponseHandler.success(res, {
      sessionCount: result.sessionCount
    }, result.sessionCount > 0
      ? `Logged out from ${result.sessionCount} session(s)`
      : "No active sessions to logout"
    );
  })
);


/* --------- Application Access --------- */

// GET /api/account/applications - Get user's connected applications
router.get(
  "/applications",
  asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const realm = req.user.realm;

    const svc = await kc(realm);

    // Get all clients in the realm
    const clients = await svc.getClients();

    // Filter to show only applications the user has access to
    // This is a simplified version - in production you'd check actual user permissions
    const userApplications = clients
      .filter((client) => client.enabled)
      .map((client) => {
        let postLogoutRedirectUri = client.redirect_url || process.env.ACCOUNT_UI_URL;
        if (postLogoutRedirectUri && postLogoutRedirectUri.endsWith('/')) {
          postLogoutRedirectUri = postLogoutRedirectUri.slice(0, -1);
        }
        return {
          clientId: client.clientId,
          name: client.name || client.clientId,
          description: client.description,
          redirectUris: client.redirectUris,
          enabled: client.enabled,
          postLogoutRedirectUri: postLogoutRedirectUri, // Added this for completeness, though not explicitly in the instruction's snippet
        };
      });

    return ResponseHandler.success(res, userApplications, "Applications retrieved successfully");
  })
);

// GET /api/account/security - Complete security overview
router.get(
  "/security",
  asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const realm = req.user.realm;

    logger.info("🔐 Fetching complete security settings for user:", userId);

    try {
      const svc = await kc(realm);
      const user = await svc.getUser(userId);

      // Get user sessions count
      let activeSessions = 0;
      try {
        const sessions = await svc.userSession(userId);
        activeSessions = sessions ? sessions.length : 0;
      } catch (error) {
        logger.warn("Could not fetch sessions count:", error);
      }

      // Parse security attributes with defaults
      const attrs = user.attributes || {};

      // Calculate password age and strength
      const lastPasswordChange = attrs.lastPasswordChange?.[0];
      const passwordAge = lastPasswordChange
        ? Math.floor(
          (Date.now() - new Date(lastPasswordChange).getTime()) /
          (1000 * 60 * 60 * 24)
        )
        : null;
      const recentPasswordChange = passwordAge !== null && passwordAge < 90;

      // Parse trusted devices
      let trustedDevices = [];
      try {
        trustedDevices = attrs.trustedDevices?.[0]
          ? JSON.parse(attrs.trustedDevices[0])
          : [];
      } catch (e) {
        logger.warn("Failed to parse trusted devices:", e);
      }

      // Calculate security score
      let securityScore = 0;
      if (user.emailVerified) securityScore += 20;
      if (user.totp) securityScore += 30;
      if (recentPasswordChange) securityScore += 15;
      if (attrs.mfaEnabled?.[0] === "true") securityScore += 25;
      if (attrs.loginNotifications?.[0] !== "false") securityScore += 10;

      const securitySettings = {
        // Basic info
        emailVerified: user.emailVerified || false,
        activeSessions,
        securityScore,

        // Authentication settings
        twoFactorEnabled: user.totp || false,
        mfaEnabled: attrs.mfaEnabled?.[0] === "true",

        // Password info
        lastPasswordChange,
        passwordAge,
        recentPasswordChange,
        strongPassword: true, // You can implement password strength analysis
        passwordExpiry: attrs.passwordExpiry?.[0] || null,

        // Security preferences
        loginNotifications: attrs.loginNotifications?.[0] !== "false",
        suspiciousActivityAlerts:
          attrs.suspiciousActivityAlerts?.[0] !== "false",
        sessionTimeout: attrs.sessionTimeout?.[0] === "true",

        // Security tracking
        failedLoginAttempts: parseInt(attrs.failedLoginAttempts?.[0] || "0"),
        trustedDevices,

        // User preferences
        locale: attrs.locale?.[0] || "en",
      };

      logger.info("✅ Security settings retrieved successfully");
      return ResponseHandler.success(res, securitySettings, "Security settings retrieved successfully");
    } catch (error) {
      logger.error("❌ Failed to fetch security settings:", error);
      res.status(500).json({
        error: "Fetch Failed",
        message: "Failed to retrieve security settings. Please try again.",
      });
    }
  })
);

// PUT /api/account/security - Update security settings
// PUT /api/account/security - Update security settings
router.put(
  "/security",
  asyncHandler(async (req, res) => {
    const { error, value } = updateSecuritySchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const userId = req.user.sub;
    const realm = req.user.realm;

    logger.info(
      "🔐 Updating security settings for user:",
      userId,
      "with data:",
      value
    );

    try {
      const svc = await kc(realm);
      const attributes = {};
      const updatedSettings = [];

      // Map settings to Keycloak attributes
      Object.keys(value).forEach((key) => {
        const val = value[key];
        if (val !== undefined && val !== null) {
          if (key === "trustedDevices") {
            // Handle JSON data
            attributes[key] = [
              typeof val === "string" ? val : JSON.stringify(val),
            ];
          } else if (key === "passwordExpiry") {
            // Handle date
            attributes[key] = [val];
          } else {
            // Handle boolean and string values
            attributes[key] = [val.toString()];
          }
          updatedSettings.push(key);
        }
      });

      // Update attributes in Keycloak
      if (Object.keys(attributes).length > 0) {
        await svc.updateUserAttributes(userId, attributes);
      }

      logger.info(
        "✅ Security settings updated successfully:",
        updatedSettings
      );

      return ResponseHandler.success(res, {
        updatedSettings,
      }, "Security settings updated successfully");
    } catch (error) {
      logger.error("❌ Security settings update failed:", error);
      res.status(500).json({
        error: "Update Failed",
        message: "Failed to update security settings. Please try again.",
      });
    }
  })
);

// POST /api/account/change-password - Change user password
router.post(
  "/change-password",
  auditSecurity('PASSWORD_CHANGE'),
  asyncHandler(async (req, res) => {
    logger.info("🔑 Password change request received");

    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const userId = req.user.sub;
    const realm = req.user.realm;
    const username =
      req.user.preferred_username || req.user.username || req.user.email;

    logger.info(
      "🔑 Password change request for user:",
      userId,
      "username:",
      username
    );

    try {
      const svc = await kc(realm);

      // ✅ STEP 1: Validate current password using KeycloakService
      logger.info("🔐 Validating current password...");
      const isCurrentPasswordValid = await svc.validateCurrentPassword(
        username,
        value.currentPassword
      );

      if (!isCurrentPasswordValid) {
        throw new AppError("The current password you entered is incorrect.", 400, "INVALID_CURRENT_PASSWORD");
      }

      logger.info("✅ Current password validated successfully");

      // ✅ STEP 2: Set new password (permanent)
      await svc.setUserPassword(userId, value.newPassword, false);

      // ✅ STEP 3: Format date as YYYY-MM-DD for Keycloak
      const now = new Date();
      const formattedDate = now.toISOString().split("T")[0];

      // ✅ STEP 4: Update attributes with proper date format
      await svc.updateUserAttributes(userId, {
        lastPasswordChange: [formattedDate],
        failedLoginAttempts: ["0"],
      });

      // ✅ STEP 5: Force logout all sessions
      const deletedSessions = await svc.forceLogoutAllUserSessions(userId);

      logger.info(
        "✅ Password changed successfully, sessions terminated:",
        deletedSessions
      );

      return ResponseHandler.success(res, {
        lastPasswordChange: formattedDate,
        sessionsTerminated: deletedSessions,
      }, "Password changed successfully. All sessions have been terminated.");
    } catch (error) {
      logger.error("❌ Password change failed:", error);

      // Enhanced error logging
      if (error.responseData) {
        logger.error("Keycloak validation error:", {
          field: error.responseData.field,
          message: error.responseData.errorMessage,
          params: error.responseData.params,
        });
      }

      res.status(500).json({
        error: "Password Change Failed",
        message: "Failed to change password. Please try again.",
      });
    }
  })
);

router.get(
  "/validate-session",
  asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const realm = req.user.realm;
    const tokenSessionId = req.user.sid || req.user.session_state; // Session ID from JWT

    logger.info("🔍 Validating session for user:", userId, "sid:", tokenSessionId);

    try {
      const svc = await kc(realm);
      const sessions = await svc.userSession(userId);

      if (!sessions || sessions.length === 0) {
        logger.info("❌ No active sessions found for user");
        return ResponseHandler.success(res, {
          valid: false,
          reason: 'no_sessions',
          sessionCount: 0,
        }, "No active sessions found");
      }

      const activeSessions = sessions.filter((s) => s.active !== false);

      // If we have a session ID from the token, check if it specifically exists
      if (tokenSessionId) {
        const currentSessionExists = activeSessions.some(
          (s) => s.id === tokenSessionId
        );

        if (!currentSessionExists) {
          logger.info("❌ Current session not found in active sessions (admin may have deleted it)");
          return ResponseHandler.success(res, {
            valid: false,
            reason: 'session_deleted',
            sessionCount: activeSessions.length,
          }, 'Your session was terminated by an administrator');
        }

        logger.info("✅ Current session is valid");
      }

      return ResponseHandler.success(res, {
        valid: activeSessions.length > 0,
        sessionCount: activeSessions.length,
        currentSessionValid: tokenSessionId ? true : undefined,
      }, "Session validation successful");
    } catch (error) {
      logger.error("❌ Session validation error:", error);

      // If Keycloak returns 404 or user not found, session is invalid
      if (error.response?.status === 404) {
        return ResponseHandler.success(res, {
          valid: false,
          reason: 'user_not_found',
          sessionCount: 0,
        }, "User not found");
      }

      res.status(500).json({
        error: "Session Validation Failed",
        message: "Failed to validate session. Please try again.",
      });
    }
  })
);


// GET /api/account/security-events - Security activity log
router.get(
  "/security-events",
  asyncHandler(async (req, res) => {
    logger.info("🛡️ Fetching security events for user");

    const userId = req.user.sub;
    const realm = req.user.realm;

    try {
      const svc = await kc(realm);

      // Get user events (last 30 days)
      const events = await svc.getUserEvents(realm, userId, {
        max: 50,
        first: 0,
      });

      logger.info("Raw security events:", events);

      // Transform events for frontend
      const securityEvents = events.map((event) => ({
        id: event.id,
        type: event.type,
        success: !event.error,
        timestamp: new Date(event.time),
        ipAddress: event.ipAddress,
        userAgent: event.details?.user_agent || "Unknown",
        details: event.details,
      }));

      logger.info("✅ Security events retrieved:", securityEvents.length);
      return ResponseHandler.success(res, securityEvents, "Security events retrieved successfully");
    } catch (error) {
      logger.error("❌ Failed to fetch security events:", error);
      return ResponseHandler.success(res, [], "No security events found"); // Return empty array on error but formatted
    }
  })
);

// DELETE /api/account/trusted-device/:deviceId - Remove trusted device
router.delete(
  "/trusted-device/:deviceId",
  asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const realm = req.user.realm;
    const { deviceId } = req.params;

    logger.info("🗑️ Removing trusted device:", deviceId, "for user:", userId);

    try {
      const svc = await kc(realm);
      const user = await svc.getUser(userId);

      // Get current trusted devices
      let trustedDevices = [];
      try {
        const devicesAttr = user.attributes?.trustedDevices?.[0];
        trustedDevices = devicesAttr ? JSON.parse(devicesAttr) : [];
      } catch (e) {
        logger.warn("Failed to parse trusted devices:", e);
      }

      // Remove the specified device
      trustedDevices = trustedDevices.filter(
        (device) => device.id !== deviceId
      );

      // Update the attribute
      await svc.updateUserAttributes(userId, {
        trustedDevices: [JSON.stringify(trustedDevices)],
      });

      logger.info("✅ Trusted device removed successfully");
      return ResponseHandler.success(res, {
        trustedDevices,
      }, "Trusted device removed successfully");
    } catch (error) {
      logger.error("❌ Failed to remove trusted device:", error);
      res.status(500).json({
        error: "Removal Failed",
        message: "Failed to remove trusted device. Please try again.",
      });
    }
  })
);

// POST /api/account/enable-2fa - Setup 2FA (optional advanced feature)
router.post(
  "/enable-2fa",
  asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const realm = req.user.realm;

    // This would generate TOTP secret and QR code for setup
    // For now, return mock response
    return ResponseHandler.success(res, {
      secret: "JBSWY3DPEHPK3PXP", // Mock secret
      qrCode:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // Mock QR
      backupCodes: ["123456789", "987654321"], // Mock backup codes
    }, "2FA setup initiated");
  })
);

// GET /api/account/sessions/stats - Get session statistics (MISSING ROUTE)
router.get(
  "/sessions/stats",
  asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const realm = req.user.realm;

    logger.info("📊 Fetching session statistics for user:", userId);

    const svc = await kc(realm);

    try {
      const sessions = await svc.userSession(userId);
      logger.info("Raw sessions data:", sessions);

      if (!sessions || sessions.length === 0) {
        return ResponseHandler.success(res, {
          totalSessions: 0,
          activeSessions: 0,
          uniqueIPs: 0,
          uniqueClients: 0,
          oldestSession: null,
          newestSession: null,
          deviceTypes: 0,
          suspiciousSessions: 0,
        }, "No sessions found for stats");
      }

      // Extract unique IPs
      const uniqueIPs = [...new Set(sessions.map((s) => s.ipAddress))].filter(
        Boolean
      );

      // Extract unique clients from the clients object
      const allClients = new Set();
      sessions.forEach((session) => {
        if (session.clients && typeof session.clients === "object") {
          Object.values(session.clients).forEach((clientId) =>
            allClients.add(clientId)
          );
        }
      });

      // Count device types (mock implementation based on user agents if available)
      const deviceTypes = sessions.reduce((types, session) => {
        // Since Keycloak doesn't provide userAgent directly, we'll estimate
        const ip = session.ipAddress;
        if (ip && ip.includes("192.168")) types.add("desktop");
        else if (ip && ip.includes("10.0")) types.add("mobile");
        else types.add("unknown");
        return types;
      }, new Set());

      // Calculate suspicious sessions (older than 3 days but still active)
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const suspiciousSessions = sessions.filter((session) => {
        return session.lastAccess && session.lastAccess < threeDaysAgo;
      });

      const stats = {
        totalSessions: sessions.length,
        activeSessions: sessions.length, // All returned sessions are active
        uniqueIPs: uniqueIPs.length,
        uniqueClients: allClients.size,
        deviceTypes: deviceTypes.size,
        suspiciousSessions: suspiciousSessions.length,
        oldestSession:
          sessions.length > 0
            ? Math.min(...sessions.map((s) => s.start || Date.now()))
            : null,
        newestSession:
          sessions.length > 0
            ? Math.max(...sessions.map((s) => s.lastAccess || Date.now()))
            : null,
      };

      logger.info("📊 Session statistics:", stats);
      logger.info("📊 Session statistics:", stats);
      return ResponseHandler.success(res, stats, "Session statistics retrieved successfully");
    } catch (error) {
      logger.error("❌ Failed to get session stats:", error);
      // Return default stats on error
      res.json({
        totalSessions: 1, // At least current session
        activeSessions: 1,
        uniqueIPs: 1,
        uniqueClients: 1,
        deviceTypes: 1,
        suspiciousSessions: 0,
        oldestSession: Date.now(),
        newestSession: Date.now(),
      });
    }
  })
);

/* --------- TOTP/2FA Implementation Backend Routes --------- */

const speakeasy = require("speakeasy"); // npm install speakeasy
const QRCode = require("qrcode"); // npm install qrcode
// Realm already imported at top of file


// GET /api/account/2fa/status - Get current 2FA status
// router.get(
//   "/2fa/status",
//   asyncHandler(async (req, res) => {
//     const userId = req.user.sub;
//     const realm = req.user.realm;

//     logger.info("🔒 Checking 2FA status for user:", userId);

//     const svc = await kc(realm);

//     try {
//       const user = await svc.getUser(userId);
//       logger.info("User data for 2FA status:", user);


//       // Check if user has TOTP configured in Keycloak
//       const totpConfigured = user.totp || false;

//       // Get user credentials to check for OTP credentials
//       const credentials = await svc.getUserCredentials(userId);
//       const otpCredentials = credentials.filter((cred) => cred.type === "otp");

//       const status = {
//         enabled: totpConfigured,
//         configured: otpCredentials.length > 0,
//         credentialId: otpCredentials.length > 0 ? otpCredentials[0].id : null,
//         backupCodes: user.attributes?.backupCodes || [],
//         setupDate: user.attributes?.totpSetupDate?.[0] || null,
//       };

//       res.json(status);
//     } catch (error) {
//       logger.error("❌ Failed to get 2FA status:", error);
//       res.status(500).json({
//         error: "Status Check Failed",
//         message: "Failed to check 2FA status",
//       });
//     }
//   })
// );


router.get('/2fa/status', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const realm = req.user.realm;

  try {
    const svc = await kc(realm);
    const status = await svc.getUserTOTPStatus(userId);
    if (status.enabled) {
      await svc.finalizeTOTPSetup(userId);
    }

    return ResponseHandler.success(res, status, "TOTP status retrieved");
  } catch (error) {
    logger.error('❌ Failed to get TOTP status:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
}));





router.post('/2fa/enable', asyncHandler(async (req, res) => {
  const { method = 'required_action' } = req.body;
  const userId = req.user.sub;
  const realm = req.user.realm;

  try {
    const svc = await kc(realm);

    const status = await svc.getUserTOTPStatus(userId);
    if (status.enabled) {
      throw new AppError('TOTP is already configured', 400, 'ALREADY_ENABLED');
    }

    if (method === 'email') {
      await svc.sendTOTPConfigurationEmail(userId);
      return ResponseHandler.success(res, {
        action: 'email_sent'
      }, 'TOTP setup email sent. Check your inbox.');
    } else {
      await svc.requireUserTOTPSetup(userId);
      return ResponseHandler.success(res, {
        action: 'required_action_set'
      }, 'TOTP setup will be required on your next login.');
    }
  } catch (error) {
    logger.error('❌ Failed to enable TOTP:', error);
    res.status(500).json({ error: 'Enable failed' });
  }
}));


// ✅ CORRECTED: Disable 2FA route
router.post('/2fa/disable', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const realm = req.user.realm;

  logger.info('🔐 Attempting to disable 2FA for user:', userId);

  try {
    const svc = await kc(realm);

    // ✅ Get all TOTP credentials
    logger.info('🔍 Getting user credentials...');
    const credentials = await svc.client.users.getCredentials({ id: userId });
    logger.info('📋 Found credentials:', credentials.map(c => ({ type: c.type, id: c.id })));

    const totpCredentials = credentials.filter(cred => cred.type === 'otp');
    logger.info('🔑 TOTP credentials found:', totpCredentials.length);

    if (totpCredentials.length === 0) {
      logger.info('⚠️ No TOTP credentials found');
      return res.status(400).json({
        error: 'Not Configured',
        message: 'TOTP is not configured for this user'
      });
    }

    // ✅ Remove all TOTP credentials
    logger.info('🗑️ Removing TOTP credentials...');
    for (const credential of totpCredentials) {
      logger.info('🗑️ Deleting credential:', credential.id);
      await svc.client.users.deleteCredential({
        id: userId,
        credentialId: credential.id
      });
      logger.info('✅ Deleted credential:', credential.id);
    }

    // ✅ Remove CONFIGURE_TOTP from required actions if present
    logger.info('🔧 Checking required actions...');
    const currentUser = await svc.client.users.findOne({ id: userId });
    logger.info('📋 Current required actions:', currentUser.requiredActions);

    if (currentUser.requiredActions?.includes('CONFIGURE_TOTP')) {
      const updatedActions = currentUser.requiredActions.filter(action => action !== 'CONFIGURE_TOTP');
      logger.info('🔧 Updating required actions to:', updatedActions);

      await svc.client.users.update({ id: userId }, {
        requiredActions: updatedActions
      });
      logger.info('✅ Required actions updated');
    }

    logger.info('✅ TOTP disabled successfully for user:', userId);

    res.json({
      message: 'Two-factor authentication has been successfully disabled',
      enabled: false,
      credentialsRemoved: totpCredentials.length
    });

  } catch (error) {
    logger.error('❌ Failed to disable TOTP:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      responseData: error.responseData
    });

    res.status(500).json({
      error: 'Disable Failed',
      message: 'Failed to disable 2FA. Please try again.',
      details: error.message
    });
  }
}));


// POST /api/account/2fa/setup - Initialize 2FA setup
router.post(
  "/2fa/setup",
  asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const realm = req.user.realm;
    const userEmail = req.user.email || req.user.preferred_username;

    logger.info("🔐 Initializing 2FA setup for user:", userId);

    try {
      // Generate secret for TOTP
      const secret = speakeasy.generateSecret({
        name: `Account Center (${userEmail})`,
        issuer: "Your Company Name",
        length: 32,
      });

      // Generate QR code
      const qrCodeUrl = speakeasy.otpauthURL({
        secret: secret.ascii,
        label: userEmail,
        issuer: "Your Company Name",
        encoding: "ascii",
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrCodeUrl);

      // Generate backup codes
      const backupCodes = generateBackupCodes();

      // Store temporary secret in user attributes (will be confirmed later)
      const svc = await kc(realm);
      await svc.updateUserAttributes(userId, {
        tempTotpSecret: [secret.base32],
        tempBackupCodes: backupCodes,
      });

      return ResponseHandler.success(res, {
        secret: secret.base32,
        qrCode: qrCodeDataURL,
        backupCodes: backupCodes,
        manualEntryKey: secret.base32,
        setupInstructions: [
          "1. Install Google Authenticator or similar app",
          "2. Scan the QR code or enter the manual key",
          "3. Enter the 6-digit code to verify setup",
          "4. Save your backup codes securely",
        ],
      }, "2FA setup initiated");
    } catch (error) {
      logger.error("❌ Failed to setup 2FA:", error);
      res.status(500).json({
        error: "Setup Failed",
        message: "Failed to initialize 2FA setup",
      });
    }
  })
);

// POST /api/account/2fa/verify - Verify and enable 2FA
router.post(
  "/2fa/verify",
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    const userId = req.user.sub;
    const realm = req.user.realm;

    if (!token || token.length !== 6) {
      throw new AppError("Please enter a valid 6-digit code", 400, "INVALID_TOKEN");
    }

    logger.info("🔐 Verifying 2FA token for user:", userId);

    const svc = await kc(realm);

    try {
      // Get the temporary secret
      const user = await svc.getUser(userId);
      const tempSecret = user.attributes?.tempTotpSecret?.[0];
      const tempBackupCodes = user.attributes?.tempBackupCodes || [];

      if (!tempSecret) {
        throw new AppError("Please start 2FA setup first", 400, "SETUP_REQUIRED");
      }

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: tempSecret,
        encoding: "base32",
        token: token,
        window: 2, // Allow 2 time steps of variance
      });

      if (!verified) {
        throw new AppError("The code you entered is incorrect. Please try again.", 400, "INVALID_CODE");
      }

      // Token is valid - enable TOTP in Keycloak
      await svc.enableUserTOTP(userId, tempSecret);

      // Update user attributes
      await svc.updateUserAttributes(userId, {
        backupCodes: tempBackupCodes,
        totpSetupDate: [new Date().toISOString()],
        // Remove temporary attributes
        tempTotpSecret: null,
        tempBackupCodes: null,
      });

      // Log security event
      logger.info("🔐 Security Event: 2FA enabled", {
        userId,
        timestamp: new Date().toISOString(),
        ipAddress: req.ip,
      });

      return ResponseHandler.success(res, {
        message: "2FA has been successfully enabled",
        backupCodes: tempBackupCodes,
        enabled: true,
      }, "2FA enabled successfully");
    } catch (error) {
      logger.error("❌ Failed to verify 2FA:", error);
      res.status(500).json({
        error: "Verification Failed",
        message: "Failed to verify 2FA code",
      });
    }
  })
);

// POST /api/account/2fa/disable - Disable 2FA
// router.post(
//   "/2fa/disable",
//   asyncHandler(async (req, res) => {
//     const { password, token } = req.body;
//     const userId = req.user.sub;
//     const realm = req.user.realm;

//     logger.info("🔐 Disabling 2FA for user:", userId);

//     const svc = await kc(realm);

//     try {
//       // Verify user password or TOTP token before disabling
//       if (token) {
//         // Verify TOTP token
//         const user = await svc.getUser(userId);
//         const credentials = await svc.getUserCredentials(userId);
//         const otpCredential = credentials.find((cred) => cred.type === "otp");

//         if (!otpCredential) {
//           return res.status(400).json({
//             error: "Not Configured",
//             message: "2FA is not currently enabled",
//           });
//         }

//         // Note: Keycloak doesn't provide direct TOTP verification API
//         // In production, you might need to verify against stored secret
//         // or use Keycloak's authentication flow
//       }

//       // Remove TOTP credentials
//       const credentials = await svc.getUserCredentials(userId);
//       const otpCredentials = credentials.filter((cred) => cred.type === "otp");

//       for (const credential of otpCredentials) {
//         await svc.deleteUserCredential(userId, credential.id);
//       }

//       // Clear TOTP-related attributes
//       await svc.updateUserAttributes(userId, {
//         backupCodes: null,
//         totpSetupDate: null,
//       });

//       // Log security event
//       logger.info("🔐 Security Event: 2FA disabled", {
//         userId,
//         timestamp: new Date().toISOString(),
//         ipAddress: req.ip,
//       });

//       res.json({
//         message: "2FA has been successfully disabled",
//         enabled: false,
//       });
//     } catch (error) {
//       logger.error("❌ Failed to disable 2FA:", error);
//       res.status(500).json({
//         error: "Disable Failed",
//         message: "Failed to disable 2FA",
//       });
//     }
//   })
// );


// router.post('/2fa/setup-redirect', asyncHandler(async (req, res) => {
//   const userId = req.user.sub;
//   const realm = req.user.realm;

//   try {
//     const svc = await kc(realm);
//     const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8081';
//     const ACCOUNT_UI_URL = process.env.ACCOUNT_UI_URL || 'http://account.localhost/';

//     // 1️⃣ Set required action if not present
//     const currentUser = await svc.client.users.findOne({ id: userId });
//     const existingActions = currentUser.requiredActions || [];

//     if (!existingActions.includes('CONFIGURE_TOTP')) {
//       await svc.client.users.update({ id: userId }, {
//         requiredActions: [...existingActions, 'CONFIGURE_TOTP']
//       });
//     }

//     // 2️⃣ Generate Keycloak Account Console URL with redirect back to account-ui
//     const keycloakAccountUrl = `${KEYCLOAK_URL}/realms/${realm}/account/?referrer=account-ui&referrer_uri=${encodeURIComponent(ACCOUNT_UI_URL)}`;

//     // 3️⃣ Return URL to frontend
//     res.json({
//       redirectUrl: keycloakAccountUrl,
//       message: 'Please complete 2FA setup in Keycloak Account Console'
//     });

//   } catch (error) {
//     logger.error('❌ Failed to setup 2FA redirect:', error);
//     res.status(500).json({ error: 'Failed to initiate 2FA setup' });
//   }
// }));


// ✅ Setup with direct required action and custom redirect
// ✅ CORRECTED: Make sure this route returns the correct field name
router.post('/2fa/setup-redirect', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const realm = req.user.realm;

  logger.info('🔐 Setting up 2FA redirect for user:', userId, 'realm:', realm);

  try {
    const svc = await kc(realm);

    const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8081';
    logger.info('🌐 Using KEYCLOAK_URL:', KEYCLOAK_URL);

    if (!KEYCLOAK_URL) {
      logger.error('❌ KEYCLOAK_URL environment variable not set');
      logger.error('❌ KEYCLOAK_URL environment variable not set');
      throw new AppError('KEYCLOAK_URL not configured', 500, 'CONFIG_ERROR');
    }

    // Set required action
    const currentUser = await svc.client.users.findOne({ id: userId });
    const existingActions = currentUser.requiredActions || [];

    if (!existingActions.includes('CONFIGURE_TOTP')) {
      await svc.client.users.update({ id: userId }, {
        requiredActions: [...existingActions, 'CONFIGURE_TOTP']
      });
    }

    // ✅ Generate the Keycloak Account Console URL
    const keycloakAccountUrl = `${KEYCLOAK_URL}/realms/${realm}/account/`;

    logger.info('✅ Generated redirect URL:', keycloakAccountUrl);

    // ✅ Make sure to return 'redirectUrl' field (not 'setupUrl')
    return ResponseHandler.success(res, {
      redirectUrl: keycloakAccountUrl, // ✅ This field name must match what frontend expects
    }, 'Please complete 2FA setup in Keycloak Account Console');

  } catch (error) {
    logger.error('❌ Failed to setup 2FA redirect:', error);
    res.status(500).json({
      error: 'Failed to initiate 2FA setup',
      details: error.message
    });
  }
}));




// ✅ CORRECTED: Setup with proper redirect back to account-ui
router.post('/2fa/setup-email', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const realm = req.user.realm;

  try {
    const svc = await kc(realm);

    // ✅ Use your actual frontend URL
    await svc.client.users.executeActionsEmail({
      id: userId,
      actions: ['CONFIGURE_TOTP'],
      lifespan: 43200, // 12 hours
      clientId: 'account-ui',
      redirectUri: `${ACCOUNT_UI_URL}/account/security?2fa=completed`
    });

    logger.info('✅ 2FA setup email sent with redirect to account-ui');

    return ResponseHandler.success(res, {
      method: 'email',
      action: 'email_sent'
    }, 'Setup email sent! You will be redirected back after completion.');

  } catch (error) {
    logger.error('❌ Failed to send 2FA setup email:', error);
    res.status(500).json({ error: 'Failed to send setup email' });
  }
}));





router.get('/2fa/check', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const realm = req.user.realm;

  try {
    const svc = await kc(realm);

    const credentials = await svc.getUserCredentials(userId);
    const totpCredentials = credentials.filter(cred => cred.type === 'otp');
    const isConfigured = totpCredentials.length > 0;

    return ResponseHandler.success(res, {
      configured: isConfigured,
      credentialCount: totpCredentials.length
    }, "2FA status check successful");
  } catch (error) {
    logger.error('❌ Failed to check 2FA completion:', error);
    res.status(500).json({ error: 'Failed to check setup status' });
  }
}));


// POST /api/account/2fa/regenerate-backup - Generate new backup codes
router.post(
  "/2fa/regenerate-backup",
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    const userId = req.user.sub;
    const realm = req.user.realm;

    if (!token || token.length !== 6) {
      throw new AppError("Please enter your current 2FA code to regenerate backup codes", 400, "INVALID_TOKEN");
    }

    logger.info("🔐 Regenerating backup codes for user:", userId);

    const svc = await kc(realm);

    try {
      // Verify current TOTP token (simplified verification)
      // In production, implement proper TOTP verification

      // Generate new backup codes
      const newBackupCodes = generateBackupCodes();

      // Update user attributes
      await svc.updateUserAttributes(userId, {
        backupCodes: newBackupCodes,
      });

      return ResponseHandler.success(res, {
        backupCodes: newBackupCodes,
      }, "Backup codes regenerated successfully");
    } catch (error) {
      logger.error("❌ Failed to regenerate backup codes:", error);
      res.status(500).json({
        error: "Regeneration Failed",
        message: "Failed to regenerate backup codes",
      });
    }
  })
);

// Helper function to generate backup codes
function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-digit backup codes
    const code = Math.random().toString().substr(2, 8);
    codes.push(code);
  }
  return codes;
}


/**
 * =========================================================================
 * ORGANIZATION STATUS CHECK - Add this to acount.route.js
 * =========================================================================
 * GET /api/account/organization-status
 * Check if user has organization membership and client requirements
 */
router.get('/organization-status', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const clientId = req.user.client_id;

  logger.info('🔍 Checking organization status', { userId, clientId });

  try {
    // 1. Get client configuration from database
    const { Client, UserMetadata, OrganizationMembership, Organization, Role } = require('../../config/database');

    const client = await Client.findOne({
      where: { client_id: clientId }
    });

    if (!client) {
      logger.error('❌ Client not found', { clientId });
      logger.error('❌ Client not found', { clientId });
      throw new AppError('Client configuration not found', 400, 'INVALID_CLIENT');
    }

    logger.info('📋 Client config loaded', {
      clientId,
      requiresOrg: client.requires_organization,
      orgModel: client.organization_model
    });

    // 2. Get user's organization memberships
    const user = await UserMetadata.findOne({
      where: { keycloak_id: userId },
      include: [
        {
          model: OrganizationMembership,
          as: 'Memberships',
          include: [
            {
              model: Organization,
              attributes: ['id', 'name', 'tenant_id', 'status']
            },
            {
              model: Role,
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Organization,
          as: 'PrimaryOrganization',
          attributes: ['id', 'name', 'tenant_id']
        }
      ]
    });

    if (!user) {
      logger.error('❌ User not found', { userId });
      logger.error('❌ User not found', { userId });
      throw new AppError('User metadata not found', 404, 'USER_NOT_FOUND');
    }

    // 3. Filter active memberships only
    const activeMemberships = user.Memberships?.filter(
      m => m.Organization?.status === MEMBER_STATUS.ACTIVE
    ) || [];

    logger.info('👤 User memberships found', {
      userId,
      membershipCount: activeMemberships.length,
      orgs: activeMemberships.map(m => m.Organization?.name).filter(Boolean)
    });

    // 4. Determine email type (company vs personal)
    const userEmail = user.email || req.user.email;
    const personalDomains = [
      'gmail.com', 'outlook.com', 'hotmail.com',
      'yahoo.com', 'protonmail.com', 'icloud.com',
      'aol.com', 'mail.com', 'zoho.com', 'live.com'
    ];

    const emailDomain = userEmail ? userEmail.split('@')[1]?.toLowerCase() : null;
    const isCompanyEmail = emailDomain && !personalDomains.includes(emailDomain);

    // 5. Build comprehensive response
    const response = {
      // Client requirements
      clientRequiresOrganization: client.requires_organization || false,
      organizationModel: client.organization_model || 'flexible',
      onboardingFlow: client.onboarding_flow || 'flexible',
      organizationFeatures: client.organization_features || [],

      // User's organization status
      hasOrganization: activeMemberships.length > 0,
      organizationCount: activeMemberships.length,

      // User's memberships with full details
      organizations: activeMemberships.map(m => ({
        id: m.Organization.id,
        name: m.Organization.name,
        tenantId: m.Organization.tenant_id,
        status: m.Organization.status,
        role: m.Role?.name || 'member',
        membershipId: m.id
      })),

      // Primary organization
      primaryOrganization: user.PrimaryOrganization ? {
        id: user.PrimaryOrganization.id,
        name: user.PrimaryOrganization.name,
        tenantId: user.PrimaryOrganization.tenant_id
      } : (activeMemberships[0] ? {
        id: activeMemberships[0].Organization.id,
        name: activeMemberships[0].Organization.name,
        tenantId: activeMemberships[0].Organization.tenant_id
      } : null),

      // Email type and multi-org permissions
      emailType: isCompanyEmail ? 'company' : 'personal',
      emailDomain,
      canJoinMultipleOrgs: !isCompanyEmail,

      // Frontend routing decision flags
      requiresOnboarding: client.requires_organization && activeMemberships.length === 0,
      canAccessDashboard: !client.requires_organization || activeMemberships.length > 0,

      // Additional context
      userContext: {
        userId: user.id,
        keycloakId: user.keycloak_id,
        email: userEmail,
        isActive: user.is_active
      }
    };

    logger.info('✅ Organization status result', {
      requiresOnboarding: response.requiresOnboarding,
      canAccessDashboard: response.canAccessDashboard,
      orgCount: response.organizationCount
    });

    return ResponseHandler.success(res, response, "Organization status check successful");

  } catch (error) {
    logger.error('❌ Organization status check failed:', error);
    return res.status(500).json({
      error: 'Status Check Failed',
      message: 'Failed to check organization status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));


// routes/acount.route.js - Add at the end before module.exports

/* --------- SOCIAL LOGIN ACCOUNT MANAGEMENT --------- */

// GET /api/account/connected-accounts - List all connected social accounts
router.get('/connected-accounts', asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  logger.info('🔗 Fetching connected accounts for user:', userId);

  try {
    const { UserMetadata, FederatedIdentityMapping } = require('../../config/database');

    const dbUser = await UserMetadata.findOne({
      where: { keycloak_id: userId },
      include: [{
        model: FederatedIdentityMapping,
        as: 'FederatedIdentities',
        order: [['last_login', 'DESC']]
      }]
    });

    if (!dbUser) {
      throw new AppError('User metadata not found', 404, 'USER_NOT_FOUND');
    }

    const accounts = dbUser.FederatedIdentities.map(fi => ({
      id: fi.id,
      provider: fi.provider,
      providerEmail: fi.providerEmail,
      linkedAt: fi.linkedAt,
      lastLogin: fi.lastLogin,
      metadata: {
        isWorkspace: fi.metadata?.isWorkspace || false,
        workspaceDomain: fi.metadata?.workspaceDomain || null,
        emailVerified: fi.metadata?.emailVerified || false
      }
    }));

    // Check if user also has Keycloak password
    const realm = req.user.realm;
    const svc = await kc(realm);
    const keycloakUser = await svc.getUser(userId);

    const hasPassword = keycloakUser.credentials?.some(c => c.type === 'password') || false;

    return ResponseHandler.success(res, {
      accounts: accounts,
      hasKeycloakPassword: hasPassword,
      primaryEmail: dbUser.email,
      lastLoginProvider: dbUser.lastLoginProvider
    }, "Connected accounts retrieved successfully");

  } catch (error) {
    logger.error('❌ Failed to fetch connected accounts:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: 'Failed to retrieve connected accounts'
    });
  }
}));

// DELETE /api/account/connected-accounts/:provider - Unlink a social account
router.delete('/connected-accounts/:provider', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { provider } = req.params;

  logger.info('🔓 Unlinking account:', { userId, provider });

  try {
    const { UserMetadata, FederatedIdentityMapping, AuditLog } = require('../../config/database');

    // Get user and count federated identities
    const dbUser = await UserMetadata.findOne({
      where: { keycloak_id: userId },
      include: [{
        model: FederatedIdentityMapping,
        as: 'FederatedIdentities'
      }]
    });

    if (!dbUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Prevent unlinking if it's the only login method
    if (dbUser.FederatedIdentities.length === 1) {
      throw new AppError('Cannot unlink your only login method. Add another login method first.', 400, 'CANNOT_UNLINK');
    }

    // Find and delete the specific federated identity
    const identityToRemove = dbUser.FederatedIdentities.find(fi => fi.provider === provider);

    if (!identityToRemove) {
      throw new AppError(`No ${provider} account connected`, 404, 'NOT_FOUND');
    }

    await FederatedIdentityMapping.destroy({
      where: {
        user_id: dbUser.id,
        provider: provider
      }
    });

    // Also remove from Keycloak
    const realm = req.user.realm;
    const svc = await kc(realm);

    try {
      await svc.client.users.delFromFederatedIdentity({
        id: userId,
        federatedIdentityId: provider
      });
    } catch (kcError) {
      logger.warn('Could not remove from Keycloak:', kcError.message);
    }

    // Audit log
    await AuditService.log({
      action: 'SOCIAL_ACCOUNT_UNLINKED',
      userId: userId,
      orgId: dbUser.orgId,
      clientId: req.user.client_id,
      metadata: {
        provider: provider,
        providerEmail: identityToRemove.providerEmail
      }
    });

    logger.info('✅ Account unlinked:', provider);

    return ResponseHandler.success(res, {
      provider: provider
    }, `${provider} account unlinked successfully`);

  } catch (error) {
    logger.error('❌ Failed to unlink account:', error);
    res.status(500).json({
      error: 'Unlink Failed',
      message: 'Failed to unlink account'
    });
  }
}));

// GET /api/account/login-history - Get login history with provider info
router.get('/login-history', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { limit = 50 } = req.query;

  logger.info('📜 Fetching login history for user:', userId);

  try {
    const { AuditLog } = require('../../config/database');

    const loginHistory = await AuditLog.findAll({
      where: {
        user_id: userId,
        action: {
          [Sequelize.Op.in]: ['USER_LOGIN', 'SUSPICIOUS_LOGIN_DETECTED']
        }
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    const formattedHistory = loginHistory.map(log => ({
      timestamp: log.created_at,
      action: log.action,
      provider: log.details?.provider || 'keycloak',
      emailVerified: log.details?.emailVerified || false,
      isWorkspace: log.details?.isWorkspace || false,
      ipAddress: log.details?.ipAddress || 'Unknown',
      suspicious: log.action === 'SUSPICIOUS_LOGIN_DETECTED',
      alerts: log.details?.alerts || []
    }));

    return ResponseHandler.success(res, {
      history: formattedHistory,
      total: loginHistory.length
    }, "Login history retrieved successfully");

  } catch (error) {
    logger.error('❌ Failed to fetch login history:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: 'Failed to retrieve login history'
    });
  }
}));





/* ============================================================================
 * NOTIFICATION PREFERENCES ROUTES
 * ============================================================================ */

// GET /notifications - Get notification preferences
router.get('/notifications', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const realm = req.user.realm;

  const svc = await kc(realm);
  const user = await svc.getUser(userId);

  const preferences = {
    emailFrequency: user.attributes?.emailFrequency?.[0] || 'immediate',
    quietHours: user.attributes?.quietHours?.[0] || 'none',
    securityAlerts: {
      email: user.attributes?.securityAlertsEmail?.[0] !== 'false',
      push: user.attributes?.securityAlertsPush?.[0] !== 'false'
    },
    loginNotifications: {
      email: user.attributes?.loginNotificationsEmail?.[0] !== 'false',
      push: user.attributes?.loginNotificationsPush?.[0] !== 'false'
    },
    passwordChanges: {
      email: user.attributes?.passwordChangesEmail?.[0] !== 'false',
      push: user.attributes?.passwordChangesPush?.[0] !== 'false'
    },
    appUpdates: {
      email: user.attributes?.appUpdatesEmail?.[0] !== 'false',
      push: user.attributes?.appUpdatesPush?.[0] !== 'false'
    },
    serviceStatus: {
      email: user.attributes?.serviceStatusEmail?.[0] !== 'false',
      push: user.attributes?.serviceStatusPush?.[0] !== 'false'
    },
    productUpdates: {
      email: user.attributes?.productUpdatesEmail?.[0] === 'true',
      push: user.attributes?.productUpdatesPush?.[0] === 'true'
    },
    tips: {
      email: user.attributes?.tipsEmail?.[0] === 'true',
      push: user.attributes?.tipsPush?.[0] === 'true'
    },
    newsletter: {
      email: user.attributes?.newsletterEmail?.[0] === 'true'
    },
    contactEmail: user.email,
    contactPhone: user.attributes?.phone?.[0]
  };

  res.json(preferences);
}));

// PUT /notifications - Update notification preferences
router.put('/notifications', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const realm = req.user.realm;
  const preferences = req.body;

  const svc = await kc(realm);

  // Convert nested preferences to flat attributes
  const attributes = {};

  Object.keys(preferences).forEach(key => {
    if (typeof preferences[key] === 'object' && preferences[key] !== null) {
      // Handle nested objects like securityAlerts: { email: true, push: false }
      Object.keys(preferences[key]).forEach(subKey => {
        attributes[`${key}${subKey.charAt(0).toUpperCase() + subKey.slice(1)}`] = [preferences[key][subKey].toString()];
      });
    } else {
      // Handle simple values
      attributes[key] = [preferences[key].toString()];
    }
  });

  await svc.updateUserAttributes(userId, attributes);

  res.json({ message: 'Notification preferences updated successfully' });
}));

/* ============================================================================
 * PRIVACY SETTINGS ROUTES
 * ============================================================================ */

// GET /privacy - Get privacy settings
router.get('/privacy', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const realm = req.user.realm;

  const svc = await kc(realm);
  const user = await svc.getUser(userId);

  const privacy = {
    analytics: user.attributes?.analytics?.[0] !== 'false',
    performance: user.attributes?.performance?.[0] !== 'false',
    crashReporting: user.attributes?.crashReporting?.[0] !== 'false',
    recommendations: user.attributes?.recommendations?.[0] !== 'false',
    targetedContent: user.attributes?.targetedContent?.[0] !== 'false',
    partnerSharing: user.attributes?.partnerSharing?.[0] === 'true',
    marketingPartners: user.attributes?.marketingPartners?.[0] === 'true',
    locationTracking: user.attributes?.locationTracking?.[0] === 'true',
    crossDeviceTracking: user.attributes?.crossDeviceTracking?.[0] === 'true'
  };

  res.json(privacy);
}));

// PUT /privacy - Update privacy settings
router.put('/privacy', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const realm = req.user.realm;

  const svc = await kc(realm);

  const attributes = {};
  Object.keys(req.body).forEach(key => {
    attributes[key] = [req.body[key].toString()];
  });

  await svc.updateUserAttributes(userId, attributes);

  res.json({ message: 'Privacy settings updated successfully' });
}));

// GET /data-usage - Get data usage information
router.get('/data-usage', asyncHandler(async (req, res) => {
  // This would typically come from actual usage tracking
  const dataUsage = {
    totalDataPoints: 1250,
    sharedPartners: 3,
    retentionDays: 365
  };

  res.json(dataUsage);
}));

// POST /export-data - Export user data
router.post('/export-data', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const realm = req.user.realm;

  // In a real implementation, this would:
  // 1. Gather all user data from various sources
  // 2. Create a comprehensive export file
  // 3. Store it securely for download
  // 4. Send email notification when ready

  // For now, return a mock response
  res.json({
    message: 'Data export initiated',
    downloadUrl: `/api/account/download-export/${userId}`,
    estimatedTime: '5-10 minutes'
  });
}));

// DELETE /delete - Delete user account
router.delete('/delete', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const realm = req.user.realm;

  const svc = await kc(realm);

  // In a real implementation, this would:
  // 1. Anonymize or delete all user data
  // 2. Remove from all systems
  // 3. Send confirmation email
  // 4. Log the deletion for audit purposes

  await svc.deleteUser(userId);

  res.json({ message: 'Account deletion initiated' });
}));

/* ============================================================================
 * USER PREFERENCES ROUTES
 * ============================================================================ */

// GET /preferences - Get user preferences
router.get('/preferences', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const realm = req.user.realm;

  const svc = await kc(realm);
  const user = await svc.getUser(userId);

  const preferences = {
    theme: user.attributes?.theme?.[0] || 'system',
    colorScheme: user.attributes?.colorScheme?.[0] || 'blue',
    density: user.attributes?.density?.[0] || 'comfortable',
    reducedMotion: user.attributes?.reducedMotion?.[0] === 'true',
    language: user.attributes?.language?.[0] || 'en',
    timezone: user.attributes?.timezone?.[0] || 'UTC+00:00',
    dateFormat: user.attributes?.dateFormat?.[0] || 'MM/DD/YYYY',
    timeFormat: user.attributes?.timeFormat?.[0] || '12h',
    autoSaveInterval: parseInt(user.attributes?.autoSaveInterval?.[0]) || 30,
    fastLoading: user.attributes?.fastLoading?.[0] !== 'false',
    backgroundSync: user.attributes?.backgroundSync?.[0] !== 'false',
    highContrast: user.attributes?.highContrast?.[0] === 'true',
    largeText: user.attributes?.largeText?.[0] === 'true',
    screenReader: user.attributes?.screenReader?.[0] === 'true',
    keyboardNavigation: user.attributes?.keyboardNavigation?.[0] !== 'false',
    cacheDuration: user.attributes?.cacheDuration?.[0] || '7d',
    offlineMode: user.attributes?.offlineMode?.[0] !== 'false',
    // Mock storage data
    storageUsed: '2.3',
    cacheSize: '156',
    offlineData: '45'
  };

  res.json(preferences);
}));

// PUT /preferences - Update user preferences
router.put('/preferences', asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const realm = req.user.realm;

  const svc = await kc(realm);

  const attributes = {};
  Object.keys(req.body).forEach(key => {
    // Skip read-only fields like storage info
    if (!['storageUsed', 'cacheSize', 'offlineData'].includes(key)) {
      attributes[key] = [req.body[key].toString()];
    }
  });

  await svc.updateUserAttributes(userId, attributes);

  res.json({ message: 'Preferences updated successfully' });
}));





module.exports = router;

// const express = require('express');
// const router = express.Router();
// // const verifyToken = require('../../middleware/verifyToken');
// const KeycloakService = require('../../services/keycloak.service');
// const {authMiddleware} = require('../../middleware/authMiddleware');
// const { log } = require('winston');

// // router.use(verifyToken);

// router.get('/me', authMiddleware, async (req, res) => {
//   try {
//     const { sub: userId, iss } = req.user;
//     const realm = iss.split('/realms/')[1]; // e.g. extract realm from token issuer
//     const keycloak = new KeycloakService(realm);
//     await keycloak.initialize();

//     const user = await keycloak.getUser(userId);
//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// router.put('/me', async (req, res) => {
//   try {
//     const { sub: userId, iss } = req.user;
//     const realm = iss.split('/realms/')[1];
//     const keycloak = new KeycloakService(realm);
//     await keycloak.initialize();

//     const { email, firstName, lastName } = req.body;

//     await keycloak.updateUser(userId, {
//       email,
//       firstName,
//       lastName,
//     });

//     res.json({ message: 'Profile updated' });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to update profile' });
//   }
// });

// router.put('/me/change-password', authMiddleware, async (req, res) => {
//   try {
//     log('Changing password for user:', req.user.sub);
//     const { sub: userId, iss } = req.user;
//     const realm = iss.split('/realms/')[1];
//     const keycloak = new KeycloakService(realm);
//     await keycloak.initialize();

//     const { newPassword } = req.body;
//     if (!newPassword) return res.status(400).json({ message: 'Missing password' });chethang

//     await keycloak.resetUserPassword(userId, newPassword);

//     res.json({ message: 'Password changed' });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to change password' });
//   }
// });

// router.get('/me/sessions', authMiddleware, async (req, res) => {
//     logger.info("Fetching user sessions");

//   try {
//     logger.info('ree', req.user);

//     const { sub: userId, iss } = req.user;
//     const realm = iss.split('/realms/')[1];
//     const keycloak = new KeycloakService(realm);
//     await keycloak.initialize();

//     const sessions = await keycloak.userSession(userId);
//     res.json(sessions);
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to get sessions' });
//   }
// });

// router.delete('/me/sessions/:sessionId', authMiddleware,  async (req, res) => {
//     logger.info("Revoking session", req.params.sessionId);

//   try {
//     logger.info('req.user', req.user);

//     const { sub: userId, iss } = req.user;
//     logger.info('userId', userId);

//     const realm = iss.split('/realms/')[1];
//     const sessionId = req.params.sessionId;
//     logger.info(sessionId, 'sessionId');

//     const keycloak = new KeycloakService(realm);
//     await keycloak.initialize();
//     logger.info('keycloak initialized');

//     await keycloak.deleteUserSession(userId, sessionId);
//     res.json({ message: 'Session revoked' });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to revoke session' });
//   }
// });

// router.post('/me/logout', async (req, res) => {
//   try {
//     const { sub: userId, iss } = req.user;
//     const realm = iss.split('/realms/')[1];
//     const keycloak = new KeycloakService(realm);
//     await keycloak.initialize();

//     await keycloak.logoutUser(userId);
//     res.json({ message: 'Logged out from all sessions' });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to logout' });
//   }
// });

// router.get('/me/roles', async (req, res) => {
//   try {
//     const { sub: userId, iss, azp: clientId } = req.user;
//     const realm = iss.split('/realms/')[1];

//     const keycloak = new KeycloakService(realm);
//     await keycloak.initialize();

//     const roles = await keycloak.getUserRoles(userId, clientId);
//     res.json(roles);
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to fetch roles' });
//   }
// });

// router.post('/me/enable-2fa', async (req, res) => {
//   try {
//     const { sub: userId, iss } = req.user;
//     const realm = iss.split('/realms/')[1];

//     const keycloak = new KeycloakService(realm);
//     await keycloak.initialize();

//     await keycloak.client.users.executeActionsEmail({
//       id: userId,
//       actions: ['CONFIGURE_TOTP'],
//     });

//     res.json({ message: '2FA setup initiated. Check your email.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to start 2FA setup' });
//   }
// });

// router.post('/me/verify-2fa', async (req, res) => {
//   res.json({
//     message: 'Please login and complete 2FA QR setup in your profile',
//     url: 'https://<your-keycloak>/realms/<realm>/account',
//   });
// });

// router.post('/me/disable-2fa', async (req, res) => {
//   try {
//     const { sub: userId, iss } = req.user;
//     const realm = iss.split('/realms/')[1];

//     const keycloak = new KeycloakService(realm);
//     await keycloak.initialize();

//     await keycloak.client.users.executeActionsEmail({
//       id: userId,
//       actions: ['REMOVE_TOTP'],
//     });

//     res.json({ message: '2FA removal initiated. Check your email.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to disable 2FA' });
//   }
// });

// module.exports = router;
