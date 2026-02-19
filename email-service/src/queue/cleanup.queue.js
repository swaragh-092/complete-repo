'use strict';

const { Queue, Worker } = require('bullmq');
const { Op } = require('sequelize');
const { EmailLog } = require('../models');
const config = require('../config');
const logger = require('../utils/logger');
const { connection } = require('./email.queue');

const CLEANUP_QUEUE_NAME = 'email-cleanup';

/**
 * Cleanup Queue
 * Repeatable job that deletes old email_logs entries
 */
const cleanupQueue = new Queue(CLEANUP_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
    },
});

/**
 * Start the cleanup worker
 * Processes cleanup jobs — deletes email_logs older than retention period
 */
function startCleanupWorker() {
    const worker = new Worker(CLEANUP_QUEUE_NAME, async (job) => {
        const retentionDays = job.data.retentionDays || config.LOG_RETENTION_DAYS;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        logger.info(`🧹 Cleanup: deleting email_logs older than ${retentionDays} days (before ${cutoffDate.toISOString()})`);

        // Delete in batches to avoid long-running transactions
        const BATCH_SIZE = 1000;
        let totalDeleted = 0;
        let batchDeleted;

        do {
            batchDeleted = await EmailLog.destroy({
                where: {
                    created_at: { [Op.lt]: cutoffDate },
                    status: { [Op.in]: ['sent', 'failed'] }, // Only clean completed emails
                },
                limit: BATCH_SIZE,
            });
            totalDeleted += batchDeleted;

            if (batchDeleted > 0) {
                logger.info(`🧹 Cleanup: deleted batch of ${batchDeleted} records (total: ${totalDeleted})`);
            }
        } while (batchDeleted === BATCH_SIZE);

        logger.info(`✅ Cleanup complete: ${totalDeleted} records deleted`);

        return { deleted: totalDeleted, cutoffDate: cutoffDate.toISOString(), retentionDays };
    }, {
        connection,
        concurrency: 1, // Only one cleanup at a time
    });

    worker.on('completed', (job, result) => {
        logger.info('✅ Cleanup job completed', result);
    });

    worker.on('failed', (job, error) => {
        logger.error('❌ Cleanup job failed', { error: error.message });
    });

    logger.info('🧹 Cleanup worker started');
    return worker;
}

/**
 * Schedule the repeatable cleanup job
 * Runs daily at 3:00 AM
 */
async function scheduleCleanupJob() {
    // Remove any existing repeatable jobs first (prevents duplicates on restart)
    const existing = await cleanupQueue.getRepeatableJobs();
    for (const job of existing) {
        await cleanupQueue.removeRepeatableByKey(job.key);
    }

    // Schedule: daily at 3:00 AM
    await cleanupQueue.add('cleanup-old-logs', {
        retentionDays: config.LOG_RETENTION_DAYS,
    }, {
        repeat: {
            pattern: '0 3 * * *', // Cron: 3:00 AM daily
        },
    });

    logger.info(`📅 Cleanup scheduled: daily at 3:00 AM (retain ${config.LOG_RETENTION_DAYS} days)`);
}

/**
 * Run cleanup immediately (for manual trigger via API)
 */
async function runCleanupNow(retentionDays) {
    const job = await cleanupQueue.add('manual-cleanup', {
        retentionDays: retentionDays || config.LOG_RETENTION_DAYS,
    });

    logger.info('🧹 Manual cleanup triggered', { jobId: job.id });
    return { jobId: job.id, status: 'queued' };
}

module.exports = {
    cleanupQueue,
    startCleanupWorker,
    scheduleCleanupJob,
    runCleanupNow,
};
