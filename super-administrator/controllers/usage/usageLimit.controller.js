// Author: Gururaj
// Created: 8th July 2025
// Description: Controller to maintain resource maintaince 
// Version: 1.0.0

const UsageService = require('../../services/usage/usage.service');
const ResponseService = require('../../services/Response');
const { fieldPicker } = require("../../util/helper");


exports.updateLimits = async (req, res) => {
  const thisAction = { usedFor: 'Usage Limits', action: 'update' };
  try {
    const allowedFields = [
        {field : 'organizationId', source : 'params', as : "organization_id"},
        'user_limit',
        'storage_limit_mb',
        'db_limit_mb',
        "sms_limit",
        "email_limit",
        "api_requests_limit"
    ];
    const data = fieldPicker(req, allowedFields);
    const result = await UsageService.updateLimit({ data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating location:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.updateUsage = async (req, res) => {
  const thisAction = { usedFor: 'Usage Limits', action: 'update' };
  try {
    const allowedFields = [
        {field : 'organizationId', source : 'params', as : "organization_id"},
        'user_count',
        'storage_usage_mb',
        'db_usage_mb',
        "sms_usage",
        "email_usage",
        "api_requests"
    ];
    const data = fieldPicker(req, allowedFields);
    const result = await UsageService.updateUsage({ data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating location:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getById = async (req, res) => {
  const thisAction = { usedFor: 'Usage Limits', action: 'Get' };
  try {
    const result = await UsageService.getById({ organizationId: req.params.organizationId });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching location:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
