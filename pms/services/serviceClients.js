'use strict';

/**
 * Centralized Service Clients for PMS
 *
 * Single source of truth for all cross-service HTTP clients.
 * Uses lazy initialization — clients are created on first use.
 *
 * Usage:
 *   const { authClient, emailClient } = require('./serviceClients');
 *   await emailClient().post('/api/v1/email/send', payload);
 *   await authClient().post('/auth/workspaces/members/lookup', payload);
 */

const { ServiceHttpClient } = require('@spidy092/service-auth');

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:4011';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || process.env.DOMAIN_AUTH || 'http://auth-service:4000';

// ── Singletons ──────────────────────────────────────────────────────────────
let _emailClient = null;
let _authClient = null;

/**
 * Get the email-service HTTP client (lazy init, cached).
 * @returns {ServiceHttpClient}
 */
function emailClient() {
    if (!_emailClient) {
        _emailClient = new ServiceHttpClient({
            keycloakUrl: process.env.KEYCLOAK_URL,
            realm: process.env.KEYCLOAK_REALM || 'my-projects',
            clientId: process.env.SERVICE_CLIENT_ID,
            clientSecret: process.env.SERVICE_CLIENT_SECRET,
            baseUrl: EMAIL_SERVICE_URL,
        });
    }
    return _emailClient;
}

/**
 * Get the auth-service HTTP client (lazy init, cached).
 * @returns {ServiceHttpClient}
 */
function authClient() {
    if (!_authClient) {
        _authClient = new ServiceHttpClient({
            keycloakUrl: process.env.KEYCLOAK_URL,
            realm: process.env.KEYCLOAK_REALM || 'my-projects',
            clientId: process.env.SERVICE_CLIENT_ID,
            clientSecret: process.env.SERVICE_CLIENT_SECRET,
        });
    }
    return _authClient;
}

module.exports = {
    emailClient,
    authClient,
};
