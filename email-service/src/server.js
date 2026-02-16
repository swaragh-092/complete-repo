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
const { syncDatabase } = require('./models');
const { startWorker } = require('./queue/email.worker');

const healthRoutes = require('./routes/health.routes');
const emailRoutes = require('./routes/email.routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: RATE_LIMITS.WINDOW_MS,
    max: RATE_LIMITS.MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
});

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use(requestLogger);

// Routes
app.use('/health', healthRoutes);
app.use('/api/v1/email', apiLimiter, emailRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        error: { code: 'NOT_FOUND' },
    });
});

// Error handler
app.use(errorMiddleware);

// Start server with database sync and worker
const PORT = config.PORT;

async function start() {
    try {
        // 1. Sync database (create tables if needed)
        await syncDatabase();

        // 2. Start BullMQ worker
        startWorker();

        // 3. Start HTTP server
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`🚀 Email Service running on port ${PORT}`);
            logger.info(`   Environment: ${config.NODE_ENV}`);
            logger.info(`   Health: http://localhost:${PORT}/health`);
            logger.info(`   API: http://localhost:${PORT}/api/v1/email`);
            logger.info(`   Queue: BullMQ → Redis ${config.REDIS_HOST}:${config.REDIS_PORT}`);
            logger.info(`   Database: PostgreSQL ${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`);
        });
    } catch (error) {
        logger.error('❌ Failed to start Email Service:', { error: error.message });
        process.exit(1);
    }
}

start();

module.exports = app;
