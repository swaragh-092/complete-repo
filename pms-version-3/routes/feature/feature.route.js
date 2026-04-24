// Author: Gururaj
// Created: 14th oct 2025
// Description: feature related routs
// Version: 1.0.0
// Modified:

const express = require("express");

const featureController = require("../../controllers/feature/feature.controller");
const validationMiddleware = require("../../middleware/validation.middleware");
const {
  uuid,
  enumValue,
  description,
} = require("../../services/validation");
const { body } = require("express-validator");

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
router.post(
  "/department/:departmentId",
  [
    uuid("departmentId"),
    body("name").trim().notEmpty().withMessage("name is required").isLength({ min: 2, max: 100 }).withMessage("name must be 2-100 characters"),
    description().optional(),
    uuid("projectId", "body"),
    body("parentFeatureId").optional().isUUID().withMessage("parentFeatureId must be a valid UUID"),
  ],
  validationMiddleware("Feature", "Create"),
  featureController.createFeature,
);

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
router.get(
  "/department/:departmentId",
  [uuid("departmentId")],
  validationMiddleware("Feature", "Get All"),
  featureController.getAllFeaturesOfDepartment,
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
router.get(
  "/department/:departmentId/project/:projectId",
  [uuid("departmentId"), uuid("projectId")],
  validationMiddleware("Feature", "Get All"),
  featureController.getAllFeaturesOfDepartmentProjectFilter,
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
router.get(
  "/:featureId",
  [uuid("featureId")],
  validationMiddleware("Feature", "Get One"),
  featureController.getFeatureById,
);

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
router.put(
  "/:featureId",
  [
    uuid("featureId"),
    body("name").optional().trim().notEmpty().withMessage("name cannot be empty").isLength({ min: 2, max: 100 }).withMessage("name must be 2-100 characters"),
    description().optional(),
    enumValue("status", ["active", "inactive"]).optional(),
    body("parentFeatureId").optional().isUUID().withMessage("parentFeatureId must be a valid UUID"),
    body("assignee_id").optional().isUUID().withMessage("assignee_id must be a valid UUID"),
    enumValue("priority", ["low", "medium", "high", "critical"]).optional(),
  ],
  validationMiddleware("Feature", "Update"),
  featureController.updateFeature,
);

/**
 * POST /{moduleCode}/feature/:featureId/approve — approve or reject a feature
 */
router.post(
  "/:featureId/approve",
  [uuid("featureId")],
  validationMiddleware("Feature", "Approve"),
  featureController.approveFeature,
);

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
router.delete(
  "/:featureId",
  [uuid("featureId")],
  validationMiddleware("Feature", "Delete"),
  featureController.deleteFeature,
);

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
router.post(
  "/:featureId/project/:projectId",
  [uuid("featureId"), uuid("projectId")],
  validationMiddleware("Feature", "Add to Project"),
  featureController.addFeatureToProject,
);

/**
 * @swagger
 * /{moduleCode}/feature/project/{projectId}:
 *   post:
 *     tags:
 *       - Feature
 *     summary: Create a feature directly under a project (v2)
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, departmentId]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               departmentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feature created for project
 */
router.post(
  "/project/:projectId",
  [
    uuid("projectId"),
    body("name").trim().notEmpty().withMessage("name is required").isLength({ min: 2, max: 100 }).withMessage("name must be 2-100 characters"),
    description().optional(),
    uuid("departmentId", "body"),
    body("parentFeatureId").optional().isUUID().withMessage("parentFeatureId must be a valid UUID"),
    body("assignee_id").optional().isUUID().withMessage("assignee_id must be a valid UUID"),
    enumValue("priority", ["low", "medium", "high", "critical"]).optional(),
  ],
  validationMiddleware("Feature", "Create"),
  featureController.createProjectFeature,
);

/**
 * @swagger
 * /{moduleCode}/feature/project/{projectId}:
 *   get:
 *     tags:
 *       - Feature
 *     summary: Get all features of a project (v2 direct)
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
router.get(
  "/project/:projectId",
  [uuid("projectId")],
  validationMiddleware("Project Features", "Get All"),
  featureController.getAllFeaturesByProject,
);

module.exports = router;
