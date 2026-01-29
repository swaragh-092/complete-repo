// Author: Gururaj
// Created: 4th July 2025
// Description: Routes for Organization APIs.
// Version: 1.0.0

const express = require("express");
const router = express.Router();
const PaymentController = require("../../controllers/payment/payment.controller");

// Validation middleware if needed
const {
  uuid,
} = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");

// /api/organizations
router.post(
  "/:invoiceId",
  [
    uuid('invoiceId'),
  ],
  validationMiddleware("Payment", "make"),
  PaymentController.makePayment
);



module.exports = router;
