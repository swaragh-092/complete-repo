const express = require('express');
const router = express.Router({ mergeParams: true });
const withKeycloak = require('../../middleware/keycloak.middleware');
const { authMiddleware } = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');
const asyncHandler = require('../../middleware/asyncHandler');
const { AppError } = require('../../middleware/errorHandler');
const ResponseHandler = require('../../utils/responseHandler');

// Apply middleware
router.use(authMiddleware);

// Get all identity providers
router.get('/', withKeycloak, asyncHandler(async (req, res) => {
    try {
        const idps = await req.kc.getIdentityProviders();
        return ResponseHandler.success(res, idps, 'Identity providers retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error fetching identity providers: ${error.message}`);
        throw new AppError('Failed to fetch identity providers', 500, 'FETCH_FAILED', { originalError: error.message });
    }
}));

// Get specific identity provider
router.get('/:alias', withKeycloak, asyncHandler(async (req, res) => {
    try {
        const idp = await req.kc.getIdentityProvider(req.params.alias);
        return ResponseHandler.success(res, idp, 'Identity provider retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error fetching identity provider ${req.params.alias}: ${error.message}`);
        throw new AppError(`Identity provider '${req.params.alias}' not found`, 404, 'NOT_FOUND', { originalError: error.message });
    }
}));

// Create identity provider
router.post('/', withKeycloak, asyncHandler(async (req, res) => {
    try {
        const idp = await req.kc.createIdentityProvider(req.body);
        return ResponseHandler.created(res, idp, 'Identity provider created successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error creating identity provider: ${error.message}`);
        throw new AppError('Failed to create identity provider', 500, 'CREATION_FAILED', { originalError: error.message });
    }
}));

// Update identity provider
router.put('/:alias', withKeycloak, asyncHandler(async (req, res) => {
    try {
        const idp = await req.kc.updateIdentityProvider(req.params.alias, req.body);
        return ResponseHandler.success(res, idp, 'Identity provider updated successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error updating identity provider ${req.params.alias}: ${error.message}`);
        throw new AppError(`Failed to update identity provider '${req.params.alias}'`, 500, 'UPDATE_FAILED', { originalError: error.message });
    }
}));

// Delete identity provider
router.delete('/:alias', withKeycloak, asyncHandler(async (req, res) => {
    try {
        await req.kc.deleteIdentityProvider(req.params.alias);
        return ResponseHandler.noContent(res, 'Identity provider deleted successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error deleting identity provider ${req.params.alias}: ${error.message}`);
        throw new AppError(`Failed to delete identity provider '${req.params.alias}'`, 500, 'DELETION_FAILED', { originalError: error.message });
    }
}));

module.exports = router;
