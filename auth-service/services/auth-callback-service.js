// services/auth-callback.service.js
// Service to handle authentication callback logic and organization onboarding

const {
  UserMetadata,
  Organization,
  OrganizationMembership,
  TenantMapping,
  PendingInvitation,
  Role,
  sequelize
} = require('../config/database');
const logger = require('../utils/logger');

class AuthCallbackService {
  /**
   * Handle pending invitations for user during authentication
   * This is called during the auth callback to auto-accept admin-provisioned organizations
   */
  static async handlePendingInvitations(user, client) {
    const userEmail = user.email;
    const emailVerified = user.email_verified || false;

    logger.info('Checking for pending invitations', {
      userEmail,
      emailVerified,
      userId: user.id
    });

    try {
      // Find pending invitation for this email
      const pendingInvitation = await PendingInvitation.findOne({
        where: {
          email: userEmail,
          status: 'pending'
        },
        include: [
          {
            model: Organization,
            attributes: ['id', 'name', 'tenant_id', 'status']
          },
          {
            model: Role,
            attributes: ['id', 'name', 'description']
          }
        ]
      });

      if (!pendingInvitation) {
        logger.info('No pending invitations found', { userEmail });
        return {
          autoAccepted: false,
          requiresVerification: false
        };
      }

      // Check if email verification is required
      if (!emailVerified) {
        logger.warn('Email verification required for pending invitation', {
          userEmail,
          orgId: pendingInvitation.org_id,
          orgName: pendingInvitation.Organization.name
        });

        return {
          autoAccepted: false,
          requiresVerification: true,
          message: 'Please verify your email address to access your organization',
          organization: pendingInvitation.Organization
        };
      }

      // Auto-accept the pending invitation in a transaction
      const transaction = await sequelize.transaction();

      try {
        // 1. Ensure user metadata exists
        let userMetadata = await UserMetadata.findOne({
          where: { keycloak_id: user.id },
          transaction
        });

        if (!userMetadata) {
          userMetadata = await UserMetadata.create({
            keycloak_id: user.id,
            email: userEmail,
            is_active: true,
            last_login: new Date()
          }, { transaction });
        }

        // 2. Create organization membership
        const existingMembership = await OrganizationMembership.findOne({
          where: {
            user_id: userMetadata.id,
            org_id: pendingInvitation.org_id
          },
          transaction
        });

        if (!existingMembership) {
          await OrganizationMembership.create({
            user_id: userMetadata.id,
            org_id: pendingInvitation.org_id,
            role_id: pendingInvitation.role_id
          }, { transaction });
        }

        // 3. Set as user's primary organization if they don't have one
        if (!userMetadata.org_id) {
          await userMetadata.update({
            org_id: pendingInvitation.org_id
          }, { transaction });
        }

        // 4. Update organization status to active
        await Organization.update(
          { status: 'active' },
          {
            where: { id: pendingInvitation.org_id },
            transaction
          }
        );

        // 5. Create tenant mapping if client requires tenant
        if (client.requires_tenant) {
          await TenantMapping.upsert({
            user_id: user.id,
            tenant_id: pendingInvitation.Organization.tenant_id,
            client_key: client.client_key
          }, { transaction });
        }

        // 6. Mark pending invitation as accepted
        await pendingInvitation.update({
          status: 'accepted',
          accepted_at: new Date()
        }, { transaction });

        await transaction.commit();

        logger.info('Auto-accepted pending invitation', {
          userEmail,
          userId: user.id,
          orgId: pendingInvitation.org_id,
          orgName: pendingInvitation.Organization.name,
          tenantId: pendingInvitation.Organization.tenant_id
        });

        return {
          autoAccepted: true,
          organization: pendingInvitation.Organization,
          role: pendingInvitation.Role,
          tenantId: pendingInvitation.Organization.tenant_id,
          membership: true
        };

      } catch (error) {
        await transaction.rollback();
        logger.error('Failed to auto-accept pending invitation', {
          error: error.message,
          userEmail,
          orgId: pendingInvitation.org_id
        });
        throw error;
      }

    } catch (error) {
      logger.error('Error handling pending invitations', {
        error: error.message,
        userEmail,
        stack: error.stack
      });

      // Don't fail authentication, just log and continue
      return {
        autoAccepted: false,
        requiresVerification: false,
        error: error.message
      };
    }
  }

