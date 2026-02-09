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

const healthRoutes = require('./routes/health.routes');
const emailRoutes = require('./routes/email.routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
app.use(
    rateLimit({
        windowMs: RATE_LIMITS.WINDOW_MS,
        max: RATE_LIMITS.MAX_REQUESTS,
        standardHeaders: true,
        legacyHeaders: false,
    })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use(requestLogger);

// Routes
app.use('/health', healthRoutes);
app.use('/api/v1/email', emailRoutes);

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

// Start server
const PORT = config.PORT;

app.listen(PORT, () => {
    logger.info(`🚀 Email Service running on port ${PORT}`);
    logger.info(`   Environment: ${config.NODE_ENV}`);
    logger.info(`   Health: http://localhost:${PORT}/health`);
    logger.info(`   API: http://localhost:${PORT}/api/v1/email`);
});

module.exports = app;
