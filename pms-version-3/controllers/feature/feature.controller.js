// Author: Gururaj
// Created: 19th June 2025
// Description: To manage all the feature and department relation controller.
// Version: 1.0.0
// Modified:

const FeatureService = require("../../services/feature/feature.service");
const ResponseService = require("../../services/Response");
const { fieldPicker } = require("../../util/helper");

// Create Feature
// DEPRECATED: Use createProjectFeature instead - in v2, features must belong to a project
// This endpoint maintained for backward compatibility but requires projectId in query
exports.createFeature = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "create" };
  try {
    const allowedFileds = [
      "name",
      "description",
      { field: "departmentId", as: "department_id", source: "params" },
      { field: "projectId", as: "project_id", source: "body" },
      { field: "parentFeatureId", as: "parent_feature_id", source: "body" },
    ];
    const data = fieldPicker(req, allowedFileds);

    const result = await FeatureService.createFeature(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating feature:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Get All Features of department where not belongs to given project
exports.getAllFeaturesOfDepartmentProjectFilter = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "get all" };
  try {
    const result = await FeatureService.getAllFeaturesOfDepartment(req, {
      department_id: req.params.departmentId,
      query: req.query,
      project_id: req.params.projectId,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching features:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};
// Get All Features
exports.getAllFeaturesOfDepartment = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "get all" };
  try {
    const result = await FeatureService.getAllFeaturesOfDepartment(req, {
      department_id: req.params.departmentId,
      req,
      query: req.query,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching features:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Get Feature by ID
exports.getFeatureById = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "getOne" };
  try {
    const { featureId } = req.params;
    const result = await FeatureService.getFeature(req, featureId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching feature:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Update Feature
exports.updateFeature = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "update" };
  try {
    const allowedFileds = [
      "name",
      "description",
      "status",
      "priority",
      "assignee_id",
      { field: "parentFeatureId", as: "parent_feature_id", source: "body" },
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await FeatureService.updateFeature(
      req,
      req.params.featureId,
      data,
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating feature:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Approve / Reject Feature
exports.approveFeature = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "approve" };
  try {
    const { status, comments } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'.",
      });
    }
    const result = await FeatureService.approveFeature(
      req,
      req.params.featureId,
      { status, comments },
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Delete Feature
exports.deleteFeature = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "delete" };
  try {
    const { featureId } = req.params;
    const result = await FeatureService.deleteFeature(req, featureId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error deleting feature:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// add Feature To Project
exports.addFeatureToProject = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "Add to Project" };
  try {
    const data = (({ featureId, projectId }) => ({ featureId, projectId }))(
      req.params,
    );

    console.log(data);
    const result = await FeatureService.addFeatureToProject(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error deleting feature:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Create Feature under a project (v2)
exports.createProjectFeature = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "create" };
  try {
    const allowedFileds = [
      "name",
      "description",
      "priority",
      { field: "projectId", as: "project_id", source: "params" },
      { field: "departmentId", as: "department_id", source: "body" },
      { field: "parentFeatureId", as: "parent_feature_id", source: "body" },
      { field: "assignee_id", as: "assignee_id", source: "body" },
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await FeatureService.createFeature(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Get all features belonging to a project (v2 direct)
exports.getAllFeaturesByProject = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "Get" };
  try {
    const result = await FeatureService.getAllFeaturesByProject(req, {
      project_id: req.params.projectId,
      query: req.query,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

// Get all features of project (legacy via ProjectFeature junction)
exports.getAllFeaturesOfProject = async (req, res) => {
  const thisAction = { usedFor: "Feature", action: "Get" };
  try {
    const result = await FeatureService.getAllFeaturesOfProject(req, {
      project_id: req.params.projectId,
      query: req.query,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error Get feature:", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};
