// Author: Gururaj
// Created: 29th May 2025
// Description: helper functions common used logics
// Version: 1.0.0
// Modified: chethan added success and failer function and commenting  validationeror(checkout validation middlware )  4th june 2025

const ResponseService = require("../services/Response");
const crypto = require("crypto");



// helper function to add context date of user while update or creating new records on database (auto update ip, http-agent, added by and modefied by)
exports.withContext = (req) => ({
  context: {
    user: req.user,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  },
});


/**
 * Dynamically picks fields from req (body, params, query, etc.)
 * Supports mixed syntax: strings (default: body) or detailed objects
 *
 * @param {Object} req - Express request object
 * @param {Array<string | { field: string, source?: string, as?: string }>} rules
 * @returns {Object} Picked key-value pairs
 */
function fieldPicker(req, rules = []) {
  const result = {};

  for (const item of rules) {
    // Normalize to object form
    const rule = typeof item === 'string'
      ? { field: item, source: 'body', as: item }
      : { source: 'body', as: item.field, ...item };

    const { field, source, as } = rule;

    if (req[source] && Object.prototype.hasOwnProperty.call(req[source], field)) {
      result[as] = req[source][field];
    }
  }

  return result;
}

exports.fieldPicker = fieldPicker;


// Standard 500 error response
/**
 *
 * @param {*} error
 * @param {*} entity
 * @param {*} action
 * @returns
 */
exports.failure = (error, entity = null, action = null, message = null) => {
  return (req, res, next) => {
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      usedFor: entity,
      action,
      errors: [error],
      message: message || error.message || "Internal Server Error",
    });
  };
};

// Standard success response with flexible status
/**
 *
 * @param {*} data
 * @param {*} entity
 * @param {*} action
 * @param {*} status
 * @returns
 */
exports.success = (data = null, entity = null, action = null, status = 200) => {

  return (req, res, next) => {
    return ResponseService.apiResponse({
      res,
      success: true,
      status,
      usedFor: entity,
      action,
      data,
    });
  };
};

exports.tokenGenerate = (lenght) => {
  const buffer = crypto.randomBytes(lenght);
  const token = buffer.toString("hex");

  return token;
};