  /**
   * Check tenant requirements for multi-tenant clients
   * Determines if user needs to create/join an organization
   */
  static async checkTenantRequirements(user, client) {
    if (!client.requires_tenant) {
      return {
        needsTenant: false,
        availableActions: []
      };
    }

    const userKeycloakId = user.keycloak_id || user.id;

    try {
      // Check existing tenant mapping
      const existingMapping = await TenantMapping.findOne({
        where: {
          user_id: userKeycloakId,
          client_key: client.client_key
        }
      });

      if (existingMapping) {
        // User already has tenant mapping
        return {
          needsTenant: false,
          tenantId: existingMapping.tenant_id,
          availableActions: []
        };
      }

      // Check if user has organization memberships
      const userMetadata = await UserMetadata.findOne({
        where: { keycloak_id: userKeycloakId },
        include: [
          {
            model: OrganizationMembership,
            as: 'Memberships',
            include: [
              {
                model: Organization,
                attributes: ['id', 'name', 'tenant_id']
              }
            ]
          }
        ]
      });

      const availableActions = ['create']; // User can always create new org

      if (userMetadata?.Memberships?.length > 0) {
        // User has existing organization memberships
        const orgsWithTenantId = userMetadata.Memberships
          .filter(m => m.Organization?.tenant_id)
          .map(m => m.Organization);

        if (orgsWithTenantId.length > 0) {
          // Could automatically select first org with tenant_id
          // For now, let user choose
          availableActions.push('select_existing');
        }
      }

      return {
        needsTenant: true,
        tenantId: null,
        availableActions,
        existingOrganizations: userMetadata?.Memberships?.map(m => ({
          id: m.Organization.id,
          name: m.Organization.name,
          tenant_id: m.Organization.tenant_id,
          role: m.Role?.name
        })) || []
      };

    } catch (error) {
      logger.error('Error checking tenant requirements', {
        error: error.message,
        userKeycloakId,
        clientKey: client.client_key
      });

      // Default to requiring tenant creation
      return {
        needsTenant: true,
        tenantId: null,
        availableActions: ['create'],
        error: error.message
      };
    }
  }

  /**
   * Get user's organization context for authentication
   * Returns comprehensive organization information for the user
   */
  static async getUserOrganizationContext(user) {
    const userId = user.id;

    try {
      // Get user with all organization relationships
      const userMetadata = await UserMetadata.findByPk(userId, {
        include: [
          {
            model: Organization,
            as: 'PrimaryOrganization',
            attributes: ['id', 'name', 'tenant_id', 'status']
          },
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
                attributes: ['id', 'name', 'description']
              }
            ]
          }
        ]
      });

      if (!userMetadata) {
        return {
          primaryOrganization: null,
          memberships: [],
          totalOrganizations: 0
        };
      }

      // Process memberships
      const memberships = userMetadata.Memberships?.map(membership => ({
        id: membership.id,
        organization: {
          id: membership.Organization.id,
          name: membership.Organization.name,
          tenant_id: membership.Organization.tenant_id,
          status: membership.Organization.status
        },
        role: {
          id: membership.Role.id,
          name: membership.Role.name,
          description: membership.Role.description
        },
        membership_type: 'member'
      })) || [];

      // Primary organization info
      const primaryOrganization = userMetadata.PrimaryOrganization ? {
        id: userMetadata.PrimaryOrganization.id,
        name: userMetadata.PrimaryOrganization.name,
        tenant_id: userMetadata.PrimaryOrganization.tenant_id,
        status: userMetadata.PrimaryOrganization.status,
        membership_type: 'primary'
      } : null;

      const totalOrganizations = memberships.length + (primaryOrganization ? 1 : 0);

      logger.info('Retrieved user organization context', {
        userId,
        primaryOrg: primaryOrganization?.name,
        membershipCount: memberships.length,
        totalOrganizations
      });

      return {
        primaryOrganization,
        memberships,
        totalOrganizations
      };

    } catch (error) {
      logger.error('Error getting user organization context', {
        error: error.message,
        userId,
        stack: error.stack
      });

      return {
        primaryOrganization: null,
        memberships: [],
        totalOrganizations: 0,
        error: error.message
      };
    }
  }

  /**
   * Check if user has access to specific tenant/organization
   */
  static async hasOrganizationAccess(user, orgId) {
    try {
      const userMetadata = await UserMetadata.findOne({
        where: { keycloak_id: user.keycloak_id || user.id },
        include: [
          {
            model: OrganizationMembership,
            as: 'Memberships',
            where: { org_id: orgId },
            required: false
          }
        ]
      });

      // Check if user is primary member or has membership
      const hasPrimaryAccess = userMetadata?.org_id === orgId;
      const hasMembershipAccess = userMetadata?.Memberships?.length > 0;

      return hasPrimaryAccess || hasMembershipAccess;

    } catch (error) {
      logger.error('Error checking organization access', {
        error: error.message,
        userId: user.id,
        orgId
      });
      return false;
    }
  }

  /**
   * Get or create user metadata
   */
  static async ensureUserMetadata(user) {
    try {
      let userMetadata = await UserMetadata.findOne({
        where: { keycloak_id: user.keycloak_id || user.id }
      });

      if (!userMetadata) {
        userMetadata = await UserMetadata.create({
          keycloak_id: user.keycloak_id || user.id,
          email: user.email,
          is_active: true,
          last_login: new Date()
        });

        logger.info('Created new user metadata', {
          userId: userMetadata.id,
          keycloakId: user.keycloak_id || user.id,
          email: user.email
        });
      } else {
        // Update last login
        await userMetadata.update({
          last_login: new Date(),
          email: user.email // Sync email from Keycloak
        });
      }

      return userMetadata;

    } catch (error) {
      logger.error('Error ensuring user metadata', {
        error: error.message,
        keycloakId: user.keycloak_id || user.id,
        email: user.email
      });
      throw error;
    }
  }
}

module.exports = AuthCallbackService;