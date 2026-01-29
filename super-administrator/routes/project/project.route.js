// Author: Gururaj
// Created: 8th July 2025
// Description: Routes for project related APIs.
// Version: 1.0.0

const express = require("express");
const router = express.Router();

const validationMiddleware = require("../../middleware/validation.middleware");
const { name, boolean, manyUuids, uuid, subdomain } = require("../../services/validation");
const projectController = require("../../controllers/project/project.controller");


// ==== PROJECT ROUTES ====
router.post("/", [
    name(),
    name("short_name"),
    subdomain("sub_domain"),
] , validationMiddleware("Project", "Create"), projectController.create);
router.put("/:id", [
    name().optional(),
    name("short_name").optional(),
    boolean("is_active").optional(),
    uuid("id"),
    subdomain("sub_domain").optional(),
] , validationMiddleware("Project", "Update"), projectController.update);
router.get("/", projectController.getAllProjects);
router.get("/:id", uuid("id"), validationMiddleware("Project", "Get"), projectController.getProjectById);
router.get("/:id/version/:versionId", [uuid("id"), uuid("versionId")], validationMiddleware("Project", "Get"), projectController.getProjectWtihVersion);


// project modules and features and versions route
router.post("/:projectId/versions/modules", [
    manyUuids("module_version_ids"),
    uuid("projectId"),
] , validationMiddleware("Project", "Create"), projectController.addModulesToProject);
router.delete("/:projectId/versions/modules", [
    manyUuids("module_version_ids"),
    uuid("projectId"),
] , validationMiddleware("Project", "Create"), projectController.removeModulesToProject);

router.post("/:projectId/versions/module/:moduleVersionId/features", [
    uuid("projectId"),
    uuid("moduleVersionId"),
    manyUuids("feature_ids")
], validationMiddleware("Project Features", "Add"), projectController.addFeaturesToProject);
router.delete("/:projectId/versions/module/:moduleVersionId/features", [
    uuid("projectId"),
    uuid("moduleVersionId"),
    manyUuids("feature_ids")
], validationMiddleware("Project Features", "Remove"), projectController.removeFeaturesFromProject);



module.exports = router;
