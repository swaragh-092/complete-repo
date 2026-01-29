// Author: Gururaj
// Created: 19th Sept 2025
// Description: Routes for checklist management.
// Version: 1.0.0
// Modified:

const express = require("express");

const checklistController = require("../../controllers/feature/checklist.controller");
const validationMiddleware = require("../../middleware/validation.middleware");
const { uuid, name, description } = require("../../services/validation");

const router = express.Router();

// Create Checklist for a Feature
router.post(
  "/feature/:featureId",
  [
    uuid("featureId"),
    name("title"),
    description().optional()
  ],
  validationMiddleware("Checklist", "Create"), checklistController.createChecklist
);

// Get All Checklists of a Feature
router.get(
  "/feature/:featureId",
  [uuid("featureId")],
  validationMiddleware("Checklist", "Get all"),
  checklistController.getAllChecklistsOfFeature
);

// Get Single Checklist by ID
router.get(
  "/:checklistId",
  [uuid("checklistId")],
  validationMiddleware("Checklist", "Get"),
  checklistController.getChecklistById
);

// Update Checklist by ID
router.put(
  "/:checklistId",
  [
    uuid("checklistId"),
    name("title").optional(),
    description().optional()
  ],
  validationMiddleware("Checklist", "Update"),
  checklistController.updateChecklist
);

// Delete Checklist by ID
router.delete(
  "/:checklistId",
  [uuid("checklistId")],
  validationMiddleware("Checklist", "Delete"),
  checklistController.deleteChecklist
);

module.exports = router;
