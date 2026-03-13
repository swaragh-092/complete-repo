// Author: Gururaj
// Created: 14th oct 2025
// Description: notification related routs
// Version: 1.0.0
// Modified:

const express = require("express");

const notificationController = require("../../controllers/notification/norification.controller");
const validate = require("../../services/validation");
const validationMiddleware = require('../../middleware/validation.middleware');


const router = express.Router();

// /{moduleCode}/notification/...

/**
 * @swagger
 * /{moduleCode}/notification:
 *   get:
 *     tags:
 *       - Notification
 *     summary: Get all notifications
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', notificationController.list);


/**
 * @swagger
 * /{moduleCode}/notification/unread-count:
 *   get:
 *     tags:
 *       - Notification
 *     summary: Get unread notifications count
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *     responses:
 *       200:
 *         description: Count of unread notifications
 */
router.get('/unread-count', notificationController.unreadCount);


/**
 * @swagger
 * /{moduleCode}/notification/{id}:
 *   put:
 *     tags:
 *       - Notification
 *     summary: Mark a notification as read
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put(
  '/:id',
  [validate.uuid("id")],
  validationMiddleware("Notification", "mark read"),
  notificationController.markRead
);
 
module.exports = router;

