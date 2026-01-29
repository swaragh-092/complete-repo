// Author: Gururaj
// Created: 8th July 2025
// Description: Controller maintaining email package (dertails of to send credentials ) of organization.
// Version: 1.0.0

const EmailService = require('../../services/usage/emailPackage.service');
const ResponseService = require('../../services/Response');
const { fieldPicker } = require("../../util/helper");

// create or update
exports.update = async (req, res) => {
  const thisAction = { usedFor: 'Organization Email package', action: 'update' };
  try {
    const allowedFields = [
        {field : 'organizationId', source : 'params', as : "organization_id"},
        'provider',
        'smtp_user',
        'smtp_host',
        "price_per_email",
        "use_default_price"
    ];
    const data = fieldPicker(req, allowedFields);
    const result = await EmailService.updateOrCreate({ data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating Organization Email package:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getById = async (req, res) => {
  const thisAction = { usedFor: 'Organization Email package', action: 'Get' };
  try {
    const result = await EmailService.getById({ organizationId: req.params.organizationId });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching Organization Email package:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
