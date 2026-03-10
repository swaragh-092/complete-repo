'use strict';

const express = require('express');
const router = express.Router();
const { Organization, UserMetadata } = require('../config/database');
const KeycloakService = require('../services/keycloak.service');
const logger = require('../utils/logger');
const ResponseHandler = require('../utils/responseHandler');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { hybridAuthMiddleware } = require('../middleware/hybridAuthMiddleware');

/**
 * Internal Service API Routes
 *
 * These routes are consumed by other microservices (e.g., email-service)
 * using Keycloak Client Credentials authentication (service accounts).
 *
 * Security: Protected by hybridAuthMiddleware which validates Keycloak
 * service account JWTs via JWKS (no DB lookup, signature-verified).
 */

// All internal routes require a valid Keycloak service token
router.use(hybridAuthMiddleware);

/**
 * Middleware to ensure only service accounts can access internal routes.
 * Rejects user tokens — only Keycloak Client Credentials tokens are allowed.
 */
const requireServiceAccount = (req, res, next) => {
  if (!req.service?.isService) {
    logger.warn('Non-service token attempted internal API access', {
      sub: req.user?.sub,
      email: req.user?.email,
    });
    return ResponseHandler.error(res, 'Only service accounts can access internal APIs', 403);
  }
  next();
};

router.use(requireServiceAccount);

/**
 * POST /api/internal/users/lookup
 * Batch fetch user details (name, email) by user IDs
 * Used by microservices to enrich data with user information
 *
 * Body: { user_ids: ["uuid1", "uuid2"], user_id_type: "id" }
 * Returns: { users: [{ id, name, email }] }
 */
router.post(
  '/users/lookup',
  asyncHandler(async (req, res) => {
    const { user_ids, user_id_type = 'id' } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return ResponseHandler.error(res, 'user_ids must be a non-empty array', 400);
    }

    // Step 1: Get UserMetadata to get keycloak_ids
    const whereClause =
      user_id_type === 'keycloak_id'
        ? { keycloak_id: { [require('sequelize').Op.in]: user_ids } }
        : { id: { [require('sequelize').Op.in]: user_ids } };

    const userMetadataRecords = await UserMetadata.findAll({
      where: whereClause,
      attributes: ['id', 'keycloak_id', 'email'],
    });

    if (userMetadataRecords.length === 0) {
      return ResponseHandler.success(res, { users: [] });
    }

    // Step 2: Fetch names from Keycloak
    const realm = process.env.KEYCLOAK_REALM || 'server';
    const keycloak = new KeycloakService(realm);
    await keycloak.initialize();

    const usersWithNames = await Promise.all(
      userMetadataRecords.map(async (userMeta) => {
        try {
          const kcUser = await keycloak.getUser(userMeta.keycloak_id);
          const name =
            `${kcUser.firstName || ''} ${kcUser.lastName || ''}`.trim() || userMeta.email;

          return {
            id: user_id_type === 'keycloak_id' ? userMeta.keycloak_id : userMeta.id,
            name,
            email: kcUser.email || userMeta.email,
          };
        } catch (err) {
          logger.warn('Failed to fetch Keycloak user', {
            keycloak_id: userMeta.keycloak_id,
            error: err.message,
          });
          return {
            id: user_id_type === 'keycloak_id' ? userMeta.keycloak_id : userMeta.id,
            name: userMeta.email,
            email: userMeta.email,
          };
        }
      })
    );

    logger.info('Internal API: User details retrieved', {
      count: usersWithNames.length,
      callerClientId: req.service.clientId,
    });

    return ResponseHandler.success(res, { users: usersWithNames });
  })
);

// GET /api/internal/organizations/:id/settings
// Used by email-service to fetch org-specific SMTP and template overrides
router.get(
  '/organizations/:id/settings',
  asyncHandler(async (req, res) => {
    const orgId = req.params.id;

    const organization = await Organization.findByPk(orgId, {
      attributes: ['id', 'settings'],
    });

    if (!organization) {
      throw new AppError('Organization not found', 404, 'NOT_FOUND');
    }

    logger.info('Internal API: Organization settings retrieved', {
      orgId,
      callerClientId: req.service.clientId,
    });

    return ResponseHandler.success(
      res,
      organization.settings || {},
      'Settings retrieved successfully'
    );
  })
);

module.exports = router;
