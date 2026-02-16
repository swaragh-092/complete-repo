'use strict';

const { Worker } = require('bullmq');
const provider = require('../services/provider');
const templates = require('../templates');
const { EMAIL_TYPES } = require('../config/constants');
const { EmailLog } = require('../models');
const logger = require('../utils/logger');
const { QUEUE_NAME, connection } = require('./email.queue');

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

        const { escapeData } = require('../utils/html-escaper');
        const safeData = escapeData(data);

        const subject = typeof template.subject === 'function'
            ? template.subject(safeData)
            : template.subject;

        const html = template.render(safeData);

        // 3. Update subject in log
        await emailLog.update({ subject });

        // 4. Send via SMTP
        const result = await provider.sendHtml(to, subject, html);

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
