// Author: Gururaj
// Created: 8th July 2025
// Description: Routes for codeBase APIs of organization .
// Version: 1.0.0


// Note : Currently not in use but logics works, if there is requirement will then will import

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/host/codebase.controller');
const  valicationMiddleware  = require('../../middleware/validation.middleware');
const { uuid, folderPath, boolean } = require('../../services/validation');

router.get('/:organizationId/module/:moduleId',
    [
        uuid("organizationId"), uuid("moduleId"),
    ],
    valicationMiddleware("Get", "Codebase"),
    controller.get);


router.get('/:organizationId',
    [ uuid("organizationId"), ],
    valicationMiddleware("Get", "Codebase"),
    controller.getAll);


router.post('/:organizationId/module/:moduleId', 
    [
        uuid("organizationId"),
        uuid("moduleId"),
        folderPath("deploy_target").optional() , // required true for creation, optional for update 
        boolean("is_active"), // optional
    ],
    valicationMiddleware("Get", "Codebase"),
    controller.createOrUpdate);

module.exports = router;