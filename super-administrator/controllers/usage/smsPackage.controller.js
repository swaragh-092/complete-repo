// Author: Gururaj
// Created: 8th July 2025
// Description: Controller to maintain sms package ( sms credentials to send from org ) for organization  
// Version: 1.0.0

const SmsService = require('../../services/usage/smsPackage.service');
const ResponseService = require('../../services/Response');
const { fieldPicker } = require("../../util/helper");

// create or update
exports.update = async (req, res) => {
  const thisAction = { usedFor: 'Organization sms package', action: 'update' };
  try {
    const allowedFields = [
        {field : 'organizationId', source : 'params', as : "organization_id"},
        'provider',
        'sms_key',
        'sms_sender_id',
        "price_per_email",
        "use_default_price"
    ];
    const data = fieldPicker(req, allowedFields);
    const result = await SmsService.updateOrCreate({ data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating location:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getById = async (req, res) => {
  const thisAction = { usedFor: 'Organization sms package', action: 'Get' };
  try {
    const result = await SmsService.getById({ organizationId: req.params.organizationId });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching location:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
