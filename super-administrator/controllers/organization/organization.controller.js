// Author: Gururaj
// Created: 4th July 2025
// Description: Controller for managing Organizations.
// Version: 1.0.0


const OrganizationService = require('../../services/organization/organization.service');
const ResponseService = require('../../services/Response');
const { fieldPicker } = require('../../util/helper');

exports.create = async (req, res) => {
  const thisAction = { usedFor: 'Organization', action: 'create' };
  try {
    const allowedFields = ['name', 'state', 'description', 'owner_keycloak_id', "email", "phone"];
    const data = fieldPicker(req, allowedFields);

    const result = await OrganizationService.create({req, data});

    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating organization:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

// Actual update for user (name and description only)
exports.updateBasicInfo = async (req, res) => {
  const thisAction = { usedFor: 'Organization', action: 'update' };
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const result = await OrganizationService.update({id, data : { name, description }, req});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error('Error updating organization:', err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

// Admin-only: update state of organization ("active", "paused", "suspended", "inactive")
exports.updateTrialAndState = async (req, res) => {
  const thisAction = { usedFor: 'Organization', action: 'update Status' };
  try {
    const { id } = req.params;
    const { state } = req.body;

    const result = await OrganizationService.update({id, data : {state}, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error('Error updating trial status:', err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getById = async (req, res) => {
  const thisAction = { usedFor: 'Organization', action: 'getById' };
  try {
    const result = await OrganizationService.getById(req.params.id);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching organization:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getAll = async (req, res) => {
  const thisAction = { usedFor: 'Organization', action: 'getAll' };
  try {
    const result = await OrganizationService.getAll(req.query);

    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error listing organizations:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.delete = async (req, res) => {
  const thisAction = { usedFor: 'Organization', action: 'delete' };
  try {
    const result = await OrganizationService.delete({id : req.params.id, req});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error deleting organization:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
