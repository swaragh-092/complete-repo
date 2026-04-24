// Author: Gururaj
// Created: 14th Oct 2025
// Description: Project router declaring REST endpoints for project CRUD, member management, and dashboard data.
// Version: 1.0.0
// Modified:

/*   
Author: Homshree 
Created: 29th May 2025
Description: all routes related to Projects
Version: 1.0.0
*/

const express = require("express");

const projectController = require("../../controllers/project/project.controller");
const validate = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");
const ENTITY = "Project";
const ACTIONS = {
  CREATE: "Add",
  READ: "Read",
  UPDATE: "Update",
  DELETE: "Delete",
};

const router = express.Router();

// {moduleCode}/project/...

/**
 * @swagger
 * /{moduleCode}/project/overview:
 *   get:
 *     tags:
 *       - Project
 *     summary: Get project overview data
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *         description: Module code from config
 *     responses:
 *       200:
 *         description: Overview data retrieved successfully
 */
router.get("/overview", projectController.getOverviewData);

/**
 * @swagger
 * /{moduleCode}/project/health/{status}:
 *   get:
 *     tags:
 *       - Project
 *     summary: Get project health by status
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: ['ongoing', 'on_track', 'at_risk', 'critical', 'near_deadline', 'no_update', 'overdue']
 *     responses:
 *       200:
 *         description: Projects retrieved by status
 */
router.get(
  "/health/:status",
  [
    validate
      .enumValue(
        "status",
        [
          "ongoing",
          "on_track",
          "at_risk",
          "critical",
          "near_deadline",
          "no_update",
          "overdue",
        ],
        "params",
      )
      .optional(),
  ],
  validationMiddleware(ENTITY, ACTIONS.READ),
  projectController.getAllProjects,
);

/**
 * @swagger
 * /{moduleCode}/project:
 *   get:
 *     tags:
 *       - Project
 *     summary: Get all projects
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *     responses:
 *       200:
 *         description: All projects retrieved
 */
router.get("/", projectController.getAllProjects);

/**
 * @swagger
 * /{moduleCode}/project/usersongoing:
 *   get:
 *     tags:
 *       - Project
 *     summary: Get all users ongoing projects
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *     responses:
 *       200:
 *         description: Users ongoing projects retrieved
 */
router.get("/usersongoing", projectController.getAllUsersOngoingProjects);

/**
 * @swagger
 * /{moduleCode}/project/usersongoing/department/{departmentId}:
 *   get:
 *     tags:
 *       - Project
 *     summary: Get all users ongoing projects by department
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
 *         description: Users ongoing projects by department
 */
router.get(
  "/usersongoing/department/:departmentId",
  [validate.uuid("departmentId")],
  validationMiddleware(ENTITY, ACTIONS.READ),
  projectController.getAllUsersOngoingProjects,
);

/**
 * @swagger
 * /{moduleCode}/project/register:
 *   post:
 *     tags:
 *       - Project
 *     summary: Create a new project
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
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
 *               estimatedStartDate:
 *                 type: string
 *                 format: date
 *               estimatedEndDate:
 *                 type: string
 *                 format: date
 *               permissionCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project created successfully
 */
router.post(
  "/register",
  [
    validate.name("name"),
    validate.description("description"),
    validate.enumValue("type", ["application", "site"]),
    validate.dateFuture("estimatedStartDate"),
    validate.dateGreaterThan("estimatedEndDate", "estimatedStartDate"),
    validate.permissionCode(),
  ],
  validationMiddleware(ENTITY, ACTIONS.CREATE),
  projectController.postCreateProject,
);

/**
 * @swagger
 * /{moduleCode}/project/{id}:
 *   get:
 *     tags:
 *       - Project
 *     summary: Get project by ID
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 */
router.get(
  "/:id",
  [validate.uuid("id", "params")],
  validationMiddleware(ENTITY, ACTIONS.READ),
  projectController.getProject,
);

/**
 * @swagger
 * /{moduleCode}/project/{id}/features:
 *   get:
 *     tags:
 *       - Project
 *     summary: Get project with features
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project with features retrieved
 */
router.get(
  "/:id/features",
  [validate.uuid("id", "params")],
  validationMiddleware(ENTITY, ACTIONS.READ),
  projectController.getProjectWithFeatures,
);

/**
 * @swagger
 * /{moduleCode}/project/{id}:
 *   put:
 *     tags:
 *       - Project
 *     summary: Update project by ID
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 */
router.put(
  "/:id",
  [
    validate.uuid("id", "params"),
    validate.name("name").optional(),
    validate.description("description").optional(),
    validate.enumValue("type", ["application", "site"]).optional(),
    validate.dateFuture("estimatedStartDate").optional(),
    validate
      .dateGreaterThan("estimatedEndDate", "estimatedStartDate")
      .optional(),
  ],
  validationMiddleware(ENTITY, ACTIONS.UPDATE),
  projectController.updateProject,
);

/**
 * @swagger
 * /{moduleCode}/project/{id}:
 *   delete:
 *     tags:
 *       - Project
 *     summary: Delete project by ID
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 */
router.delete(
  "/:id",
  [validate.uuid("id", "params")],
  validationMiddleware(ENTITY, ACTIONS.DELETE),
  projectController.deleteProject,
);

/**
 * @swagger
 * /{moduleCode}/project/{id}/complete:
 *   post:
 *     tags:
 *       - Project
 *     summary: Mark project as complete
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project marked as complete
 */
router.post(
  "/:id/complete",
  [validate.uuid("id", "params")],
  validationMiddleware(ENTITY, ACTIONS.UPDATE),
  projectController.completeProject,
);

module.exports = router;
