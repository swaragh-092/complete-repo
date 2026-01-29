// Author: Gururaj
// Created: 14th oct 2025
// Description: all routs collected here.
// Version: 1.0.0
// Modified:


const express = require('express');
const router = express.Router();

// main routes
router.get("/dash", (req, res) => {
  res.status(200).json({ dash: "dashboard" });
});


router.use("/project", require("./project/project.route"));
router.use("/project/member", require("./project/projectMember.route"));
router.use("/project/task", require("./task/task.route"));
router.use("/project/dependency-task", require("./task/dependencyTask.route"));
router.use("/project/helper-task", require("./task/helperTask.route"));
router.use("/feature", require("./feature/feature.route"));
router.use("/check-list", require("./feature/checklist.route"));
router.use("/issue", require("./issue/issue.route"));
router.use("/dailylog", require("./dailylog/dailyliog.route"));
router.use("/work", require("./task/taskWorkFlow.route"));
router.use("/notification", require("./notification/notification.route"));



module.exports = router;

