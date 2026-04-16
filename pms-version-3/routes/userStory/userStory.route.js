// Author: Gururaj
// Created: 14th Oct 2025
// Description: User Story router: REST endpoints for story lifecycle, timer, dependencies, helpers, and change requests.
// Version: 2.0.0
// Modified:

// Description: User Story routes
// Version: 2.0.0

const express = require("express");
const router = express.Router();

const userStoryController = require("../../controllers/userStory/userStory.controller");
const validationMiddleware = require("../../middleware/validation.middleware");
const {
  uuid,
  name,
  description,
  enumValue,
} = require("../../services/validation");
const { body } = require("express-validator");

// /{moduleCode}/user-story/...

/**
 * @swagger
 * /{moduleCode}/user-story/feature/{featureId}:
 *   post:
 *     tags:
 *       - User Story
 *     summary: Create a user story under a feature
 *     parameters:
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
 *             required: [title, departmentId]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               acceptance_criteria:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               story_points:
 *                 type: integer
 *               due_date:
 *                 type: string
 *                 format: date
 *               parentUserStoryId:
 *                 type: string
 *                 description: UUID of parent user story (for sub-stories)
 *               departmentId:
 *                 type: string
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: User story created
 */
router.post(
  "/feature/:featureId",
  [
    uuid("featureId"),
    body("title").trim().notEmpty().withMessage("title is required"),
    body("description").optional().trim(),
    body("acceptance_criteria").optional().trim(),
    enumValue("priority", ["low", "medium", "high", "critical"]).optional(),
    body("story_points")
      .optional()
      .isInt({ min: 1 })
      .withMessage("story_points must be a positive integer"),
    body("due_date")
      .optional()
      .isISO8601()
      .withMessage("due_date must be a valid date"),
    body("parentUserStoryId")
      .optional()
      .isUUID()
      .withMessage("parentUserStoryId must be a valid UUID"),
    body("departmentId")
      .notEmpty()
      .isUUID()
      .withMessage("departmentId must be a valid UUID"),
    body("projectId")
      .optional()
      .isUUID()
      .withMessage("projectId must be a valid UUID"),
  ],
  validationMiddleware("User Story", "Create"),
  userStoryController.createUserStory,
);

/**
 * @swagger
 * /{moduleCode}/user-story/feature/{featureId}:
 *   get:
 *     tags:
 *       - User Story
 *     summary: Get all user stories for a feature (top-level with nested sub-stories)
 *     parameters:
 *       - in: path
 *         name: featureId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User stories list
 */
router.get(
  "/feature/:featureId",
  [uuid("featureId")],
  validationMiddleware("User Story", "Get All"),
  userStoryController.getUserStoriesByFeature,
);

/**
 * @swagger
 * /{moduleCode}/user-story/project/{projectId}:
 *   get:
 *     tags:
 *       - User Story
 *     summary: Get all user stories for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User stories list
 */
router.get(
  "/project/:projectId",
  [uuid("projectId")],
  validationMiddleware("User Story", "Get All"),
  userStoryController.getUserStoriesByProject,
);

/**
 * @swagger
 * /{moduleCode}/user-story/project/{projectId}/department/{departmentId}:
 *   get:
 *     tags:
 *       - User Story
 *     summary: Get user stories for a project filtered by department
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User stories list
 */
router.get(
  "/project/:projectId/department/:departmentId",
  [uuid("projectId"), uuid("departmentId")],
  validationMiddleware("User Story", "Get All"),
  userStoryController.getUserStoriesByProjectDepartment,
);

/**
 * @swagger
 * /{moduleCode}/user-story/project/{projectId}/completion:
 *   get:
 *     tags:
 *       - User Story
 *     summary: Get completion stats for a project (optionally filtered by feature)
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: feature_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Completion statistics
 */
router.get(
  "/project/:projectId/completion",
  [uuid("projectId")],
  validationMiddleware("User Story", "Stats"),
  userStoryController.getCompletionStats,
);

/**
 * @swagger
 * /{moduleCode}/user-story/{userStoryId}:
 *   get:
 *     tags:
 *       - User Story
 *     summary: Get a user story by ID with sub-stories and tasks
 *     parameters:
 *       - in: path
 *         name: userStoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User story details
 */
