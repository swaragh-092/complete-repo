'use strict';

const express = require('express');
const router = express.Router();
const SettingsService = require('../services/settings.service');
const { authMiddleware, requireSuperAdmin } = require('../../../middleware/authMiddleware');
const asyncHandler = require('../../../middleware/asyncHandler');
const ResponseHandler = require('../../../utils/responseHandler');
const { updateGlobalSettingsSchema } = require('../validators/settings.validator');

// ALL routes require Authentication AND Super Admin privileges
router.use(authMiddleware);
router.use(requireSuperAdmin);

/**
 * GET /api/organizations/settings/global
 * Fetch all active global settings
 */
router.get('/global', asyncHandler(async (req, res) => {
    const settings = await SettingsService.getAllGlobalSettings();
    return ResponseHandler.success(res, settings);
}));

/**
 * PUT /api/organizations/settings/global
 * Batch update or create global settings
 */
router.put('/global', asyncHandler(async (req, res) => {
    const { error, value } = updateGlobalSettingsSchema.validate(req.body);
    if (error) return ResponseHandler.error(res, error.details[0].message, 400);

    const results = [];
    for (const item of value.settings) {
        const updatedSetting = await SettingsService.upsertGlobalSetting({
            key: item.key,
            value: item.value,
            type: item.type,
            category: item.category,
            description: item.description,
            is_public: item.is_public,
            userId: req.user.id
        });
        results.push(updatedSetting);
    }

    return ResponseHandler.success(res, results, 'Global settings updated successfully');
}));

module.exports = router;
