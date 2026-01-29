// Author: Gururaj
// Created: 8th July 2025
// Description: Routes for Database APIs.
// Version: 1.0.0

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/host/database.controller');
const validationMiddleware = require('../../middleware/validation.middleware');
const { uuid, dbName, } = require('../../services/validation');

router.get('/:organizationId/module/:moduleVersionId',
  [uuid('organizationId'), uuid('moduleVersionId')],
  validationMiddleware('Get', 'Database'),
  controller.get
);
router.get('/:organizationId',
  [uuid('organizationId')],
  validationMiddleware('Get', 'Database'),
  controller.get
);

router.post('/:organizationId/module/:moduleVersionId',
  [
    uuid('organizationId'),
    uuid('moduleVersionId'),
    dbName("key_name"),
  ],
  validationMiddleware('CreateOrUpdate', 'Database'),
  controller.createOrUpdate
);

module.exports = router;
