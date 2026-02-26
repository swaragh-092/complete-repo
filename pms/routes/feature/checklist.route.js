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

// /{moduleCode}/check-list/...


/**
 * @swagger
 * /{moduleCode}/check-list/feature/{featureId}:
 *   post:
 *     tags:
 *       - Feature
 *     summary: Create a checklist for a feature
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checklist created successfully
 */
router.post(
  "/feature/:featureId",
  [
    uuid("featureId"),
    name("title"),
    description().optional()
  ],
  validationMiddleware("Checklist", "Create"),
  checklistController.createChecklist
);


/**
 * @swagger
 * /{moduleCode}/check-list/feature/{featureId}:
 *   get:
 *     tags:
 *       - Feature
 *     summary: Get all checklists of a feature
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
 *         description: List of checklists retrieved successfully
 */
router.get(
  "/feature/:featureId",
  [uuid("featureId")],
  validationMiddleware("Checklist", "Get all"),
  checklistController.getAllChecklistsOfFeature
);


/**
 * @swagger
 * /{moduleCode}/check-list/{checklistId}:
 *   get:
 *     tags:
 *       - Feature
 *     summary: Get a single checklist by ID
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Checklist retrieved successfully
 */
router.get(
  "/:checklistId",
  [uuid("checklistId")],
  validationMiddleware("Checklist", "Get"),
  checklistController.getChecklistById
);


/**
 * @swagger
 * /{moduleCode}/check-list/{checklistId}:
 *   put:
 *     tags:
 *       - Feature
 *     summary: Update a checklist by ID
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checklist updated successfully
 */
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


/**
 * @swagger
 * /{moduleCode}/check-list/{checklistId}:
 *   delete:
 *     tags:
 *       - Feature
 *     summary: Delete a checklist by ID
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Checklist deleted successfully
 */
router.delete(
  "/:checklistId",
  [uuid("checklistId")],
  validationMiddleware("Checklist", "Delete"),
  checklistController.deleteChecklist
);


module.exports = router;
