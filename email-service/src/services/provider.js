'use strict';

const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * Email Provider - Nodemailer Transporter
 * Handles SMTP connection and email sending
 * Validates SMTP config at send-time (not startup)
 */
class EmailProvider {
    constructor() {
        this._transporter = null;
        this.fromEmail = config.FROM_EMAIL;
        this.appName = config.APP_NAME;
    }

    /**
     * Check if SMTP is configured (host + auth present)
     */
    isConfigured() {
        return !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
    }

    /**
     * Lazy-initialize transporter on first use
     * @returns {import('nodemailer').Transporter}
     */
    _getTransporter() {
        if (this._transporter) return this._transporter;

        if (!this.isConfigured()) {
            throw AppError.serviceUnavailable(
                'SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.',
                'SMTP_NOT_CONFIGURED',
            );
        }

        this._transporter = nodemailer.createTransport({
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            secure: config.SMTP_PORT === 465,
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS,
            },
            pool: config.POOL,
            maxConnections: config.MAXCONNECTIONS,
            maxMessages: config.MAXMESSAGES,
            logger: !config.isProduction,
            debug: !config.isProduction,
        });

        logger.info('📧 SMTP transporter initialized', {
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
        });

        return this._transporter;
    }

    /**
     * Verify SMTP connection
     */
    async verify() {
        try {
            const transporter = this._getTransporter();
            await transporter.verify();
            logger.info('✅ SMTP connection verified');
            return true;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('❌ SMTP connection failed', { error: error.message });
            return false;
        }
    }

    /**
     * Send HTML email
     * @param {string} to - Recipient email
     * @param {string} subject - Email subject
     * @param {string} html - HTML content
     * @returns {Promise<object>} - Nodemailer response
     */
    async sendHtml(to, subject, html) {
        const transporter = this._getTransporter();

        const mailOptions = {
            from: `"${this.appName}" <${this.fromEmail}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`✅ Email sent to ${to}`, { messageId: info.messageId });
        return info;
    }
}

module.exports = new EmailProvider();
