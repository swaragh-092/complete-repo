// Author: Gururaj
// Created: 4th July 2025
// Description: Centralized router entry point.
// Version: 1.0.0

const express = require("express");

const validationMiddleware = require("../middleware/validation.middleware");
const {getData, getAllData} = require("../controllers/getData.controller");
const { uuid, name, subdomain, permissionCode } = require("../services/validation");
const router = express.Router();

router.use("/organizations", require("./organization/organization.route"));
router.use("/", require("./organization/organizationAdmin.route"));
router.use(
  "/organization",
  require("./organization/organizationLocation.routes")
);
router.use("/modules", require("./module/module.route"));
router.use("/", require("./module/moduleFeature.route"));
router.use("/project", require("./project/project.route"));
router.use("/plan", require("./plan/plan.route"));
router.use("/subscription", require("./subscription/subscription.routes"));
router.use("/payment/", require("./payment/payment.route"));

// functionality works but not required for now 
// router.use("/host/codebase", require("./host/codebase.route"));
// router.use("/host/domain", require("./host/dnsMapping.routes"));


router.use("/host/database", require("./host/database.route"));
router.use("/pause", require("./pause/pause.route"));
router.use("/email", require("./usage/emailPackage.route"));
router.use("/sms", require("./usage/smsPackage.route"));
router.use("/usage", require("./usage/usage.route"));
router.use(
  "/settings/notification",
  require("./notification/notification.route")
);
 
router.get(
  "/required-data/:organizationId/:projectDomain/:moduleCode",
  [
    uuid("organizationId"),
    subdomain('projectDomain'),
    permissionCode("moduleCode").isLength({ min: 1 }),
  ],
  validationMiddleware("Data", "Get"),
  getData
);
router.get(
  "/all-data/:organizationId",
  [
    uuid("organizationId"),
  ],
  validationMiddleware("Data", "Get"),
  getAllData
);

// Export for app.js
module.exports = router;
