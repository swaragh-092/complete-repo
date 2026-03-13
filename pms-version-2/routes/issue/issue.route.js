// Author: Gururaj
// Created: 14th oct 2025
// Description: issue related routs
// Version: 1.0.0
// Modified:
const express = require("express");
const IssueController = require("../../controllers/issue/issue.controller");
const { uuid, name, enumValue, description, dateFuture } = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");

const router = express.Router();

// /{moduleCode}/issue/...
/**
 * @swagger
 * /{moduleCode}/issue/types:
 *   get:
 *     tags:
 *       - Issue
 *     summary: Get all issue types
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *     responses:
 *       200:
 *         description: List of issue types
 */
router.get("/types", IssueController.getIssueTypes);


/**
 * @swagger
 * /{moduleCode}/issue/{projectId}:
 *   post:
 *     tags:
 *       - Issue
 *     summary: Create an issue
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from_department_id:
 *                 type: string
 *               to_department_id:
 *                 type: string
 *               issue_type_id:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: ["low", "medium", "high", "critical"]
 *     responses:
 *       200:
 *         description: Issue created successfully
 */
router.post(
  "/:projectId",
  [
    [
      uuid("projectId"),
      uuid("from_department_id", "body"),
      uuid("to_department_id", "body"),
      uuid("issue_type_id", "body"),
      name("title"),
      description().optional(),
      enumValue("priority", ["low", "medium", "high", "critical"]).optional(),
    ],
  ],
  validationMiddleware("Issue", "create"),
  IssueController.create
);


/**
 * @swagger
 * /{moduleCode}/issue/{id}/accept:
 *   put:
 *     tags:
 *       - Issue
 *     summary: Accept an issue
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
 *         description: Issue accepted successfully
 */
router.put("/:id/accept", [[uuid("id")]], validationMiddleware("Issue", "accept"), IssueController.accept);


/**
 * @swagger
 * /{moduleCode}/issue/{id}/reject:
 *   put:
 *     tags:
 *       - Issue
 *     summary: Reject an issue
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reject_reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Issue rejected successfully
 */
router.put("/:id/reject", [uuid("id"), description("reject_reason")], validationMiddleware("Issue", "reject"), IssueController.reject);


/**
 * @swagger
 * /{moduleCode}/issue/{id}/reassign/{toDepartmentid}:
 *   put:
 *     tags:
 *       - Issue
 *     summary: Reassign an issue to another department
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
 *       - in: path
 *         name: toDepartmentid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue reassigned successfully
 */
router.put("/:id/reassign/:toDepartmentid", [[uuid("id"), uuid("toDepartmentid")]], validationMiddleware("Issue", "reassign"), IssueController.reassign);


/**
 * @swagger
 * /{moduleCode}/issue/{id}/resolve:
 *   put:
 *     tags:
 *       - Issue
 *     summary: Resolve an issue
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
 *         description: Issue resolved successfully
 */
router.put("/:id/resolve", [[uuid("id")]], validationMiddleware("Issue", "resolve"), IssueController.resolve);


/**
 * @swagger
 * /{moduleCode}/issue/{id}/finalize:
 *   put:
 *     tags:
 *       - Issue
 *     summary: Finalize an issue (close or reopen)
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
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["closed", "reopen"]
 *       - in: query
 *         name: comment
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue closed or reopened successfully
 */
router.put(
  "/:id/finalize",
  [
    uuid("id"),
    enumValue("status", ["closed", "reopen"]),
    description("comment").optional(),
  ],
  validationMiddleware("Issue", "resolve"),
  IssueController.closeOrReOpen
);


/**
 * @swagger
 * /{moduleCode}/issue/project/{projectId}/issue/{issueId}:
 *   get:
 *     tags:
 *       - Issue
 *     summary: Get issue by project and issue ID
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
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue retrieved successfully
 */
router.get(
  "/project/:projectId/issue/:issueId",
  [[uuid("projectId"), uuid("issueId")]],
  validationMiddleware("Issue", "listByProject"),
  IssueController.listByProject
);


/**
 * @swagger
 * /{moduleCode}/issue/project/{projectId}:
 *   get:
 *     tags:
 *       - Issue
 *     summary: List issues by project
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
 *         description: Issues listed successfully
 */
router.get(
  "/project/:projectId",
  [[uuid("projectId")]],
  validationMiddleware("Issue", "listByProject"),
  IssueController.listByProject
);


/**
 * @swagger
 * /{moduleCode}/issue/{issueId}:
 *   get:
 *     tags:
 *       - Issue
 *     summary: Get an issue by ID
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue retrieved successfully
 */
router.get(
  "/:issueId",
  [[uuid("issueId")]],
  validationMiddleware("Issue", "Get"),
  IssueController.getIssue
);


/**
 * @swagger
 * /{moduleCode}/issue/{issueId}/history:
 *   get:
 *     tags:
 *       - Issue
 *     summary: Get issue history
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue history retrieved successfully
 */
router.get(
  "/:issueId/history",
  [[uuid("issueId")]],
  validationMiddleware("Issue History", "Get"),
  IssueController.getIssueHistory
);


/**
 * @swagger
 * /{moduleCode}/issue/{id}/create-task:
 *   post:
 *     tags:
 *       - Issue
 *     summary: Create a task for an issue
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
 *               priority:
 *                 type: string
 *                 enum: ['low', 'medium', 'high', 'critical']
 *               due_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Task created successfully
 */
router.post(
  "/:id/create-task",
  [
    [
      uuid("id"),
      name("title"),
      description().optional({ checkFalsy: true }),
      enumValue("priority", ['low', 'medium', 'high', 'critical']),
      dateFuture("due_date")
    ],
  ],
  validationMiddleware("Task", "Create"),
  IssueController.createTaskForIssue
);


/**
 * @swagger
 * /{moduleCode}/issue/type/create:
 *   post:
 *     tags:
 *       - Issue
 *     summary: Create a new issue type
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
 *     responses:
 *       200:
 *         description: Issue type created successfully
 */
router.post(
  "/type/create",
  [
    [
      name(),
      description().optional(),
    ],
  ],
  validationMiddleware("Issue type", "Create"),
  IssueController.createIssueType
);

module.exports = router;
