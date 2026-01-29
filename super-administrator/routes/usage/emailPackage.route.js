// Author: Gururaj
// Created: 8th July 2025
// Description: Routes for E-mail packages related APIs of organization.
// Version: 1.0.0

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/usage/emailPackage.controller');
const validationMiddleware = require('../../middleware/validation.middleware');
const { uuid, string, price, boolean } = require('../../services/validation');

router.get('/:organizationId',
    [uuid("organizationId") ],
    validationMiddleware("Subscription", "Create"),
    controller.getById
);

router.post('/:organizationId', 
    [
        uuid("organizationId"),
        string("provider").optional(),
        string("smtp_user").optional(),
        string("smtp_host").optional(),
        price("price_per_email").optional(),
        boolean("use_default_price").optional()
    ],
    validationMiddleware("Subscription", "Create"),
    controller.update
);

module.exports = router;
