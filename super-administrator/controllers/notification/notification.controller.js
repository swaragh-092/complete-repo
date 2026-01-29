// Author : Gururaj
// Created: 30th July 2025
// Description: Notification controller settings
// Version: 1.0.0
// Modified: 

const NotificationService = require("../../services/notification/notification.service");
const ResponseService = require("../../services/Response");
const { fieldPicker } = require("../../util/helper");
const notificationJob = require("../../jobs/functions/notification.job");


// for create or update
exports.updateSettings = async (req, res) => {
  const thisAction = { usedFor: 'Notification', action: 'Update' };
  try {
    const allowedFields = [
        {field : "organizationId", source : "params", as : "organization_id"}, 
        "category",
        "threshold_percent",
        "enabled"
    ];
    const data = fieldPicker(req, allowedFields);
    const result = await NotificationService.createOrUpdateSettings({ req, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Payment failed:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.get = async (req, res) => {
  const thisAction ={ usedFor: 'Notification', action: 'Get' };
  try {
    const allowedFields = [
        {field : "id", source : "params", as : "id"}, 
    ];
    const data = fieldPicker(req, allowedFields);
    const result = await NotificationService.getSettings( data );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Payment failed:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};


exports.getAll = async (req, res) => {
  const thisAction ={ usedFor: 'Notification', action: 'Get' };
  notificationJob.sendNotifications();
  try {
    const result = await NotificationService.getAllSettings(  );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Payment failed:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

