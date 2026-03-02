'use strict';

/**
 * Centralized Service Clients for Auth Service
 *
 * Single source of truth for all cross-service HTTP clients.
 *
 * Usage:
 *   const { emailClient } = require('./serviceClients');
 *   await emailClient().post('/api/v1/email/send', payload);
 */

const { ServiceHttpClient } = require('@spidy092/service-auth');

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:4011';

// ── Singleton ───────────────────────────────────────────────────────────────
let _emailClient = null;

/**
 * Get the email-service HTTP client (lazy init, cached).
 * @returns {ServiceHttpClient}
 */
function emailClient() {
    if (!_emailClient) {
        _emailClient = new ServiceHttpClient({
            keycloakUrl: process.env.KEYCLOAK_URL,
            realm: process.env.KEYCLOAK_REALM || 'my-projects',
            clientId: process.env.AUTH_SERVICE_CLIENT_ID || 'auth-service',
            clientSecret: process.env.AUTH_SERVICE_CLIENT_SECRET,
            baseUrl: EMAIL_SERVICE_URL,
        });
    }
    return _emailClient;
}

module.exports = {
    emailClient,
};