router.get(
  "/:userStoryId",
  [uuid("userStoryId")],
  validationMiddleware("User Story", "Get One"),
  userStoryController.getUserStory,
);

/**
 * @swagger
 * /{moduleCode}/user-story/{userStoryId}:
 *   put:
 *     tags:
 *       - User Story
 *     summary: Update a user story
 *     parameters:
 *       - in: path
 *         name: userStoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               acceptance_criteria:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               status:
 *                 type: string
 *                 enum: [defined, in_progress, completed, blocked]
 *               story_points:
 *                 type: integer
 *               due_date:
 *                 type: string
 *                 format: date
 *               sort_order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User story updated
 */
router.put(
  "/:userStoryId",
  [
    uuid("userStoryId"),
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("title cannot be empty"),
    body("description").optional().trim(),
    body("acceptance_criteria").optional().trim(),
    enumValue("priority", ["low", "medium", "high", "critical"]).optional(),
    enumValue("status", [
      "defined",
      "in_progress",
      "review",
      "completed",
      "blocked",
    ]).optional(),
    body("story_points")
      .optional()
      .isInt({ min: 1 })
      .withMessage("story_points must be a positive integer"),
    body("due_date")
      .optional()
      .isISO8601()
      .withMessage("due_date must be a valid date"),
    body("sort_order")
      .optional()
      .isInt({ min: 0 })
      .withMessage("sort_order must be non-negative integer"),
  ],
  validationMiddleware("User Story", "Update"),
  userStoryController.updateUserStory,
);

/**
 * @swagger
 * /{moduleCode}/user-story/{userStoryId}:
 *   delete:
 *     tags:
 *       - User Story
 *     summary: Delete a user story
 *     parameters:
 *       - in: path
 *         name: userStoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User story deleted
 */
router.delete(
  "/:userStoryId",
  [uuid("userStoryId")],
  validationMiddleware("User Story", "Delete"),
  userStoryController.deleteUserStory,
);

/**
 * @swagger
 * /{moduleCode}/user-story/reorder:
 *   put:
 *     tags:
 *       - User Story
 *     summary: Reorder user stories
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     sort_order:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Reorder successful
 */
router.put(
  "/reorder",
  [
    body("updates")
      .isArray({ min: 1 })
      .withMessage("updates array is required"),
    body("updates.*.id")
      .isUUID()
      .withMessage("Each update must have a valid UUID id"),
    body("updates.*.sort_order")
      .isInt({ min: 0 })
      .withMessage("Each update must have a valid sort_order"),
  ],
  validationMiddleware("User Story", "Reorder"),
  userStoryController.reorderUserStories,
);

/**
 * @swagger
 * /{moduleCode}/user-story/{userStoryId}/approve:
 *   post:
 *     tags:
 *       - User Story
 *     summary: Approve or reject a user story/task
 *     parameters:
 *       - in: path
 *         name: userStoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval status updated
 */
router.post("/:userStoryId/approve", [], userStoryController.approveUserStory);

// Timer routes — GET /timer/current MUST come before GET /:userStoryId to avoid Express
// matching the literal string "timer" as a userStoryId UUID and failing UUID validation.
router.get("/timer/current", userStoryController.getCurrentTimer);
router.post("/:userStoryId/timer/start", userStoryController.startTimer);
router.post("/:userStoryId/timer/stop", userStoryController.stopTimer);

// ─── Helper Story routes ────────────────────────────────────────────────────
// GET /helper/requests — my pending help requests (MUST be before /:userStoryId)
router.get("/helper/requests", userStoryController.getHelpRequests);

// POST  /:userStoryId/helper              — request help on a story
router.post(
  "/:userStoryId/helper",
  [
    uuid("userStoryId"),
    body("title").trim().notEmpty().withMessage("title is required"),
    body("assigned_to")
      .optional()
      .isUUID()
      .withMessage("assigned_to must be a valid UUID"),
    body("due_date")
      .optional()
      .isISO8601()
      .withMessage("due_date must be a valid date"),
    body("description").optional().trim(),
  ],
  validationMiddleware("User Story", "Create Helper"),
  userStoryController.createHelperStory,
);

