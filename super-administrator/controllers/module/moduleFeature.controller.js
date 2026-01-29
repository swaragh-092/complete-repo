// Author: Gururaj
// Created: 8th July 2025
// Description: Controller for managing Module Features.
// Version: 1.0.0

const featureService = require('../../services/module/moduleFeature.service');
const ResponseService = require('../../services/Response');
const { fieldPicker } = require("../../util/helper");

exports.create = async (req, res) => {
  const thisAction = { usedFor: 'ModuleFeature', action: 'create' };
  try {
    const allowedFields = [{field : 'moduleVersionId', source : "params", as : "module_version_id"}, 'code', 'name', 'description'];
    const data = fieldPicker(req, allowedFields);

    const result = await featureService.create({ data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating feature:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.update = async (req, res) => {
  const thisAction = { usedFor: 'ModuleFeature', action: 'update' };
  try {
    const { id } = req.params;
    const allowedFields = ['module_id', 'code', 'name', 'description'];
    const data = fieldPicker(req, allowedFields);
    const result = await featureService.update({ id, data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating feature:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

// only for enable or dissable feature
exports.editActive = async (req, res) => {
  const thisAction = { usedFor: 'ModuleFeature', action: 'update' };
  try {
    const { id } = req.params;
    const is_active = req.body.state === "active";
    const result = await featureService.update({ id, data: { is_active }, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating feature:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};


exports.getById = async (req, res) => {
  const thisAction = { usedFor: 'ModuleFeature', action: 'get' };
  try {
    const result = await featureService.getById(req.params.id);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching feature:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getAll = async (req, res) => {
  const thisAction = { usedFor: 'ModuleFeature', action: 'getAll' };
  try {
    const module_id = req.params.moduleId;
    const result = await featureService.getAll(module_id,req.query);

    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error listing features:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.delete = async (req, res) => {
  const thisAction = { usedFor: 'ModuleFeature', action: 'delete' };
  try {
    const result = await featureService.delete({id : req.params.id, req});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error deleting feature:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
