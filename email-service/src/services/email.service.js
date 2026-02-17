'use strict';

const { EMAIL_TYPES, TYPE_SCOPE_MAP, SCOPES } = require('../config/constants');
const { EmailLog } = require('../models');
const { addEmailJob } = require('../queue/email.queue');
const templates = require('../templates');
const logger = require('../utils/logger');
const { validEmail } = require('../utils/validation-schemas');
const { Op, fn, col, literal } = require('sequelize');

const MAX_HISTORY_LIMIT = 100;

/**
 * Email Service
 * Core business logic — queue-based with multi-tenant tracking
 */
class EmailService {
    /**
     * Queue an email for sending
     * Creates a log record and adds a job to the queue
     * @param {object} params
     * @param {string} params.type       - EMAIL_TYPES value
     * @param {string} params.to         - Recipient email
     * @param {object} params.data       - Template data
     * @param {string} [params.scope]    - system | organization | user (auto-detected if omitted)
     * @param {string} [params.org_id]   - Organization ID (required for org scope)
     * @param {string} [params.user_id]  - User ID (required for user scope)
     * @param {string} [params.client_key]   - Client key (admin-ui, account-ui)
     * @param {string} [params.service_name] - Calling service name
     * @returns {Promise<object>} - { logId, status, scope }
     */
    async send({ type, to, data, scope, org_id, user_id, client_key, service_name }) {
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

        // Auto-detect scope if not provided
        const resolvedScope = scope || TYPE_SCOPE_MAP[type] || SCOPES.SYSTEM;

        // 1. Create email log record with tracking
        const emailLog = await EmailLog.create({
            type,
            to,
            status: 'queued',
            metadata: data,
            scope: resolvedScope,
            org_id: org_id || null,
            user_id: user_id || null,
            client_key: client_key || null,
            service_name: service_name || null,
        });

        // 2. Add job to queue
        await addEmailJob(emailLog.id, type, to, data);

        logger.info(`📥 Email queued [${type}] to [${to}]`, {
            logId: emailLog.id,
            scope: resolvedScope,
            org_id: org_id || null,
            client_key: client_key || null,
        });

        return {
            logId: emailLog.id,
            status: 'queued',
            type,
            to,
            scope: resolvedScope,
        };
    }

    /**
     * Resend a failed email
     * Preserves original tracking fields (org_id, scope, etc.)
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

        // Reset status and re-queue (tracking fields preserved)
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
            scope: emailLog.scope,
        };
    }

    /**
     * Get email history with pagination and multi-tenant filters
     * @param {object} params
     * @param {number} [params.page=1]
     * @param {number} [params.limit=20]    - Capped at MAX_HISTORY_LIMIT
     * @param {string} [params.status]
     * @param {string} [params.type]
     * @param {string} [params.to]
     * @param {string} [params.scope]       - Filter by scope
     * @param {string} [params.org_id]      - Filter by organization
     * @param {string} [params.user_id]     - Filter by user
     * @param {string} [params.client_key]  - Filter by client
     * @param {string} [params.service_name] - Filter by service
     */
    async getHistory({
        page = 1,
        limit = 20,
        status,
        type,
        to,
        scope,
        org_id,
        user_id,
        client_key,
        service_name,
    } = {}) {
        const where = {};

        // Existing filters
        if (status) where.status = status;
        if (type) where.type = type;
        if (to) where.to = { [Op.iLike]: `%${to}%` };

        // Multi-tenant filters
        if (scope) where.scope = scope;
        if (org_id) where.org_id = org_id;
        if (user_id) where.user_id = user_id;
        if (client_key) where.client_key = client_key;
        if (service_name) where.service_name = service_name;

        // Cap limit to prevent OOM
        const safePage = Math.max(1, parseInt(page, 10) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), MAX_HISTORY_LIMIT);
        const offset = (safePage - 1) * safeLimit;

        const { count, rows } = await EmailLog.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: safeLimit,
            offset,
            attributes: {
                exclude: ['metadata'], // Don't return template data by default
            },
        });

        return {
            emails: rows,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total: count,
                totalPages: Math.ceil(count / safeLimit),
            },
        };
    }

    /**
     * Get email stats with optional multi-tenant filters
     * @param {object} [params]
     * @param {string} [params.org_id]      - Stats for a specific org
     * @param {string} [params.scope]       - Stats for a specific scope
     * @param {string} [params.client_key]  - Stats for a specific client
     * @param {string} [params.service_name] - Stats for a specific service
     */
    async getStats({ org_id, scope, client_key, service_name } = {}) {
        const where = {};
        if (org_id) where.org_id = org_id;
        if (scope) where.scope = scope;
        if (client_key) where.client_key = client_key;
        if (service_name) where.service_name = service_name;

        const results = await EmailLog.findAll({
            where,
            attributes: [
                'status',
                [fn('COUNT', col('id')), 'count'],
            ],
            group: ['status'],
            raw: true,
        });

        const stats = {
            queued: 0,
            sending: 0,
            sent: 0,
            failed: 0,
            total: 0,
        };

        results.forEach((row) => {
            stats[row.status] = parseInt(row.count, 10);
            stats.total += parseInt(row.count, 10);
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
