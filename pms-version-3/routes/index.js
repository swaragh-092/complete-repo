// Author: Gururaj
// Created: 14th oct 2025
// Description: all routs collected here.
// Version: 1.0.0
// Modified:

const express = require("express");
const router = express.Router();

const projectController = require("../controllers/project/project.controller");

// main routes
router.get("/dash", (req, res) => {
  res.status(200).json({ dash: "dashboard" });
});

// Register non-ID project routes here to prevent /:id wildcard conflicts
router.get(
  "/project/member-dashboard",
  projectController.getMemberDashboardData,
);

router.use("/project", require("./project/project.route"));
router.use("/project/member", require("./project/projectMember.route"));
router.use("/board", require("./project/board.route"));
router.use("/sprint", require("./project/sprint.route"));
router.use("/backlog", require("./project/backlog.route"));
router.use("/report", require("./project/report.route")); // Added Report route
router.use("/feature", require("./feature/feature.route"));
router.use("/issue", require("./issue/issue.route"));
router.use("/user-story", require("./userStory/userStory.route"));
router.use("/work-items", require("./issue/unifiedIssue.route"));
router.use("/notification", require("./notification/notification.route"));

module.exports = router;
