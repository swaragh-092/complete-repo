// Author: Gururaj
// Created: 8th July 2025
// Description: Routes for Organization location related APIs.
// Version: 1.0.0

const express = require("express");
const router = express.Router({ mergeParams: true });
const controller = require("../../controllers/organization/organizationLocation.controller");

const {
  uuid,
  string,
  number,
  pincode,
  timezone,
  location
} = require("../../services/validation");

const validation = require("../../middleware/validation.middleware");

router.get(
  "/:organizationId/location",
  [uuid("organizationId")],
  validation("Organization Location", "Get"),
  controller.getById
);

router.put(
  "/:organizationId/location",
  [
    uuid("organizationId"),
    location("country").optional(),
    location("state").optional(),
    location("city").optional(),
    location("street").optional(),
    location("locale").optional(),
    location("address").optional(),
    location("district").optional(),
    pincode("pincode").optional(),
    timezone("timezone").optional(),
    number("lat", {min:-180, max:180}).optional(),
    number("lng", {min:-180, max:180}).optional(),
  ],
  validation("OrganizationLocation", "Update"),
  controller.update
);

module.exports = router;
