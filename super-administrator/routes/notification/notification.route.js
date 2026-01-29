// Author: Gururaj
// Created: 8th July 2025
// Description: Routes for Notification related settings APIs.
// Version: 1.0.0

const express = require("express");
const router = express.Router();
const Controller = require("../../controllers/notification/notification.controller");
const { uuid, boolean, integer, requiredEnum } = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");
const { USAGE_NOTIFICATION_CATEGORY_ENUM_VALUES } = require("../../util/constant");

router.post("/", 
    [
        requiredEnum("category", USAGE_NOTIFICATION_CATEGORY_ENUM_VALUES),
        integer("threshold_percent").optional(),
        boolean("enabled").optional()
    ], 
    validationMiddleware("Notificaiton Settings", "Update"), 
    Controller.updateSettings
);

router.get("/:id", 
    [
        uuid("id"),
    ], 
    validationMiddleware("Notificaiton Settings", "Get"), 
    Controller.get
);

router.get("/", 
    
    Controller.getAll
);




module.exports = router;
