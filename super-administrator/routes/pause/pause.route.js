// Author: Gururaj
// Created: 4th July 2025
// Description: Routes for Organization APIs.
// Version: 1.0.0

const express = require("express");
const router = express.Router();
const pauseController = require("../../controllers/pause/pause.controller");

// Validation middleware if needed
const {
  uuid,
  description,
  futureDate,
  endDateAfterStartDate
} = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");

// /api/organizations
router.post(
  "/subscription/:subscriptionId",
  [
    uuid('subscriptionId'),
    description("reason"),
    futureDate("start_date"),
    endDateAfterStartDate(),
  ],
  validationMiddleware("Subscription", "pause"),
  pauseController.pauseSubscription
);

router.delete(
  "/:pauseId/subscription/:subscriptionId",
  [
    uuid('pauseId'),
    uuid('subscriptionId'),
  ],
  validationMiddleware("Subscription", "pause"),
  pauseController.cancelPause
);

router.delete(
  "/subscription/:subscriptionId",
  [
    uuid('subscriptionId'),
  ],
  validationMiddleware("Subscription", "pause"),
  pauseController.stopPause
);



module.exports = router;
