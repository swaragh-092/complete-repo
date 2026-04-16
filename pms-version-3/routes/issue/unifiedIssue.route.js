// Author: Gururaj
// Created: 18th Mar 2026
// Description: Unified work-item router: single endpoint to create any work-item type (Epic, Story, Task, Bug).
// Version: 1.0.0
// Modified:

const express = require("express");
const router = express.Router();
const UnifiedIssueController = require("../../controllers/issue/unifiedIssue.controller");

// Create any work item (Epic, Story, Task, Bug)
router.post("/create", UnifiedIssueController.createWorkItem);

// List all work items for a project
router.get("/project/:projectId", UnifiedIssueController.getProjectWorkItems);

module.exports = router;
