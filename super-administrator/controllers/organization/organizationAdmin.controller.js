// Author: Gururaj
// Created: 8th July 2025
// Description: Controller for managing Organization Admins
// Version: 1.0.0

const orgAdminService = require('../../services//organization/organizationAdmin.service');
const ResponseService = require('../../services/Response');
const { fieldPicker } = require("../../util/helper");

exports.create = async (req, res) => {
  const thisAction = { usedFor: 'OrganizationAdmin', action: 'create' };
  try {
    const allowedFields = [{field : "organizationId", source : "params", as : "organization_id"}, "keycloak_user_id"];
    const data = fieldPicker(req, allowedFields);
    const result = await orgAdminService.create({ data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating org admin:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

// only for enable or dissable 
exports.editActive = async (req, res) => {
  const thisAction = { usedFor: 'OrganizationAdmin', action: 'update' };
  try {
    const { id } = req.params;
    const is_active = req.body.state === "active";
    const result = await orgAdminService.update({ id, data: { is_active }, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error changing active status:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getById = async (req, res) => {
  const thisAction = { usedFor: 'OrganizationAdmin', action: 'get' };
  try {
    const result = await orgAdminService.getById(req.params.id);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching org admin:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getAll = async (req, res) => {
  const thisAction = { usedFor: 'OrganizationAdmin', action: 'getAll' };
  try {
    const organizationId = req.params.organizationId
    const result = await orgAdminService.getAll(organizationId, req.query);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error listing org admins:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.delete = async (req, res) => {
  const thisAction = { usedFor: 'OrganizationAdmin', action: 'delete' };
  try {
    const result = await orgAdminService.delete({id : req.params.id, req});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error deleting org admin:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
