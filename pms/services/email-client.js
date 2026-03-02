'use strict';

/**
 * Email Service Client (PMS)
 *
 * Sends emails via the Email Service microservice using Keycloak
 * Client Credentials for secure service-to-service authentication.
 *
 * Uses the centralized emailClient from serviceClients.js.
 */

const { emailClient } = require('./serviceClients');

/**
 * Send an email via the Email Service.
 *
 * @param {Object} options
 * @param {string} options.type - Email type (see EMAIL_TYPES)
 * @param {string} options.to   - Recipient email address
 * @param {Object} options.data - Template data
 * @returns {Promise<Object>} Response from email service
 * @throws {Error} If authentication or email sending fails
 */
async function send({ type, to, data }) {
    const client = emailClient();
    const result = await client.post('/api/v1/email/send', { type, to, data });

    if (!result.data?.success && result.status >= 400) {
        const error = new Error(result.data?.message || 'Failed to send email');
        error.statusCode = result.status;
        error.code = result.data?.error?.code || 'EMAIL_ERROR';
        throw error;
    }

    return result.data;
}

/**
 * Available email types — keep in sync with email-service.
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
