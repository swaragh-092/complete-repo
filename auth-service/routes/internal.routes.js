'use strict';

const express = require('express');
const router = express.Router();
const { Organization } = require('../config/database');
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
            email: req.user?.email
        });
        return ResponseHandler.error(res, 'Only service accounts can access internal APIs', 403);
    }
    next();
};

router.use(requireServiceAccount);

// GET /api/internal/organizations/:id/settings
// Used by email-service to fetch org-specific SMTP and template overrides
router.get('/organizations/:id/settings', asyncHandler(async (req, res) => {
    const orgId = req.params.id;

    const organization = await Organization.findByPk(orgId, {
        attributes: ['id', 'settings']
    });

    if (!organization) {
        throw new AppError('Organization not found', 404, 'NOT_FOUND');
    }

    logger.info('Internal API: Organization settings retrieved', {
        orgId,
        callerClientId: req.service.clientId
    });

    return ResponseHandler.success(res, organization.settings || {}, 'Settings retrieved successfully');
}));

module.exports = router;
