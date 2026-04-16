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

// Get all protocol mappers for a client
router.get('/', withKeycloak, asyncHandler(async (req, res) => {
    try {
        const mappers = await req.kc.getProtocolMappers(req.params.clientId);
        return ResponseHandler.success(res, mappers, 'Protocol mappers retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error fetching protocol mappers for client ${req.params.clientId}: ${error.message}`);
        throw new AppError('Failed to fetch protocol mappers', 500, 'FETCH_FAILED', { originalError: error.message });
    }
}));

// Add protocol mapper to client
router.post('/', withKeycloak, asyncHandler(async (req, res) => {
    try {
        const mapper = await req.kc.addProtocolMapper(req.params.clientId, req.body);
        return ResponseHandler.created(res, mapper, 'Protocol mapper created successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error adding protocol mapper to client ${req.params.clientId}: ${error.message}`);
        throw new AppError('Failed to add protocol mapper', 500, 'CREATION_FAILED', { originalError: error.message });
    }
}));

// Update protocol mapper
router.put('/:mapperId', withKeycloak, asyncHandler(async (req, res) => {
    try {
        const mapper = await req.kc.updateProtocolMapper(
            req.params.clientId,
            req.params.mapperId,
            req.body
        );
        return ResponseHandler.success(res, mapper, 'Protocol mapper updated successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error updating protocol mapper ${req.params.mapperId}: ${error.message}`);
        throw new AppError('Failed to update protocol mapper', 500, 'UPDATE_FAILED', { originalError: error.message });
    }
}));

// Delete protocol mapper
router.delete('/:mapperId', withKeycloak, asyncHandler(async (req, res) => {
    try {
        await req.kc.deleteProtocolMapper(req.params.clientId, req.params.mapperId);
        return ResponseHandler.noContent(res, 'Protocol mapper deleted successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error deleting protocol mapper ${req.params.mapperId}: ${error.message}`);
        throw new AppError('Failed to delete protocol mapper', 500, 'DELETION_FAILED', { originalError: error.message });
    }
}));

module.exports = router;
