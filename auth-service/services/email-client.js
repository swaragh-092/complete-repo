'use strict';

/**
 * Email Service Client
 * 
 * Use this module to send emails via the Email Service microservice.
 */

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:4011';
const SERVICE_SECRET = process.env.SERVICE_SECRET;

const { getKeycloakService } = require('../config/index');

/**
 * Send an email via the Email Service
 * @param {object} options
 * @param {string} options.type - Email type (see EMAIL_TYPES)
 * @param {string} options.to - Recipient email address
 * @param {object} options.data - Template data
 * @returns {Promise<object>} - Response from email service
 */
async function send({ type, to, data }) {
    try {
        // Get service token using Client Credentials (auth-service identity)
        // We use 'approved' realm or master, usually configured in config
        const keycloakService = await getKeycloakService();
        // We need the token for THIS service (auth-service) to call email-service
        // KeycloakService has getServiceAccessToken which fetches token for a target client
        // BUT here we want to authenticate AS auth-service.
        // Actually, getServiceAccessToken(clientKey) gets a token for the clientKey client using ITS secret.
        // We need to know which client key represents 'auth-service' in our config/clients list.
        // Assuming 'auth-service' or similar key exists in loadClients() used by getServiceAccessToken.

        // Let's check how getServiceAccessToken works in keycloak.service.js:
        // it takes clientKey, looks up client_id/secret, and gets token.
        // We want a token representing "auth-service". 
        // If config/clients.js has an entry for 'auth-service', we use that.

        // For now, let's assume we have a client config for 'email-client' or uses the main admin creds?
        // Actually, common pattern is: auth-service has its own client_id/secret in env.

        // REVISIT: keycloak.service.js Line 137: getServiceAccessToken(clientKey)
        // It loads clients from config. Let's assume there is a client config for this service.
        // If not, we might need to fallback or use a specific configured client.

        // Simplest valid path if we don't have a specific 'auth-service' client config loaded:
        // We can use the admin client token if it's superadmin? No, that's not good practice.

        // Let's try to get a token for 'auth-service' assuming it's configured.
        // If this fails, we might need to add it to config/clients.js

        let token;
        try {
            token = await keycloakService.getServiceAccessToken('auth-service');
        } catch (e) {
            // Fallback: If auth-service client isn't defined in strict list, 
            // we might be using the admin client itself or need to handle this.
            // For now, logging warning and proceeding (might fail 401).
            console.warn('⚠️ Could not get auth-service token:', e.message);
        }

        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else if (SERVICE_SECRET) {
            // Fallback to legacy secret if token fails (Dual Mode support)
            headers['x-service-secret'] = SERVICE_SECRET;
        }

        const response = await fetch(`${EMAIL_SERVICE_URL}/api/v1/email/send`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ type, to, data }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Email Service Error:', result);
            return { success: false, error: result };
        }

        return { success: true, data: result };
    } catch (error) {
        console.error('❌ Failed to connect to Email Service:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Available email types
 * Keep in sync with email-service
 */
const EMAIL_TYPES = {
    CLIENT_REQUEST: 'CLIENT_REQUEST',
    CLIENT_APPROVED: 'CLIENT_APPROVED',
    CLIENT_REJECTED: 'CLIENT_REJECTED',
    ORGANIZATION_INVITATION: 'ORGANIZATION_INVITATION',
    WORKSPACE_INVITATION: 'WORKSPACE_INVITATION',
    ORGANIZATION_CREATED: 'ORGANIZATION_CREATED',
    NEW_DEVICE_LOGIN: 'NEW_DEVICE_LOGIN',
    HIGH_RISK_LOGIN: 'HIGH_RISK_LOGIN',
    SECURITY_ALERT: 'SECURITY_ALERT',
};

module.exports = {
    send,
    EMAIL_TYPES,
};
