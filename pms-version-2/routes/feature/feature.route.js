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
// /{moduleCode}/feature/...

/**
 * @swagger
 * /{moduleCode}/feature/department/{departmentId}:
 *   post:
 *     tags:
 *       - Feature
 *     summary: Create a feature under a department
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feature created successfully
 */
router.post("/department/:departmentId", [
  uuid("departmentId"),
  name(),
  description().optional(),
], validationMiddleware("Feature", "Create"), featureController.createFeature);


/**
 * @swagger
 * /{moduleCode}/feature/department/{departmentId}:
 *   get:
 *     tags:
 *       - Feature
 *     summary: Get all features of a department
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Features retrieved successfully
 */
router.get("/department/:departmentId",
  [uuid("departmentId")],
  validationMiddleware("Feature", "Get All"),
  featureController.getAllFeaturesOfDepartment
);


/**
 * @swagger
 * /{moduleCode}/feature/department/{departmentId}/project/{projectId}:
 *   get:
 *     tags:
 *       - Feature
 *     summary: Get all features of a department not belonging to a given project
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtered features retrieved successfully
 */
router.get("/department/:departmentId/project/:projectId",
  [
    uuid("departmentId"),
    uuid("projectId"),
  ],
  validationMiddleware("Feature", "Get All"),
  featureController.getAllFeaturesOfDepartmentProjectFilter
);


/**
 * @swagger
 * /{moduleCode}/feature/{featureId}:
 *   get:
 *     tags:
 *       - Feature
 *     summary: Get a feature by ID
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: featureId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feature retrieved successfully
 */
router.get("/:featureId", [
  uuid("featureId"),
], validationMiddleware("Feature", "Get One"), featureController.getFeatureById);


/**
 * @swagger
 * /{moduleCode}/feature/{featureId}:
 *   put:
 *     tags:
 *       - Feature
 *     summary: Update a feature
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: featureId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["active", "inactive"]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feature updated successfully
 */
router.put("/:featureId", [
  uuid("featureId"),
  name().optional(),
  description().optional(),
  enumValue("status", ["active", "inactive"]).optional(),
], validationMiddleware("Feature", "Update"), featureController.updateFeature);


/**
 * @swagger
 * /{moduleCode}/feature/{featureId}:
 *   delete:
 *     tags:
 *       - Feature
 *     summary: Delete a feature
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: featureId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feature deleted successfully
 */
router.delete("/:featureId", [
  uuid("featureId"),
], validationMiddleware("Feature", "Delete"), featureController.deleteFeature);


/**
 * @swagger
 * /{moduleCode}/feature/{featureId}/project/{projectId}:
 *   post:
 *     tags:
 *       - Feature
 *     summary: Add a feature to a project
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: featureId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feature added to project successfully
 */
router.post("/:featureId/project/:projectId",
  [
    uuid("featureId"),
    uuid("projectId")
  ],
  validationMiddleware("Feature", "Add to Project"),
  featureController.addFeatureToProject
);


/**
 * @swagger
 * /{moduleCode}/feature/project/{projectId}:
 *   get:
 *     tags:
 *       - Feature
 *     summary: Get all features of a project
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Features of project retrieved successfully
 */
router.get("/project/:projectId",
  [uuid("projectId")],
  validationMiddleware("Project Features", "Get All"),
  featureController.getAllFeaturesOfProject
);


module.exports = router;
