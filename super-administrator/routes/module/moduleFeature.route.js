// Author: Gururaj
// Created: 8th July 2025
// Description: Routes for ModuleFeature APIs.
// Version: 1.0.0

const express = require("express");
const router = express.Router();
const featureController = require("../../controllers/module/moduleFeature.controller");

const {
  uuid,
  name,
  description,
  permissionCode,
  requiredEnum
} = require("../../services/validation");

const validationMiddleware = require("../../middleware/validation.middleware");

// Create Feature (moduleId from params)
router.post(
  "/module/:moduleVersionId/feature",
  [
    uuid("moduleVersionId"),
    permissionCode("code"),
    name(),
    description().optional(),
  ],
  validationMiddleware("Module Feature", "Create"),
  featureController.create
);

// Get All Features by Module
router.get(
  "/module/:moduleId/feature",
  [uuid("moduleId")],
  validationMiddleware("Module Feature", "GetAll"),
  featureController.getAll
);

router.put(
  "/feature/:id",
  [
    uuid("id"),
    permissionCode("code").optional(),
    name().optional(),
    description().optional(),
  ],
  validationMiddleware("Module Feature", "Update"),
  featureController.update
);

router.put(
  "/feature/state/:id",
  [
    uuid("id"),
    requiredEnum("state", ["active", "suspended"])
  ],
  validationMiddleware("Module Feature", "ToggleState"),
  featureController.editActive
);

router.get("/feature/:id", [uuid("id")], validationMiddleware("Module Feature", "Get"), featureController.getById);

router.delete("/feature/:id", [uuid("id")], validationMiddleware("Module Feature", "Delete"),  featureController.delete);

module.exports = router;
