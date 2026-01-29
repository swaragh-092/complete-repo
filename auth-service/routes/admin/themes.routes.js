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

// Get realm theme configuration
router.get('/', withKeycloak, asyncHandler(async (req, res) => {
    try {
        const realm = await req.kc.getRealm();

        const themeConfig = {
            loginTheme: realm.loginTheme,
            accountTheme: realm.accountTheme,
            adminTheme: realm.adminTheme,
            emailTheme: realm.emailTheme,
            internationalizationEnabled: realm.internationalizationEnabled,
            supportedLocales: realm.supportedLocales,
            defaultLocale: realm.defaultLocale
        };

        return ResponseHandler.success(res, themeConfig, 'Theme configuration retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error fetching theme config: ${error.message}`);
        throw new AppError('Failed to fetch theme config', 500, 'FETCH_FAILED', { originalError: error.message });
    }
}));

// Update realm theme configuration
router.put('/', withKeycloak, asyncHandler(async (req, res) => {
    try {
        const allowedUpdates = [
            'loginTheme', 'accountTheme', 'adminTheme', 'emailTheme',
            'internationalizationEnabled', 'supportedLocales', 'defaultLocale'
        ];

        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        if (Object.keys(updates).length === 0) {
            throw new AppError('No valid theme configuration fields provided', 400, 'VALIDATION_ERROR');
        }

        const updatedRealm = await req.kc.updateRealm(updates);

        const themeConfig = {};
        allowedUpdates.forEach(key => {
            if (updatedRealm[key] !== undefined) {
                themeConfig[key] = updatedRealm[key];
            }
        });

        return ResponseHandler.success(res, themeConfig, 'Theme configuration updated successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error updating theme config: ${error.message}`);
        throw new AppError('Failed to update theme config', 500, 'UPDATE_FAILED', { originalError: error.message });
    }
}));

module.exports = router;
