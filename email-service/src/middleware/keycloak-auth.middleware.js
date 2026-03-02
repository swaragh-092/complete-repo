'use strict';

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const config = require('../config');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Initialize JWKS client
// Rate limit prevents spamming Keycloak if many invalid tokens are sent
const client = jwksClient({
    jwksUri: `${config.KEYCLOAK_URL}/realms/${config.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 600000, // 10 mins
    rateLimit: true,
    jwksRequestsPerMinute: 10
});

/**
 * Fetch signing key from Keycloak
 */
function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        if (err) {
            logger.error('Error fetching signing key', { error: err.message });
            return callback(err, null);
        }
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

/**
 * Keycloak Auth Middleware
 * Validates Bearer token against Keycloak JWKS
 * Supports both User JWTs (Browser) and Service JWTs (Client Credentials)
 */
const keycloakAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // ── Legacy: x-service-secret fallback (togglable) ───────────
            const LEGACY_AUTH_ENABLED = process.env.LEGACY_AUTH_ENABLED !== 'false';

            if (LEGACY_AUTH_ENABLED && req.headers['x-service-secret'] === config.SERVICE_SECRET) {
                logger.warn('[keycloak-auth] ⚠️ DEPRECATED: Request authenticated via x-service-secret. Migrate to JWT.');
                req.user = {
                    sub: 'legacy-service',
                    is_service: true,
                    roles: ['legacy-admin']
                };
                return next();
            }
            return next(AppError.unauthorized('Missing or invalid Authorization header'));
        }

        const token = authHeader.split(' ')[1];

        // Verify token options
        const options = {
            algorithms: ['RS256'],
            issuer: `${config.KEYCLOAK_ISSUER_URL}/realms/${config.KEYCLOAK_REALM}`
        };

        jwt.verify(token, getKey, options, (err, decoded) => {
            if (err) {
                logger.warn('Token verification failed', { error: err.message });
                return next(AppError.unauthorized('Invalid token'));
            }

            // Extract useful info from token
            req.user = {
                sub: decoded.sub,                   // User ID or Service Client ID
                email: decoded.email,               // Present for users, missing for services

                // Roles can be in realm_access or resource_access depending on config
                roles: decoded.realm_access?.roles || [],

                client_id: decoded.azp,             // Authorized party (client_id)
                is_service: !decoded.email,         // Services typically don't have email

                // Organization context (if present in custom claims)
                org_id: decoded.org_id || decoded.tenant_id
            };

            logger.info('Authenticated request', {
                sub: req.user.sub,
                client: req.user.client_id,
                is_service: req.user.is_service
            });

            next();
        });

    } catch (err) {
        next(err);
    }
};

/**
 * Require specific role (e.g. 'superadmin' or 'email-sender')
 */
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(AppError.unauthorized('Not authenticated'));
        }

        // Check if user has the required role
        const hasRole = req.user.roles.includes(role);

        // Legacy bypass
        if (req.user.sub === 'legacy-service') {
            return next();
        }

        if (!hasRole) {
            logger.warn('Access denied: missing role', {
                required: role,
                user: req.user.sub
            });
            return next(AppError.forbidden(`Requires role: ${role}`));
        }

        next();
    };
};

module.exports = {
    keycloakAuth,
    requireRole
};
