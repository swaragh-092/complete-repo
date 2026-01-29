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


router.get('/',  notificationController.list);
router.get('/unread-count',  notificationController.unreadCount);
router.put('/:id', [ // notification id 
    
    validate.uuid("id"),
  
], validationMiddleware("Notification", "mard read"), notificationController.markRead);



module.exports = router;

