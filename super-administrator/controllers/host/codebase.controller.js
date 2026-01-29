// Author : Gururaj
// Created: 30th July 2025
// Description: create, upadte or get codebase details of organization for module (controller)
// Version: 1.0.0
// Modified: 

const codebaseService = require('../../services/host/codebase.service');
const ResponseService = require('../../services/Response');
const { fieldPicker } = require('../../util/helper');

exports.createOrUpdate = async (req, res) => {
  const thisAction = { usedFor: 'Codebase', action: 'Update' };
  try {
    const allowedFields = [ 'deploy_target', {field : "organizationId", as : "organization_id", source : "params"}, {field : "moduleId", as : "module_id", source : "params"}, "is_active"  ];
    const data = fieldPicker(req, allowedFields) ;

    const result = await codebaseService.createOrUpdate({ data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating/updating codebase:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.get = async (req, res) => {
  const thisAction = { usedFor: 'Codebase', action: 'Get' };
  try {
    const organization_id = req.params.organizationId;
    const module_id = req.params.moduleId;
    const result = await codebaseService.get({organization_id, module_id});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching codebase:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getAll = async (req, res) => {
  const thisAction = { usedFor: 'Codebase', action: 'Get' };
  try {
    const organization_id = req.params.organizationId;
    const result = await codebaseService.getAll({organization_id});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching codebase:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

