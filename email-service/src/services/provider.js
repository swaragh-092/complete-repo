'use strict';

const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Email Provider - Nodemailer Transporter
 * Handles SMTP connection and email sending
 */
class EmailProvider {
    constructor() {
        this.transporter = nodemailer.createTransport({
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

        this.fromEmail = config.FROM_EMAIL;
        this.appName = config.APP_NAME;
    }

    /**
     * Verify SMTP connection
     */
    async verify() {
        try {
            await this.transporter.verify();
            logger.info('✅ SMTP connection verified');
            return true;
        } catch (error) {
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
        const mailOptions = {
            from: `"${this.appName}" <${this.fromEmail}>`,
            to,
            subject,
            html,
        };

        const info = await this.transporter.sendMail(mailOptions);
        logger.info(`✅ Email sent to ${to}`, { messageId: info.messageId });
        return info;
    }
}

module.exports = new EmailProvider();
