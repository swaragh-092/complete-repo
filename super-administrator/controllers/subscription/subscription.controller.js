// Author : Gururaj
// Created: 30th July 2025
// Description: controller for subsctiption to plan for module 
// Version: 1.0.0
// Modified: 

const SubscriptionService = require("../../services/subscription/subscription.service");
const ResponseService = require("../../services/Response");
const { fieldPicker } = require("../../util/helper");


exports.subscribe = async (req, res) => {
  const thisAction = { usedFor: 'Subscription', action: 'Create' };
  try {
    const allowedFields = [{field : "organizationId", source : "params", as : "organization_id"}, {field : "planId", source : "params", as : "plan_id"}, "is_trial"];
    const data = fieldPicker(req, allowedFields);
    const result = await SubscriptionService.create({ req, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating subscription:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
