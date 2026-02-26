// Author: Gururaj
// Created: 26th Feb 2026
// Description: Routes for DailyLog Reports (Analytics)
// Version: 1.0.0

const express = require("express");
const controller = require("../../controllers/dailylog/reports.controller");
const router = express.Router();

// Comprehensive User Project Report (Ongoing Projects)
router.get("/user-project-report", controller.userProjectReport);

// Daily Logs Excel Export
router.get("/export-excel", controller.exportToExcel);

// Fully Dynamic Daily Log Report
router.get("/report", controller.dailyLogReport);

// Productivity Summary (Planned vs Actual)
router.get("/productivity-summary", controller.productivitySummary);

// Status Distribution (Wrapup Only)
router.get("/status-distribution", controller.statusDistribution);

// Project Summary
router.get("/project-summary/:project_id", controller.projectSummary);

module.exports = router;
