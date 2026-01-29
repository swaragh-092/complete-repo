// Author: Gururaj
// Created: 8th July 2025
// Description: Routes for domain for organization APIs.
// Version: 1.0.0


// currently not in use will be added once the domain is concerding for organization.



// routes/organization/dnsMapping.routes.js
const express = require('express');
const router = express.Router();
const dnsController = require('../../controllers/host/dnsMapping.controller');

const { uuid, string, domain, ipAddress, boolean } = require('../../services/validation');
const validateRequest = require('../../middleware/validation.middleware');

router.put('/:organizationId',
    [
        uuid('organizationId'),
        domain('sub_domain'),
        ipAddress(),
        boolean('verified').optional(),
        string('dns_provider'),
    ],
    validateRequest("DNS", "Update"),
    dnsController.update
);
router.get('/:organizationId',
    [
        uuid('organizationId'),
    ],
    validateRequest("DNS", "Get"),
    dnsController.getById
);

module.exports = router;
