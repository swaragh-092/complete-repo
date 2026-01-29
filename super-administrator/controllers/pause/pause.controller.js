// Author : Gururaj
// Created: 30th July 2025
// Description: Controller for subscription pause feature
// Version: 1.0.0
// Modified: 

const PauseService = require("../../services/pause/pause.service");
const ResponseService = require("../../services/Response");
const { fieldPicker } = require("../../util/helper");

// add pause for subscription.
exports.pauseSubscription = async (req, res) => {
  const thisAction = { usedFor: 'Subscription', action: 'Pause' };
  try {
    const allowedFields = [
        {field : "subscriptionId", source : "params", as : "subscription_id"}, 
        "start_date",
        "end_date",
        "reason",
    ];
    const data = fieldPicker(req, allowedFields);
    const result = await PauseService.pauseSubscription({ req, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Payment failed:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

// cancle the pause which is added before
exports.cancelPause = async (req, res) => {
  const thisAction = { usedFor: 'Subscription', action: 'Remove Pause' };
  try {
    const allowedFields = [
        {field : "subscriptionId", source : "params", as : "subscription_id"}, 
        {field : "pauseId", source : "params", as : "pause_id"},
    ];
    const data = fieldPicker(req, allowedFields);
    const result = await PauseService.cancelPause({ req, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Payment failed:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

// stop pause if it currently in.
exports.stopPause = async (req, res) => {
  const thisAction = { usedFor: 'Subscription', action: 'Remove Pause' };
  try {
    const allowedFields = [
        {field : "subscriptionId", source : "params", as : "subscription_id"},
    ];
    const data = fieldPicker(req, allowedFields);
    const result = await PauseService.stopPause({ req, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Payment failed:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
