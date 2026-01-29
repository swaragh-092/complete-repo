// Author: Gururaj
// Created: 7th July 2025
// Description: Controller for managing Module Registry.
// Version: 1.0.0

const moduleService = require('../../services/module/module.service');
const ResponseService = require('../../services/Response');
const {fieldPicker} = require("../../util/helper");


exports.create = async (req, res) => {
  const thisAction = { usedFor: 'Module', action: 'create' };
  try {
    const allowedFields = ['code', 'name', 'description', 'docker_container', "version_discription", "port"];
    const data = fieldPicker(req, allowedFields);
    const result = await moduleService.create({ data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating module:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
exports.createVersion = async (req, res) => {
  const thisAction = { usedFor: 'Module version', action: 'create' };
  try {
    const allowedFields = ['description', 'docker_container', "port", {field : "id", source : "params", as : "id"}];
    const data = fieldPicker(req, allowedFields);
    const result = await moduleService.createVersion({ data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating module:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.update = async (req, res) => {
  const thisAction = { usedFor: 'Module', action: 'update' };
  try {
    const { id } = req.params;
    const allowedFields = ['code', 'name', 'description'];
    const data = fieldPicker(req, allowedFields);
    const result = await moduleService.update({ id, data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating module:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.updateVersion = async (req, res) => {
  const thisAction = { usedFor: 'Module version data', action: 'update' };
  try {
    const allowedFields = ['code', 'name', 'description', 'docker_container', "port", {field : "id", source : "params", as : "id"}, {field : "versionId", source : "params", as : "version_id"}, ];
    const data = fieldPicker(req, allowedFields);
    const result = await moduleService.updateVersion({ data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating module:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

// only to enable or dissable the module
exports.editActive = async (req, res) => {
  const thisAction = { usedFor: 'Module', action: 'update' };
  try {
    const { id } = req.params;
    const is_active = req.body.state === "active";
    const result = await moduleService.update({ id, data: {is_active}, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating module:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getById = async (req, res) => {
  const thisAction = { usedFor: 'Module', action: 'Get' };
  try {
    const result = await moduleService.getById(req.params.id);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching module:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};


exports.getAll = async (req, res) => {
  const thisAction = { usedFor: 'Module', action: 'getAll' };
  try {
    const result = await moduleService.getAll(req.query);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error listing modules:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};


exports.delete = async (req, res) => {
  const thisAction = { usedFor: 'Module', action: 'delete' };
  try {
    const result = await moduleService.delete({id : req.params.id, req});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error deleting module:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.deleteVersion = async (req, res) => {
  const thisAction = { usedFor: 'Module', action: 'delete' };
  try {
    const result = await moduleService.deleteVersion({id : req.params.versionId, req});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error deleting module:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
