// Author: Gururaj
// Created: 8th July 2025
// Description: Routes for resource usage settings related  APIs of organization.
// Version: 1.0.0

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/usage/usageLimit.controller');
const validationMiddleware = require('../../middleware/validation.middleware');
const { uuid, integer } = require('../../services/validation');

router.get('/:organizationId',
    [uuid("organizationId") ],
    validationMiddleware("Usage", "Get"),
    controller.getById
);

router.post('/:organizationId/limit', 
    [
        uuid("organizationId"),
        integer("user_limit").optional(),
        integer("storage_limit_mb").optional(),
        integer("db_limit_mb").optional(),
        integer("sms_limit").optional(),
        integer("email_limit").optional(),
        integer("api_requests_limit").optional()
    ],
    validationMiddleware("Usage limit", "update"),
    controller.updateLimits
);

router.post('/:organizationId/usage', 
    [
        uuid("organizationId"),
        integer("user_count").optional(),
        integer("storage_usage_mb").optional(),
        integer("db_usage_mb").optional(),
        integer("sms_usage").optional(),
        integer("email_usage").optional(),
        integer("api_requests").optional()
    ],
    validationMiddleware("Usage usage", "update"),
    controller.updateUsage
);

module.exports = router;
