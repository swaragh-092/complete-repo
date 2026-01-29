// Author: Gururaj
// Created: 8th July 2025
// Description: Controller for managing Organization Location.
// Version: 1.0.0
// Modified: 

const locationService = require('../../services/organization/organizationLocation.service');
const ResponseService = require('../../services/Response');
const { fieldPicker } = require("../../util/helper");

// create or update
exports.update = async (req, res) => {
  const thisAction = { usedFor: 'OrganizationLocation', action: 'update' };
  try {
    const { organizationId } = req.params;
    const allowedFields = ['country', 'state', 'city', 'pincode', 'timezone', 'lat', 'lng', 'street', 'address', 'district', "locale"];
    const data = fieldPicker(req, allowedFields);
    const result = await locationService.updateOrCreate({organizationId, data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating location:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getById = async (req, res) => {
  const thisAction = { usedFor: 'OrganizationLocation', action: 'Get' };
  try {
    const result = await locationService.getById({ organizationId: req.params.organizationId });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching location:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
