// Author : Gururaj
// Created: 15th July 2025
// Description: create, upadte or get domain details of organization (controller)
// Version: 1.0.0
// Modified: 

const dnsService = require('../../services/host/dnsMapping.service');
const ResponseService = require('../../services/Response');
const { fieldPicker } = require("../../util/helper");


// create and update
exports.update = async (req, res) => {
  const thisAction = { usedFor: 'DNSMapping', action: 'update' };
  try {
    const { organizationId } = req.params;
    const allowedFields = ['sub_domain', 'ip_address', 'verified', 'dns_provider'];
    const data = fieldPicker(req, allowedFields);
    const result = await dnsService.updateOrCreate({ organizationId, data, req });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error updating DNS mapping:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};

exports.getById = async (req, res) => {
  const thisAction = { usedFor: 'DNSMapping', action: 'get' };
  try {
    const result = await dnsService.getById({ organizationId: req.params.organizationId });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    console.error("Error fetching DNS mapping:", err);
    return ResponseService.apiResponse({ res, success: false, status: 500, ...thisAction });
  }
};
