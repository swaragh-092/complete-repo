'use strict';

const { Queue } = require('bullmq');
const config = require('../config');
const logger = require('../utils/logger');

const QUEUE_NAME = 'email-queue';

const connection = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
};

const emailQueue = new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
        attempts: config.QUEUE_MAX_ATTEMPTS,
        backoff: {
            type: 'exponential',
            delay: 5000, // 5s, 10s, 20s
        },
        removeOnComplete: {
            count: 1000,  // Keep last 1000 completed jobs
            age: 86400,   // Remove after 24 hours
        },
        removeOnFail: {
            count: 5000,  // Keep last 5000 failed jobs for debugging
        },
    },
});

/**
 * Add an email job to the queue
 * @param {string} logId - EmailLog record ID
 * @param {string} type - Email type
 * @param {string} to - Recipient email
 * @param {object} data - Template data
 * @param {number} [delay] - Delay in milliseconds before processing
 * @returns {Promise<object>} - BullMQ job
 */
async function addEmailJob(logId, type, to, data, delay) {
    const jobOpts = {
        jobId: logId, // Use log ID as job ID for easy tracking
    };

    if (delay && delay > 0) {
        jobOpts.delay = delay;
    }

    const job = await emailQueue.add('send-email', {
        logId,
        type,
        to,
        data,
    }, jobOpts);

    const delayInfo = delay ? ` (delayed ${Math.round(delay / 60000)}min)` : '';
    logger.info(`📥 Email job queued [${type}] to [${to}]${delayInfo}`, { jobId: job.id, logId });
    return job;
}

module.exports = {
    emailQueue,
    addEmailJob,
    QUEUE_NAME,
    connection,
};
