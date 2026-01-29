// Author: Gururaj
// Created: 8th July 2025
// Description: Routes for Organization Admin related routes
// Version: 1.0.0

const express = require("express");
const router = express.Router();
const controller = require("../../controllers/organization/organizationAdmin.controller");
const validationMiddleware = require("../../middleware/validation.middleware");
const { uuid, alphaNum255, requiredEnum } = require("../../services/validation");

// All routes prefixed with /organization/:organizationId/admin

router.post(
  "/organization/:organizationId/admin",
  [
    uuid("organizationId"),
    alphaNum255("keycloak_user_id")
  ],
  validationMiddleware("Organization Admin", "Create"),
  controller.create
);

router.put(
  "/organization/admin/:id/state",
  [
    uuid("id"),
    requiredEnum("state", ["active", "suspended"]),
  ],
  validationMiddleware("Organization Admin", "Update"),
  controller.editActive
);

router.get(
  "/organization/admin/:id",
  [uuid("id")],
  validationMiddleware("Organization Admin", "Get"),
  controller.getById
);

router.get(
  "/organization/:organizationId/admin",
  [uuid("organizationId")],
  validationMiddleware("Organization Admin", "Get"),
  controller.getAll
);

router.delete(
  "/organization/admin/:id",
  [uuid("id")],
  validationMiddleware("Organization Admin", "Delete"),
  controller.delete
);

module.exports = router;
