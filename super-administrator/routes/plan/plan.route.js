// Author: Gururaj
// Created: 8th July 2025
// Description: Routes for All plan related APIs.
// Version: 1.0.0

const express = require("express");
const router = express.Router();

const {  requiredEnum, price, name, uuid, manyUuids, boolean, integer } = require("../../services/validation");
const validationMiddleware = require("../../middleware/validation.middleware");

// Controllers
const PlanController = require("../../controllers/plan/plan.controller");
const { PLAN_TYPE, BILLING_CYCLE } = require("../../util/constant");


// ==== PLAN ROUTES ====
router.post("/", [
    requiredEnum("type", PLAN_TYPE), 
    requiredEnum("billing_cycle", BILLING_CYCLE), 
    price(), 
    name(), 
    integer("pause_days").optional(), 
    boolean("allow_trial").optional(), 
    boolean("is_public").optional(), 
] , validationMiddleware("Plan", "Create"), PlanController.create);

router.put("/:id", [
    uuid(), 
    requiredEnum("billing_cycle", BILLING_CYCLE).optional(), 
    price().optional(), 
    name().optional(),
    integer("pause_days").optional(), 
    boolean("allow_trial").optional(), 
    boolean("is_active").optional(),
    boolean("is_public").optional(), 
], validationMiddleware("Plan", "Update"), PlanController.update);
router.delete("/:id",[uuid()], validationMiddleware("Plan", "Delete"), PlanController.delete);

router.get("/:id", [uuid()], validationMiddleware("Plan", "Get"), PlanController.getById);
router.get("/", PlanController.getAll);

// add and remove projects to the plan with version.

router.post("/:id/projects", [uuid(), manyUuids("project_version_ids", "body")], validationMiddleware("Plan", "Update"), PlanController.addProjectsToPlan );
router.delete("/:id/projects", [uuid(), manyUuids("project_version_ids", "body")], validationMiddleware("Plan", "Update"), PlanController.removeProjectsFromPlan );

module.exports = router;
