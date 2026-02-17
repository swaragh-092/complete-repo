'use strict';

const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { emailQueue } = require('../queue/email.queue');
const provider = require('../services/provider');
const ResponseHandler = require('../utils/response');
const logger = require('../utils/logger');

/**
 * GET /health
 * Quick liveness probe — does the server respond?
 * Used by Docker HEALTHCHECK / Kubernetes livenessProbe
 */
router.get('/', (req, res) => {
    return ResponseHandler.success(res, {
        status: 'healthy',
        service: 'email-service',
        uptime: Math.floor(process.uptime()),
    }, 'Service is healthy');
});

/**
 * GET /health/ready
 * Deep readiness probe — checks all dependencies
 * Used by Kubernetes readinessProbe / load balancer
 */
router.get('/ready', async (req, res) => {
    const checks = {};
    let allHealthy = true;

    // 1. Database check
    try {
        await sequelize.authenticate();
        checks.database = 'up';
    } catch (err) {
        checks.database = 'down';
        allHealthy = false;
        logger.warn('Health check: Database down', { error: err.message });
    }

    // 2. Redis check (via BullMQ queue client)
    try {
        const client = await emailQueue.client;
        const pong = await client.ping();
        checks.redis = pong === 'PONG' ? 'up' : 'down';
    } catch (err) {
        checks.redis = 'down';
        allHealthy = false;
        logger.warn('Health check: Redis down', { error: err.message });
    }

    // 3. SMTP check (optional — don't fail readiness if SMTP unconfigured)
    try {
        if (provider.isConfigured()) {
            const smtpOk = await provider.verify();
            checks.smtp = smtpOk ? 'up' : 'degraded';
        } else {
            checks.smtp = 'not_configured';
        }
    } catch (err) {
        checks.smtp = 'degraded';
        logger.warn('Health check: SMTP degraded', { error: err.message });
    }

    const status = allHealthy ? 'ready' : 'degraded';
    const statusCode = allHealthy ? 200 : 503;

    return res.status(statusCode).json({
        success: allHealthy,
        message: `Service is ${status}`,
        data: {
            status,
            service: 'email-service',
            uptime: Math.floor(process.uptime()),
            checks,
        },
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
