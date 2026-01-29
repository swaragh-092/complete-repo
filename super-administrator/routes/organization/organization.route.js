// Author: Gururaj
// Created: 4th July 2025
// Description: Routes for Organization APIs.
// Version: 1.0.0

const express = require("express");
const router = express.Router();
const OrganizationController = require("../../controllers/organization/organization.controller");
const { ORGANIZATION_STATE_ENUM_VALUES } = require("../../util/constant");

// Validation middleware if needed
const {
  name,
  description,
  enumVal,
  alphaNum255,
  uuid,
  email,
  phone,
  requiredEnum
} = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");



// /api/organizations
router.post(
  "/",
  [
    name(),  // mandatory
    description(), // optional
    email(), // mandatory
    phone(), // mandatory
    enumVal("state", ORGANIZATION_STATE_ENUM_VALUES), // optional
    alphaNum255("owner_keycloak_id"), // mandatory
  ],
  validationMiddleware("Organization", "Create"),
  OrganizationController.create
);

router.put('/basic-info/:id', [
  uuid('id'),
  name('name').optional(), // optional
  description() // optional
],
validationMiddleware("Organization", "Update"),
OrganizationController.updateBasicInfo);

router.put('/state/:id', [
  uuid('id'),
  requiredEnum('state', ORGANIZATION_STATE_ENUM_VALUES)
],  validationMiddleware("Organization", "State update"), OrganizationController.updateTrialAndState);

router.get("/:id", OrganizationController.getById);
router.get("/", OrganizationController.getAll);
router.delete("/:id", OrganizationController.delete);

module.exports = router;
