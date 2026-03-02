'use strict';

const { ServiceHttpClient } = require('@spidy092/service-auth');
const config = require('../config');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * Auth Service Client
 *
 * Uses Keycloak Client Credentials (OAuth2) to authenticate
 * service-to-service calls to auth-service's internal API.
 *
 * The ServiceHttpClient automatically:
 * - Fetches a Keycloak service account JWT via Client Credentials grant
 * - Caches the token in memory with automatic refresh
 * - Deduplicates concurrent token requests (thundering herd protection)
 * - Injects the Bearer token into every request
 */
class AuthServiceClient {
    constructor() {
        this._client = null;
    }

    /**
     * Lazy-init the ServiceHttpClient (avoids startup errors if env not ready)
     */
    _getClient() {
        if (this._client) return this._client;

        this._client = new ServiceHttpClient({
            keycloakUrl: config.KEYCLOAK_URL,
            realm: config.KEYCLOAK_REALM,
            clientId: config.EMAIL_SERVICE_CLIENT_ID,
            clientSecret: config.EMAIL_SERVICE_CLIENT_SECRET,
            baseUrl: config.AUTH_SERVICE_URL || 'http://auth-service:4000',
        });

        logger.info('🔐 AuthServiceClient initialized with Keycloak Client Credentials', {
            keycloakUrl: config.KEYCLOAK_URL,
            realm: config.KEYCLOAK_REALM,
            clientId: config.EMAIL_SERVICE_CLIENT_ID,
            authServiceUrl: config.AUTH_SERVICE_URL || 'http://auth-service:4000',
        });

        return this._client;
    }

    /**
     * Fetch Organization Settings from Auth Service
     * @param {string} orgId
     * @returns {Object} Settings JSON
     */
    async getOrganizationSettings(orgId) {
        if (!orgId) return {};

        try {
            const client = this._getClient();
            const { data } = await client.get(`/api/internal/organizations/${orgId}/settings`);
            return data?.data || {};
        } catch (error) {
            if (error.details?.status === 404) {
                logger.warn(`AuthService: Organization ${orgId} not found`);
                return {};
            }
            logger.error(`Failed to fetch org settings for ${orgId}:`, { error: error.message });
            throw AppError.internal('Failed to fetch organization settings', 'AUTH_SERVICE_ERROR');
        }
    }
}

module.exports = new AuthServiceClient();