// GET /:userStoryId/helper — get helpers for a story
router.get(
  "/:userStoryId/helper",
  [uuid("userStoryId")],
  validationMiddleware("User Story", "Get Helpers"),
  userStoryController.getHelperStoriesForStory,
);

// POST /:helperStoryId/helper/:action — accept or reject a help request (action: accept|reject)
router.post(
  "/:helperStoryId/helper/:action",
  [uuid("helperStoryId"), enumValue("action", ["accept", "reject"])],
  validationMiddleware("User Story", "Accept/Reject Helper"),
  userStoryController.acceptOrRejectHelperStory,
);

// DELETE /:helperStoryId/helper/remove — remove (soft-delete) a helper story
router.delete(
  "/:helperStoryId/helper/remove",
  [uuid("helperStoryId")],
  validationMiddleware("User Story", "Remove Helper"),
  userStoryController.removeHelperStory,
);

// ─── Dependency routes ──────────────────────────────────────────────────────
// GET /:userStoryId/dependencies — stories this story depends on (blockers)
router.get(
  "/:userStoryId/dependencies",
  [uuid("userStoryId")],
  validationMiddleware("User Story", "Get Dependencies"),
  userStoryController.getDependencies,
);

// GET /:userStoryId/parents — stories that depend on this story (blocked by this)
router.get(
  "/:userStoryId/parents",
  [uuid("userStoryId")],
  validationMiddleware("User Story", "Get Parent Stories"),
  userStoryController.getParentStories,
);

// POST /:userStoryId/dependency/:dependencyStoryId — add a dependency
router.post(
  "/:userStoryId/dependency/:dependencyStoryId",
  [uuid("userStoryId"), uuid("dependencyStoryId")],
  validationMiddleware("User Story", "Add Dependency"),
  userStoryController.addDependency,
);

// DELETE /:userStoryId/dependency/:dependencyStoryId — remove a dependency
router.delete(
  "/:userStoryId/dependency/:dependencyStoryId",
  [uuid("userStoryId"), uuid("dependencyStoryId")],
  validationMiddleware("User Story", "Remove Dependency"),
  userStoryController.removeDependency,
);

// ─── Advance Status ─────────────────────────────────────────────────────────
// POST /:userStoryId/advance — move story to the next status in linear flow
router.post(
  "/:userStoryId/advance",
  [uuid("userStoryId")],
  validationMiddleware("User Story", "Advance Status"),
  userStoryController.advanceStatus,
);

// ─── Revert Status ──────────────────────────────────────────────────────────
// POST /:userStoryId/revert — step story back one status (free unless completed)
router.post(
  "/:userStoryId/revert",
  [uuid("userStoryId")],
  validationMiddleware("User Story", "Revert Status"),
  userStoryController.revertStatus,
);

// ─── Change Requests ────────────────────────────────────────────────────────
// GET  /change-requests/pending — all pending CRs for team leads (must precede /:id routes)
router.get(
  "/change-requests/pending",
  userStoryController.getPendingChangeRequests,
);

// POST /:userStoryId/change-request — submit a due-date or status-revert request
router.post(
  "/:userStoryId/change-request",
  [
    uuid("userStoryId"),
    body("request_type")
      .notEmpty()
      .withMessage("request_type is required")
      .isIn(["due_date_change", "status_revert"])
      .withMessage("request_type must be due_date_change or status_revert"),
    body("requested_value")
      .notEmpty()
      .withMessage("requested_value is required"),
    body("reason").optional().trim(),
  ],
  validationMiddleware("User Story", "Request Change"),
  userStoryController.requestChange,
);

// GET  /:userStoryId/change-requests — list change requests for a story
router.get(
  "/:userStoryId/change-requests",
  [uuid("userStoryId")],
  validationMiddleware("User Story", "Get Change Requests"),
  userStoryController.getChangeRequests,
);

// PUT  /change-request/:requestId/review — team lead approves or rejects
router.put(
  "/change-request/:requestId/review",
  [
    uuid("requestId"),
    body("action")
      .isIn(["approved", "rejected"])
      .withMessage("action must be approved or rejected"),
    body("comments").optional().trim(),
  ],
  validationMiddleware("User Story", "Review Change Request"),
  userStoryController.reviewChangeRequest,
);

module.exports = router;
