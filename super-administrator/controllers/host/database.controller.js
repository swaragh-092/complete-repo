// Author : Gururaj
// Created: 30th July 2025
// Description: create, upadte or get database details of organization for module (controller)
// Version: 1.0.0
// Modified: 

const databaseService = require('../../services/host/database.service');
const ResponseService = require('../../services/Response');
const { fieldPicker } = require('../../util/helper');

exports.createOrUpdate = async (req, res) => {
  const thisAction = { usedFor: 'Database', action: 'Update' };
  try {
    const allowedFields = [
      'key_name',
      { field: "organizationId", as: "organization_id", source: "params" },
      { field: "moduleVersionId", as: "module_version_id", source: "params" }
    ];
    const data = fieldPicker(req, allowedFields);

    const result = await databaseService.createOrUpdate({ data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error creating/updating database:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.get = async (req, res) => {
  const thisAction = { usedFor: 'Database', action: 'Get' };
  try {
    const organization_id = req.params.organizationId;
    const module_version_id = req.params.moduleVersionId;
    const result = await databaseService.get({module_version_id, organization_id});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching database:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.get = async (req, res) => {
  const thisAction = { usedFor: 'Database', action: 'Get' };
  try {
    const organization_id = req.params.organizationId;
    const result = await databaseService.getAll({organization_id});
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching database:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
