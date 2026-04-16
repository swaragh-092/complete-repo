// services/social-login.service.js
const { UserMetadata, FederatedIdentityMapping, Organization } = require('../config/database');
const { Op } = require('sequelize');
const KeycloakService = require('./keycloak.service');
const logger = require('../utils/logger');

class SocialLoginService {

  /**
   * Handle all account linking edge cases
   */
  static async handleAccountLinking(user, client) {
    try {
      logger.info('🔗 Starting account linking check:', {
        email: user.email,
        provider: user.provider,
        emailVerified: user.emailVerified
      });

      // Skip for direct Keycloak login
      if (user.provider === 'keycloak') {
        return { error: false, skipped: true };
      }

      // Check if user exists in database
      const existingUser = await UserMetadata.findOne({
        where: { email: user.email }
      });

      // CASE 1: Brand new user - allow Keycloak to create
      if (!existingUser) {
        logger.info('✅ New user - Keycloak will create account');
        return {
          error: false,
          newUser: true,
          message: 'New user will be created by Keycloak'
        };
      }

      logger.info('📌 Existing user found:', {
        id: existingUser.id,
        keycloak_id: existingUser.keycloak_id
      });

      // Get federated identities for this user
      const federatedIdentities = await FederatedIdentityMapping.findAll({
        where: { user_id: existingUser.id }
      });

      const existingProviders = federatedIdentities.map(fi => fi.provider);
      logger.info('🔍 User has providers:', existingProviders);

      // CASE 2: User logging in with same provider - allow
      if (existingProviders.includes(user.provider)) {
        logger.info('✅ User logging in with existing provider');
        return {
          error: false,
          existingUser: true,
          sameProvider: true
        };
      }

      // CASE 3: User with NEW provider (account linking scenario)
      logger.info('⚠️  User logging in with NEW provider');

      // Only require email verification for linking
      // For trusted providers (Google, Microsoft), skip email verification check
      const trustedProviders = ['google', 'microsoft', 'github'];

      if (!user.emailVerified && !trustedProviders.includes(user.provider)) {
        // Only block for untrusted providers
        return {
          error: true,
          code: 'EMAIL_NOT_VERIFIED',
          message: `Email must be verified by ${user.provider} before linking to your existing account.`
        };
      }

      // Auto-link for trusted providers OR if email is verified
      logger.info('✅ Auto-linking provider to existing user');
      return {
        error: false,
        needsLinking: true,
        autoLink: true,
        existingUser: existingUser,
        message: 'Account will be linked automatically'
      };

    } catch (error) {
      logger.error('❌ Account linking check failed:', error);
      return {
        error: true,
        code: 'LINKING_CHECK_ERROR',
        message: error.message
      };
    }
  }

  /**
   * Track federated login and create/update mappings
   */
  static async trackFederatedLogin(user, req) {
    try {
      if (!user.provider || user.provider === 'keycloak') {
        return { tracked: true, skipped: true };
      }

      logger.info('📝 Tracking federated login:', {
        keycloakId: user.id,
        provider: user.provider,
        email: user.email
      });

      // Find user in database
      let dbUser = await UserMetadata.findOne({
        where: { keycloak_id: user.id }
      });

      if (!dbUser) {
        // Try by email (for auto-linking)
        dbUser = await UserMetadata.findOne({
          where: { email: user.email }
        });

        if (!dbUser) {
          logger.warn('⚠️  User not in database yet, will retry');
          return { tracked: false, needsUserCreation: true };
        }
      }

      const trustedProviders = ['google', 'microsoft', 'github', 'apple'];

      logger.info('🔍 Checking auto-verify:', {
        provider: user.provider,
        isTrusted: trustedProviders.includes(user.provider),
        userId: user.id
      });

      if (trustedProviders.includes(user.provider)) {
        try {
          logger.info('🔄 Attempting to verify email for user:', user.id);
          const result = await KeycloakService.verifyUserEmail(user.id);
          logger.info('✅ Verify result:', result);
        } catch (error) {
          logger.error('⚠️ Failed to auto-verify email (non-critical):', error.message);
          logger.error('Full error:', error);
        }
      }
      // === END AUTO-VERIFY ===

      // Upsert federated identity mapping
      const [mapping, created] = await FederatedIdentityMapping.findOrCreate({
        where: {
          user_id: dbUser.id,
          provider: user.provider
        },
        defaults: {
          provider_user_id: user.providerId || user.id,
          provider_email: user.email,
          last_login: new Date(),
          metadata: {
            isWorkspace: user.isWorkspace || false,
            emailVerified: user.emailVerified || false,
            givenName: user.givenName,
            familyName: user.familyName
          }
        }
      });

      if (!created) {
        // Update existing mapping
        await mapping.update({
          last_login: new Date(),
          provider_email: user.email,
          metadata: {
            ...mapping.metadata,
            emailVerified: user.emailVerified || false
          }
        });
      }

      logger.info('✅ Federated identity tracked:', {
        id: mapping.id,
        provider: mapping.provider,
        created: created
      });

      // Update user metadata
      await UserMetadata.update({
        last_login_provider: user.provider,
        last_login_ip: req.ip || req.connection.remoteAddress,
        last_login: new Date()
      }, {
        where: { id: dbUser.id }
      });

      return { tracked: true, created: created, mappingId: mapping.id };

    } catch (error) {
      logger.error('❌ Failed to track federated login:', error);
      return { tracked: false, error: error.message };
    }
  }

  /**
   * Detect suspicious login patterns
   */
  static async detectSuspiciousLogin(user, req) {
    try {
      const alerts = [];

      // Check for rapid provider switching
      const recentLogins = await FederatedIdentityMapping.findAll({
        where: {
          provider_email: user.email,
          last_login: {
            [Op.gte]: new Date(Date.now() - 3600000) // Last hour
          }
        }
      });

      if (recentLogins.length > 3) {
        alerts.push('RAPID_PROVIDER_SWITCHING');
      }

      return {
        suspicious: alerts.length > 0,
        alerts: alerts
      };

    } catch (error) {
      logger.error('Error detecting suspicious login:', error);
      return { suspicious: false, error: error.message };
    }
  }

  /**
   * Validate provider is allowed for organization
   */
  static async validateProviderForOrganization(user, orgId) {
    try {
      if (!orgId) {
        return { allowed: true, message: 'No organization context' };
      }

      const org = await Organization.findByPk(orgId);

      if (!org) {
        return { allowed: false, code: 'ORG_NOT_FOUND', message: 'Organization not found' };
      }

      // Check organization allowed providers (if configured)
      const allowedProviders = org.allowed_providers || ['google', 'microsoft', 'github', 'keycloak'];

      if (!allowedProviders.includes(user.provider)) {
        return {
          allowed: false,
          code: 'PROVIDER_NOT_ALLOWED',
          message: `${user.provider} login is not allowed for this organization.`
        };
      }

      return { allowed: true };

    } catch (error) {
      logger.error('Error validating provider for organization:', error);
      return { allowed: true, error: error.message };
    }
  }
}

module.exports = SocialLoginService;
