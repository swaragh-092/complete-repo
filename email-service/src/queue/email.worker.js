'use strict';

const { Worker } = require('bullmq');
const provider = require('../services/provider');
const templates = require('../templates');
const { EmailLog } = require('../models');
const logger = require('../utils/logger');
const { QUEUE_NAME, connection } = require('./email.queue');
const { escapeData } = require('../utils/html-escaper');
const authClient = require('../services/auth-service.client');

/**
 * Email Worker
 * Processes queued email jobs: renders template, sends via SMTP, updates log
 */
function startWorker() {
    const worker = new Worker(QUEUE_NAME, async (job) => {
        const { logId, type, to, data } = job.data;

        logger.info(`📧 Processing email job [${type}] to [${to}]`, {
            jobId: job.id,
            attempt: job.attemptsMade + 1,
        });

        // 1. Update log status to 'sending'
        const emailLog = await EmailLog.findByPk(logId);
        if (!emailLog) {
            throw new Error(`EmailLog not found: ${logId}`);
        }

        await emailLog.update({
            status: 'sending',
            attempts: job.attemptsMade + 1,
        });

        // 2. Render template
        const template = templates[type];
        if (!template) {
            throw new Error(`Template not found for type: ${type}`);
        }

        const safeData = escapeData(data);

        // --- DYNAMIC ORG SETTINGS FETCH ---
        let customConfig = null;
        let customTemplate = null;

        if (emailLog.org_id) {
            try {
                const orgSettings = await authClient.getOrganizationSettings(emailLog.org_id);
                // Extract SMTP overrides
                if (orgSettings.email_provider_config && orgSettings.email_provider_config.isEnabled) {
                    customConfig = orgSettings.email_provider_config;
                }
                // Extract Template overrides
                if (orgSettings.email_templates && orgSettings.email_templates[type]) {
                    customTemplate = orgSettings.email_templates[type];
                }
            } catch (err) {
                logger.warn(`Failed to fetch org settings for ${emailLog.org_id}, falling back to defaults`, { error: err.message });
            }
        }

        // --- SUBJECT & HTML RESOLUTION ---
        let subject = '';
        let html = '';

        if (customTemplate && customTemplate.subject && customTemplate.htmlContent) {
            // Very simple replacement engine for custom templates (could use Handlebars for advanced logic)
            subject = customTemplate.subject;
            html = customTemplate.htmlContent;

            // Loop through saferData keys to replace {{key}} with values
            Object.keys(safeData).forEach(key => {
                const regex = new RegExp(`{{s*${key}s*}}`, 'gi');
                subject = subject.replace(regex, safeData[key]);
                html = html.replace(regex, safeData[key]);
            });
        } else {
            // Fall back to system default definition
            subject = typeof template.subject === 'function' ? template.subject(safeData) : template.subject;
            html = template.render(safeData);
        }

        // 3. Update subject in log
        await emailLog.update({ subject });

        // 4. Send via SMTP (pass custom config if available)
        const result = await provider.sendHtml(to, subject, html, customConfig);

        // 5. Mark as sent
        await emailLog.update({
            status: 'sent',
            message_id: result.messageId,
            sent_at: new Date(),
            error: null,
        });

        logger.info(`✅ Email sent [${type}] to [${to}]`, {
            messageId: result.messageId,
            logId,
        });

        return { messageId: result.messageId };

    }, {
        connection,
        concurrency: 3,
        limiter: {
            max: 10,
            duration: 1000, // Max 10 emails per second
        },
    });

    // Handle job completion
    worker.on('completed', (job, result) => {
        logger.info(`✅ Job completed: ${job.id}`, result);
    });

    // Handle job failure (individual attempt)
    worker.on('failed', async (job, error) => {
        logger.warn(`⚠️ Job attempt failed: ${job.id}`, {
            attempt: job.attemptsMade,
            maxAttempts: job.opts.attempts,
            error: error.message,
        });

        try {
            const { logId } = job.data;
            const emailLog = await EmailLog.findByPk(logId);
            if (emailLog) {
                const isFinalAttempt = job.attemptsMade >= job.opts.attempts;
                await emailLog.update({
                    status: isFinalAttempt ? 'failed' : 'queued',
                    attempts: job.attemptsMade,
                    error: error.message,
                    ...(isFinalAttempt && { failed_at: new Date() }),
                });

                if (isFinalAttempt) {
                    logger.error(`❌ Email permanently failed [${job.data.type}] to [${job.data.to}]`, {
                        logId,
                        attempts: job.attemptsMade,
                        error: error.message,
                    });
                }
            }
        } catch (dbError) {
            logger.error('Failed to update email log on failure:', { error: dbError.message });
        }
    });

    worker.on('error', (error) => {
        logger.error('Worker error:', { error: error.message });
    });

    logger.info('🔧 Email worker started', { concurrency: 3 });
    return worker;
}

module.exports = { startWorker };
