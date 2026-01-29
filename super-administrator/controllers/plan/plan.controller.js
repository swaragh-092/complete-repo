// Author : Gururaj
// Created: 30th July 2025
// Description: controller for plan 
// Version: 1.0.0
// Modified: 


const PlanService = require("../../services/plan/plan.service");
const ResponseService = require("../../services/Response");
const { fieldPicker } = require("../../util/helper");

exports.create = async (req, res) => {
  const thisAction = { usedFor: 'Plan', action: 'Create' };
  try {
    const allowedFields = ["type", "billing_cycle", "price", "name", "pause_days", "allow_trial", "is_public"];
    const data = fieldPicker(req, allowedFields);
    const result = await PlanService.create({ req, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err){
    console.error("Error listing organizations:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.update = async (req, res) => {
  const thisAction = { usedFor: 'Plan', action: 'Update' };
  try {
    const allowedFields = ["billing_cycle", "price", "name", "allow_pause", "is_active",  "allow_trial", "is_public"];
    const data = fieldPicker(req, allowedFields);
    const result = await PlanService.update({ req, id: req.params.id, data });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err){
    console.error("Error listing organizations:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.delete = async (req, res) => {
  const thisAction = { usedFor: 'Plan', action: 'Delete' };
  try {
    const result = await PlanService.delete({id : req.params.id, req});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err){
    console.error("Error listing organizations:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getById = async (req, res) => {
  const thisAction = { usedFor: 'Plan', action: 'Fetch' };
  try {
    const result = await PlanService.getById(req.params.id);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error listing organizations:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getAll = async (req, res) => {
  const thisAction = { usedFor: 'Plan', action: 'Fetch' };
  try {
    const result = await PlanService.getAll(req.query);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error listing organizations:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};


exports.addProjectsToPlan = async (req, res) => {
  const thisAction = { usedFor: 'Plan', action: 'Update' };
  try {
    const id = req.params.id;
    const projectVersionIds = req.body.project_version_ids;
    const result = await PlanService.addProjectsToPlan({id, projectVersionIds, req});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error listing organizations:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
exports.removeProjectsFromPlan = async (req, res) => {
  const thisAction = { usedFor: 'Plan', action: 'Update' };
  try {
    const id = req.params.id;
    const projectVersionIds = req.body.project_version_ids;
    const result = await PlanService.removeProjectsFromPlan({id, projectVersionIds, req});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error listing organizations:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};



