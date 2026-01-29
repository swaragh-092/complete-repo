// Author: Gururaj
// Created: 8th July 2025
// Description: Routes for Subscription related APIs.
// Version: 1.0.0

const express = require("express");
const router = express.Router();
const SubscriptionController = require("../../controllers/subscription/subscription.controller");
const { uuid, boolean } = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");

router.post("/:organizationId/plan/:planId", [
    uuid("organizationId"), 
    uuid("planId"), 
    boolean("is_trial")
], 
    validationMiddleware("Subscription", "Create"), 
    SubscriptionController.subscribe
);


module.exports = router;
