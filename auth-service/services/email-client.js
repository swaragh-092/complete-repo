'use strict';

/**
 * Email Service Client
 * 
 * Use this module to send emails via the Email Service microservice.
 */

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:4011';
const SERVICE_SECRET = process.env.SERVICE_SECRET;

/**
 * Send an email via the Email Service
 * @param {object} options
 * @param {string} options.type - Email type (see EMAIL_TYPES)
 * @param {string} options.to - Recipient email address
 * @param {object} options.data - Template data
 * @returns {Promise<object>} - Response from email service
 */
async function send({ type, to, data }) {
    // If no secret, we might be in dev mode without email service running, or misconfigured.
    // But for now, let's assume strict requirement.
    if (!SERVICE_SECRET) {
        console.warn('⚠️  SERVICE_SECRET is missing. Email might fail.');
    }

    try {
        const response = await fetch(`${EMAIL_SERVICE_URL}/api/v1/email/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-service-secret': SERVICE_SECRET,
            },
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
