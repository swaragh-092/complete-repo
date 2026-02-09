'use strict';

/**
 * Email Service Client
 * 
 * Use this module to send emails via the Email Service microservice.
 * 
 * Usage:
 *   const emailClient = require('./email-client');
 *   await emailClient.send({
 *     type: 'SECURITY_ALERT',
 *     to: 'user@example.com',
 *     data: { userName: 'Alice', alertTitle: 'Test', alertMessage: 'Hello!' }
 *   });
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
    if (!SERVICE_SECRET) {
        throw new Error('SERVICE_SECRET environment variable is not set');
    }

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
        const error = new Error(result.message || 'Failed to send email');
        error.statusCode = response.status;
        error.code = result.error?.code || 'EMAIL_ERROR';
        throw error;
    }

    return result;
}

/**
 * Available email types
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
