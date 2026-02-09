'use strict';

const express = require('express');
const router = express.Router();
const ResponseHandler = require('../utils/response');

/**
 * GET /health
 * Health check endpoint for Docker/Kubernetes
 */
router.get('/', (req, res) => {
    return ResponseHandler.success(res, {
        status: 'healthy',
        service: 'email-service',
        uptime: process.uptime(),
    }, 'Service is healthy');
});

module.exports = router;
