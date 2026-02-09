'use strict';

const provider = require('./provider');
const templates = require('../templates');
const { EMAIL_TYPES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Email Service
 * Core business logic for sending emails
 */
class EmailService {
    /**
     * Send an email
     * @param {object} payload
     * @param {string} payload.type - Email type (from EMAIL_TYPES)
     * @param {string} payload.to - Recipient email
     * @param {object} payload.data - Template data
     * @returns {Promise<object>}
     */
    async send({ type, to, data }) {
        // Validate type
        if (!EMAIL_TYPES[type]) {
            throw Object.assign(new Error(`Invalid email type: ${type}`), {
                statusCode: 400,
                code: 'INVALID_EMAIL_TYPE',
            });
        }

        // Get template
        const template = templates[type];
        if (!template) {
            throw Object.assign(new Error(`Template not found for type: ${type}`), {
                statusCode: 500,
                code: 'TEMPLATE_NOT_FOUND',
            });
        }

        // Validate recipient
        if (!to || !this.isValidEmail(to)) {
            throw Object.assign(new Error('Invalid recipient email address'), {
                statusCode: 400,
                code: 'INVALID_RECIPIENT',
            });
        }

        // Render template
        const { subject, html } = this.renderTemplate(template, data);

        // Send email
        logger.info(`📧 Sending email [${type}] to [${to}]`);
        const result = await provider.sendHtml(to, subject, html);

        return {
            messageId: result.messageId,
            type,
            to,
        };
    }

    /**
     * Render email template
     */
    renderTemplate(template, data) {
        const subject = typeof template.subject === 'function'
            ? template.subject(data)
            : template.subject;

        const html = template.render(data);

        return { subject, html };
    }

    /**
     * Simple email validation
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /**
     * Get available email types
     */
    getTypes() {
        return Object.keys(EMAIL_TYPES);
    }
}

module.exports = new EmailService();
