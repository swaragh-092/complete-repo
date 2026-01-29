// Author: Gururaj
// Created: 18th Sept 2025
// Description: To manage all the checklist and feature relation controller.
// Version: 1.0.0
// Modified:

const ChecklistService = require('../../services/feature/checklist.service');
const ResponseService = require('../../services/Response');
const { fieldPicker } = require('../../util/helper');

// Create Checklist
exports.createChecklist = async (req, res) => {
  const thisAction = { usedFor: "Checklist", action: "create" };
  try {
    const allowedFields = [
      "title",
      "description",
      { field: "featureId", as: "feature_id", source: "params" },
    ];
    const data = fieldPicker(req, allowedFields);
    
    const result = await ChecklistService.createChecklistItem(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating checklist:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Get All Checklists of Feature
exports.getAllChecklistsOfFeature = async (req, res) => {
  const thisAction = { usedFor: "Checklist", action: "get all" };
  try {
    const result = await ChecklistService.getAllChecklistsOfFeature(
      req,
      {
        feature_id: req.params.featureId,
        query : req.params
      }
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching checklists:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Get Checklist by ID
exports.getChecklistById = async (req, res) => {
  const thisAction = { usedFor: "Checklist", action: "fetch" };
  try {
    const { checklistId } = req.params;
    const result = await ChecklistService.getChecklist(req, checklistId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching checklist:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Update Checklist
exports.updateChecklist = async (req, res) => {
  const thisAction = { usedFor: "Checklist", action: "update" };
  try {
    const allowedFields = ["title", "description",];
    const data = fieldPicker(req, allowedFields);

    const result = await ChecklistService.updateChecklist(req, req.params.checklistId, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating checklist:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Delete Checklist
exports.deleteChecklist = async (req, res) => {
  const thisAction = { usedFor: "Checklist", action: "delete" };
  try {
    const { checklistId } = req.params;
    const result = await ChecklistService.deleteChecklist(req, checklistId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error deleting checklist:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};
