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

router.get("/types", IssueController.getIssueTypes);

// Create Issue
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
      enumValue("priority", ["low", "medium", "high", "critical"],).optional(),
    ],
  ],
  validationMiddleware("Issue", "create"),
  IssueController.create
);

// Accept Issue
router.put(
  "/:id/accept",
  [[uuid("id")]],
  validationMiddleware("Issue", "accept"),
  IssueController.accept
);

// reject Issue
router.put(
  "/:id/reject",
  [
    uuid("id"),
    description("reject_reason"),
  ],
  validationMiddleware("Issue", "reject"),
  IssueController.reject
);

// Reassign Issue
router.put(
  "/:id/reassign/:toDepartmentid",
  [
    [
      uuid("id"),
      uuid("toDepartmentid"),
    ],
  ],
  validationMiddleware("Issue", "reassign"),
  IssueController.reassign
);

// Resolve Issue
router.put(
  "/:id/resolve",
  [[uuid("id")]],
  validationMiddleware("Issue", "resolve"),
  IssueController.resolve
);

// finilize Issue
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
router.get(
  "/project/:projectId/issue/:issueId",
  [[uuid("projectId"), uuid("issueId")]],
  validationMiddleware("Issue", "listByProject"),
  IssueController.listByProject
);
// List issues by project
router.get(
  "/project/:projectId",
  [[uuid("projectId")]],
  validationMiddleware("Issue", "listByProject"),
  IssueController.listByProject
);


// get issue
router.get(
  "/:issueId",
  [[uuid("issueId")]],
  validationMiddleware("Issue", "Get"),
  IssueController.getIssue
);

// get issue history
router.get(
  "/:issueId/history",
  [[uuid("issueId")]],
  validationMiddleware("Issue History", "Get"),
  IssueController.getIssueHistory
);


router.post('/:id/create-task', [
  [
    uuid("id"),
    name("title"),
    description().optional({ checkFalsy: true }),
    enumValue( "priority", ['low', 'medium', 'high', 'critical'] ),
    dateFuture("due_date" )
  ],
], validationMiddleware("Task", "Create"), IssueController.createTaskForIssue);

router.post('/type/create', [
  [
    name(),
    description().optional(),
  ],
], validationMiddleware("Issue type", "Create"), IssueController.createIssueType);





module.exports = router;
