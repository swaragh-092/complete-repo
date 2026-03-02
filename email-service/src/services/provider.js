'use strict';

const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * Email Provider with Failover
 * Supports primary + backup SMTP provider.
 * Auto-switches to backup if primary fails.
 */
class EmailProvider {
    constructor() {
        this._primary = null;
        this._backup = null;
        this.fromEmail = config.FROM_EMAIL;
        this.appName = config.APP_NAME;
    }

    /**
     * Check if primary SMTP is configured
     */
    isConfigured() {
        return !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
    }

    /**
     * Check if backup SMTP is configured
     */
    hasBackup() {
        return !!(config.SMTP_BACKUP_HOST && config.SMTP_BACKUP_USER && config.SMTP_BACKUP_PASS);
    }

    /**
     * Create a nodemailer transporter from config
     */
    _createTransporter(host, port, user, pass) {
        return nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
            pool: config.POOL,
            maxConnections: config.MAXCONNECTIONS,
            maxMessages: config.MAXMESSAGES,
            logger: !config.isProduction,
            debug: !config.isProduction,
        });
    }

    /**
     * Get primary transporter (lazy init)
     */
    _getPrimary() {
        if (this._primary) return this._primary;

        if (!this.isConfigured()) {
            throw AppError.serviceUnavailable(
                'SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.',
                'SMTP_NOT_CONFIGURED',
            );
        }

        this._primary = this._createTransporter(
            config.SMTP_HOST, config.SMTP_PORT,
            config.SMTP_USER, config.SMTP_PASS,
        );

        logger.info('📧 Primary SMTP initialized', { host: config.SMTP_HOST, port: config.SMTP_PORT });
        return this._primary;
    }

    /**
     * Get backup transporter (lazy init)
     */
    _getBackup() {
        if (this._backup) return this._backup;

        if (!this.hasBackup()) return null;

        this._backup = this._createTransporter(
            config.SMTP_BACKUP_HOST, config.SMTP_BACKUP_PORT,
            config.SMTP_BACKUP_USER, config.SMTP_BACKUP_PASS,
        );

        logger.info('📧 Backup SMTP initialized', { host: config.SMTP_BACKUP_HOST });
        return this._backup;
    }

    /**
     * Verify SMTP connection (primary)
     */
    async verify() {
        try {
            const transporter = this._getPrimary();
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
     * Send HTML email with automatic failover
     * Tries primary first, falls back to backup if primary fails.
     * Optionally accepts a custom provider config (used for per-org overrides).
     * 
     * @param {string} to 
     * @param {string} subject 
     * @param {string} html 
     * @param {object} [customConfig] { isEnabled, host, port, user, password }
     */
    async sendHtml(to, subject, html, customConfig = null) {
        const mailOptions = {
            from: `"${this.appName}" <${this.fromEmail}>`,
            to,
            subject,
            html,
        };

        // 1. Try Custom Config First (if enabled)
        if (customConfig && customConfig.isEnabled && customConfig.host) {
            try {
                const customTransporter = this._createTransporter(
                    customConfig.host,
                    parseInt(customConfig.port) || 587,
                    customConfig.user,
                    customConfig.password
                );
                const info = await customTransporter.sendMail(mailOptions);
                logger.info(`✅ Email sent via CUSTOM ORG SMTP to ${to}`, { messageId: info.messageId });
                return { ...info, provider: 'custom_org' };
            } catch (customError) {
                logger.error(`❌ Custom Org SMTP failed for ${to}`, { error: customError.message });
                // We do NOT fallback to system if custom failed, because they explicitly wanted to use theirs.
                // Or maybe we should? Usually it's better to fail so they know their credentials are bad.
                throw customError;
            }
        }

        // 2. Try default primary
        try {
            const primary = this._getPrimary();
            const info = await primary.sendMail(mailOptions);
            logger.info(`✅ Email sent via primary to ${to}`, { messageId: info.messageId });
            return { ...info, provider: 'primary' };
        } catch (primaryError) {
            logger.warn(`⚠️ Primary SMTP failed for ${to}`, { error: primaryError.message });

            // Try backup
            const backup = this._getBackup();
            if (!backup) {
                // No backup, re-throw original error
                throw primaryError;
            }

            try {
                const info = await backup.sendMail(mailOptions);
                logger.info(`✅ Email sent via backup to ${to}`, { messageId: info.messageId });
                return { ...info, provider: 'backup' };
            } catch (backupError) {
                logger.error(`❌ Backup SMTP also failed for ${to}`, { error: backupError.message });
                // Throw the backup error (more recent), attach primary error for context
                backupError.primaryError = primaryError.message;
                throw backupError;
            }
        }
    }
}

module.exports = new EmailProvider();
