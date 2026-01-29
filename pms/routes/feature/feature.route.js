// Author: Gururaj
// Created: 14th oct 2025
// Description: feature related routs
// Version: 1.0.0
// Modified:

const express = require("express");

const featureController = require("../../controllers/feature/feature.controller");
const validationMiddleware = require("../../middleware/validation.middleware");
const { uuid, enumValue, name, description } = require("../../services/validation");

const router = express.Router();

// Create Feature (under a department)
router.post("/department/:departmentId", [
  uuid("departmentId"),
  name(),
  description().optional(),
], validationMiddleware("Feature", "Create"), featureController.createFeature);

// Get All Features
router.get("/department/:departmentId", 
    [
        uuid("departmentId"),
    ],
  validationMiddleware("Feature", "Get All"), 
  featureController.getAllFeaturesOfDepartment
);

// Get All Features of department where not belongs to given project
router.get("/department/:departmentId/project/:projectId", 
    [
        uuid("departmentId"),
        uuid("projectId"),
    ],
  validationMiddleware("Feature", "Get All"), 
  featureController.getAllFeaturesOfDepartmentProjectFilter
);

// Get Feature by ID
router.get("/:featureId", [
  uuid("featureId"),
], validationMiddleware("Feature", "Get One"), featureController.getFeatureById);

// Update Feature
router.put("/:featureId", [
    uuid("featureId"),
    name().optional(),
    description().optional(),
    enumValue("status", ["active", "inactive"]).optional(), // Optional status validation
], validationMiddleware("Feature", "Update"), featureController.updateFeature);

// Delete Feature
router.delete("/:featureId", [
  uuid("featureId"),
], validationMiddleware("Feature", "Delete"), featureController.deleteFeature);



// add feature to the project.

router.post("/:featureId/project/:projectId", 
  [
    uuid("featureId"),
    uuid("projectId")
  ],
  validationMiddleware("Feature", "Add to Project"), 
  featureController.addFeatureToProject
);

// get features of project
router.get("/project/:projectId", 
    [
        uuid("projectId"),
    ],
  validationMiddleware("Project Features", "Get All"), 
  featureController.getAllFeaturesOfProject
);



module.exports = router;
