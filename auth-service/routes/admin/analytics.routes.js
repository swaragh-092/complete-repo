const express = require('express');
const router = express.Router({ mergeParams: true });
const KeycloakService = require('../../services/keycloak.service');
const withKeycloak = require('../../middleware/keycloak.middleware');
const { authMiddleware } = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');
const asyncHandler = require('../../middleware/asyncHandler');
const { AppError } = require('../../middleware/errorHandler');
const ResponseHandler = require('../../utils/responseHandler');

// Apply middleware
router.use(authMiddleware);

// Get session statistics (active/offline sessions)
router.get('/session-stats', withKeycloak, asyncHandler(async (req, res) => {
    try {
        const stats = await req.kc.getSessionStats();
        return ResponseHandler.success(res, stats, 'Session statistics retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error fetching session stats: ${error.message}`);
        throw new AppError('Failed to fetch session stats', 500, 'FETCH_FAILED', { originalError: error.message });
    }
}));

// Get login statistics (success/fail counts over time)
router.get('/login-stats', withKeycloak, asyncHandler(async (req, res) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            throw new AppError('Missing required query parameters: from, to', 400, 'VALIDATION_ERROR');
        }

        const stats = await req.kc.getLoginStats(from, to);
        return ResponseHandler.success(res, stats, 'Login statistics retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error fetching login stats: ${error.message}`);
        throw new AppError('Failed to fetch login stats', 500, 'FETCH_FAILED', { originalError: error.message });
    }
}));

module.exports = router;
