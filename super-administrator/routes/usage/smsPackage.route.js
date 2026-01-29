// Author: Gururaj
// Created: 8th July 2025
// Description: Routes for SMS package related APIs of organization.
// Version: 1.0.0

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/usage/smsPackage.controller');
const validationMiddleware = require('../../middleware/validation.middleware');
const { uuid, string, price, boolean } = require('../../services/validation');

router.get('/:organizationId',
    [ uuid("organizationId") ],
    validationMiddleware("Subscription", "Create"),
    controller.getById
);

router.post('/:organizationId', 
    [
        uuid("organizationId"),
        string("provider").optional(),
        string("sms_key").optional(),
        string("sms_sender_id").optional(),
        price("price_per_sms").optional(),
        boolean("use_default_price").optional()
    ],
    validationMiddleware("Subscription", "Create"),
    controller.update
);

module.exports = router;
