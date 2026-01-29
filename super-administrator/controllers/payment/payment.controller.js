// Author : Gururaj
// Created: 30th July 2025
// Description: Controller for payment making
// Version: 1.0.0
// Modified: 

const PaymentService = require("../../services/payment/payment.service");
const ResponseService = require("../../services/Response");
const { fieldPicker } = require("../../util/helper");

// make payment to generated invoice for subscription.
exports.makePayment = async (req, res) => {
  const thisAction = { usedFor: 'Payment', action: 'make' };
  try {
    const allowedFields = [{field : "invoiceId", source : "params", as : "invoice_id"}];
    const data = fieldPicker(req, allowedFields);
    const result = await PaymentService.makePayment({ req, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Payment failed:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
