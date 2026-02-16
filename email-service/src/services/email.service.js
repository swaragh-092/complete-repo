'use strict';

const { EMAIL_TYPES } = require('../config/constants');
const { EmailLog } = require('../models');
const { addEmailJob } = require('../queue/email.queue');
const templates = require('../templates');
const logger = require('../utils/logger');
const { validEmail } = require('../utils/validation-schemas');
const { Op } = require('sequelize');

/**
 * Email Service
 * Core business logic — now queue-based with logging
 */
class EmailService {
    /**
     * Queue an email for sending
     * Creates a log record and adds a job to the queue
     * @returns {Promise<object>} - { logId, status: 'queued' }
     */
    async send({ type, to, data }) {
        // Validate type
        if (!EMAIL_TYPES[type]) {
            throw Object.assign(new Error(`Invalid email type: ${type}`), {
                statusCode: 400,
                code: 'INVALID_EMAIL_TYPE',
            });
        }

        // Validate template exists
        const template = templates[type];
        if (!template) {
            throw Object.assign(new Error(`Template not found for type: ${type}`), {
                statusCode: 500,
                code: 'TEMPLATE_NOT_FOUND',
            });
        }

        // Validate recipient
        const { error } = validEmail.validate(to);
        if (!to || error) {
            throw Object.assign(new Error('Invalid recipient email address'), {
                statusCode: 400,
                code: 'INVALID_RECIPIENT',
            });
        }

        // 1. Create email log record
        const emailLog = await EmailLog.create({
            type,
            to,
            status: 'queued',
            metadata: data,
        });

        // 2. Add job to queue
        await addEmailJob(emailLog.id, type, to, data);

        logger.info(`📥 Email queued [${type}] to [${to}]`, { logId: emailLog.id });

        return {
            logId: emailLog.id,
            status: 'queued',
            type,
            to,
        };
    }

    /**
     * Resend a failed email
     * @param {string} logId - EmailLog record ID
     */
    async resend(logId) {
        const emailLog = await EmailLog.findByPk(logId);

        if (!emailLog) {
            throw Object.assign(new Error('Email log not found'), {
                statusCode: 404,
                code: 'NOT_FOUND',
            });
        }

        if (emailLog.status !== 'failed') {
            throw Object.assign(new Error(`Cannot resend email with status: ${emailLog.status}`), {
                statusCode: 400,
                code: 'INVALID_STATUS',
            });
        }

        // Reset status and re-queue
        await emailLog.update({
            status: 'queued',
            attempts: 0,
            error: null,
            failed_at: null,
        });

        await addEmailJob(emailLog.id, emailLog.type, emailLog.to, emailLog.metadata);

        logger.info(`🔄 Email resend queued [${emailLog.type}] to [${emailLog.to}]`, { logId });

        return {
            logId: emailLog.id,
            status: 'queued',
            type: emailLog.type,
            to: emailLog.to,
        };
    }

    /**
     * Get email history with pagination and filters
     */
    async getHistory({ page = 1, limit = 20, status, type, to } = {}) {
        const where = {};
        if (status) where.status = status;
        if (type) where.type = type;
        if (to) where.to = { [Op.iLike]: `%${to}%` };

        const offset = (page - 1) * limit;

        const { count, rows } = await EmailLog.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });

        return {
            emails: rows,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit),
            },
        };
    }

    /**
     * Get email stats
     */
    async getStats() {
        const [results] = await EmailLog.sequelize.query(`
            SELECT
                status,
                COUNT(*)::int AS count
            FROM email_logs
            GROUP BY status
        `);

        const stats = {
            queued: 0,
            sending: 0,
            sent: 0,
            failed: 0,
            total: 0,
        };

        results.forEach((row) => {
            stats[row.status] = row.count;
            stats.total += row.count;
        });

        return stats;
    }

    /**
     * Get available email types
     */
    getTypes() {
        return Object.keys(EMAIL_TYPES);
    }
}

module.exports = new EmailService();
