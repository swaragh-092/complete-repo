'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const { RATE_LIMITS } = require('./config/constants');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/request-logger');
const errorMiddleware = require('./middleware/error.middleware');
const { syncDatabase, sequelize } = require('./models');
const { startWorker } = require('./queue/email.worker');

const healthRoutes = require('./routes/health.routes');
const emailRoutes = require('./routes/email.routes');

const app = express();

// ── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());

// Internal service — no browser calls expected
app.use(cors({ origin: false }));

// ── Rate Limiting ──────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: RATE_LIMITS.WINDOW_MS,
    max: RATE_LIMITS.MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Request Logging ────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/health', healthRoutes);
app.use('/admin/queues', require('./routes/dashboard.routes'));
app.use('/api/v1/email', apiLimiter, emailRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        error: { code: 'NOT_FOUND' },
    });
});

// ── Error Handler ──────────────────────────────────────────────────────────
app.use(errorMiddleware);

// ── Lifecycle ──────────────────────────────────────────────────────────────
const PORT = config.PORT;
let server;
let worker;

async function start() {
    try {
        // 1. Sync database (create tables if needed)
        await syncDatabase();

        // 2. Start BullMQ worker
        worker = startWorker();

        // 3. Start HTTP server
        server = app.listen(PORT, '0.0.0.0', () => {
            logger.info(`🚀 Email Service running on port ${PORT}`);
            logger.info(`   Environment: ${config.NODE_ENV}`);
            logger.info(`   Health: http://localhost:${PORT}/health`);
            logger.info(`   API: http://localhost:${PORT}/api/v1/email`);
            logger.info(`   Dashboard: http://localhost:${PORT}/admin/queues`);
            logger.info(`   Queue: BullMQ → Redis ${config.REDIS_HOST}:${config.REDIS_PORT}`);
            logger.info(`   Database: PostgreSQL ${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`);
        });
    } catch (error) {
        logger.error('❌ Failed to start Email Service:', { error: error.message });
        process.exit(1);
    }
}

/**
 * Graceful Shutdown
 * Ensures in-flight jobs complete, connections close cleanly
 */
async function shutdown(signal) {
    logger.info(`⏳ ${signal} received — starting graceful shutdown...`);

    // 1. Stop accepting new HTTP requests
    if (server) {
        server.close(() => {
            logger.info('   ✅ HTTP server closed');
        });
    }

    // 2. Wait for BullMQ worker to finish active jobs
    if (worker) {
        try {
            await worker.close();
            logger.info('   ✅ BullMQ worker closed');
        } catch (err) {
            logger.error('   ❌ Error closing worker:', { error: err.message });
        }
    }

    // 3. Close database connection pool
    try {
        await sequelize.close();
        logger.info('   ✅ Database connection closed');
    } catch (err) {
        logger.error('   ❌ Error closing database:', { error: err.message });
    }

    logger.info('👋 Shutdown complete');
    process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();

module.exports = app;
