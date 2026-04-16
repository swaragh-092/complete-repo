// Author: Gururaj
// Created: 14th oct 2025
// Description: all notification related functionality controller.
// Version: 1.0.0
// Modified:

const NotificationService = require("../../services/notification/notification.service");
const ResponseService = require("../../services/Response");
const { sendErrorResponse } = require("../../util/helper");

class NotificationController {
   static async list(req, res) {
    const thisAction = { usedFor: "Notification", action: "List" };
    try {
      const result = await NotificationService.getUserNotifications(req, req.user.id, req.query);
      return ResponseService.apiResponse({ res,...result, ...thisAction });
    } catch (err) {
      console.log(err);
      return sendErrorResponse(thisAction, err, res);
    }
  }

  static async markRead(req, res) {
    const thisAction = { usedFor: "Notification", action: "Mark Read" };
    try {
      const result = await NotificationService.markAsRead(req, req.params.id);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }
  static async unreadCount(req, res) {
    const thisAction = { usedFor: "Notification Unread Count", action: "Get" };
    try {
      const result = await NotificationService.unreadCount(req);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      
      return sendErrorResponse(thisAction, err, res);
    }
  }
}
 
module.exports = NotificationController;
