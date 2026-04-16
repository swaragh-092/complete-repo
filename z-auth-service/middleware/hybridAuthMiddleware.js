'use strict';

/**
 * hybridAuthMiddleware
 *
 * Auto-detects whether an incoming request carries a USER token (browser JWT)
 * or a SERVICE token (Keycloak Client Credentials JWT), and routes to the
 * appropriate validation path:
 *
 * - Service tokens → JWKS validation only (no DB lookup, no ghost users)
 * - User tokens   → Existing authMiddleware (full user context with roles/permissions)
 *
 * Detection logic:
 * Keycloak service account JWTs have NO `email` claim and their
 * `preferred_username` starts with `service-account-`.
 *
 * Usage:
 *   const { hybridAuthMiddleware } = require('./middleware/hybridAuthMiddleware');
 *   router.use(hybridAuthMiddleware);
 */

const jwt = require('jsonwebtoken');
const { verifyJwt } = require('../services/jwt.service');
const { authMiddleware } = require('./authMiddleware');
const { extractRealmFromToken } = require('../utils/helper');
const logger = require('../utils/logger');

/**
 * Peek into a JWT to check claims WITHOUT verifying the signature.
 * This is safe because we ALWAYS verify the signature afterwards.
 *
 * @param {string} token - Raw JWT string
 * @returns {Object|null} Decoded payload or null
 */
function peekToken(token) {
    try {
        return jwt.decode(token, { complete: false });
    } catch {
        return null;
    }
}

/**
 * Determine if a decoded JWT payload represents a service account.
 *
 * @param {Object} decoded - Decoded JWT payload
 * @returns {boolean}
 */
function isServiceToken(decoded) {
    if (!decoded) return false;

    // Primary check: no email + service-account username prefix
    const hasNoEmail = !decoded.email;
    const hasServicePrefix = typeof decoded.preferred_username === 'string' &&
        decoded.preferred_username.startsWith('service-account-');

    // Secondary check: clientId claim is present (Keycloak adds this to service tokens)
    const hasClientId = !!decoded.clientId;

    // A token is a service token if it has no email AND either has the service prefix OR clientId
    return hasNoEmail && (hasServicePrefix || hasClientId);
}

/**
 * Validate a service token using JWKS (no DB queries).
 * Sets req.service and a lightweight req.user for backward compatibility.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @param {string} token
 * @param {Object} peeked - Pre-decoded payload (for extracting realm)
 */
async function handleServiceToken(req, res, next, token, peeked) {
    try {
        const realm = extractRealmFromToken(token);
        const decoded = await verifyJwt(token, realm);

        const clientId = decoded.azp || decoded.clientId;

        // Set req.service (primary identity for service tokens)
        req.service = {
            sub: decoded.sub,
            clientId,
            roles: [
                ...(decoded.realm_access?.roles || []),
                ...(decoded.resource_access?.[clientId]?.roles || []),
            ],
            isService: true,
            isLegacy: false,
        };

        // Set req.user for backward compatibility with existing code
        // that checks req.user in route handlers
        req.user = {
            id: null,               // No UserMetadata.id for services
            keycloak_id: decoded.sub,
            sub: decoded.sub,
            email: null,
            name: decoded.preferred_username || clientId,
            preferred_username: decoded.preferred_username,
            realm,

            client_id: clientId,
            tenant_id: null,

            organizations: [],
            org_roles: [],
            permissions: [],
            kc_roles: decoded.realm_access?.roles || [],
            roles: decoded.realm_access?.roles || [],

            permissions_by_org: {},
            roles_by_org: {},

            is_service: true,
            is_active: true,

            // Stub methods that always return false for services
            hasPermission: () => false,
            hasRole: (role) => req.service.roles.includes(role),
            hasAnyRole: (roles) => roles.some(r => req.service.roles.includes(r)),
            isInOrganization: () => false,
        };

        logger.info('Service authenticated via hybrid middleware', {
            clientId,
            sub: decoded.sub,
            rolesCount: req.service.roles.length,
        });

        next();
    } catch (err) {
        logger.error('Service token validation failed:', { error: err.message });
        return res.status(401).json({
            error: 'Service token validation failed',
            code: 'INVALID_SERVICE_TOKEN',
        });
    }
}

/**
 * Express middleware that auto-detects user vs service tokens.
 */
const hybridAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // No auth header → let authMiddleware handle the 401
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return authMiddleware(req, res, next);
    }

    let token = authHeader.split(' ')[1];
    if (token) {
        token = token.replace(/^["']|["']$/g, '').trim();
    }

    // Peek at the token to determine type (no signature verification yet)
    const peeked = peekToken(token);

    if (isServiceToken(peeked)) {
        // SERVICE PATH: JWKS-only validation, no DB queries
        return handleServiceToken(req, res, next, token, peeked);
    }

    // USER PATH: Full user context (DB lookups, roles, permissions)
    return authMiddleware(req, res, next);
};

module.exports = {
    hybridAuthMiddleware,
    isServiceToken,  // Exported for testing
    peekToken,       // Exported for testing
};
