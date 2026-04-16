// Author: Gururaj
// Created: 29th May 2025
// Description: helper functions common used logics
// Version: 1.0.0
// Modified: chethan added success and failer function and commenting  validationeror(checkout validation middlware )  4th june 2025

const { validationResult } = require("express-validator");
const ResponseService = require("../services/Response");
const crypto = require("crypto");
const paginate = require("../util/pagination");
const { queryWithLogAudit } = require("../services/auditLog.service");

// helper function to get access version of user
exports.getAccessVersion = (userWithRole) => {
  return (
    (userWithRole.role.is_role_access
      ? userWithRole.role.access_version
      : userWithRole.access_version) +
    "_" +
    String(userWithRole.id)
  );
};

// helper function to add context date of user while update or creating new records on database (auto update ip, http-agent, added by and modefied by)

const withContext = (req) => ({
  context: {
    user: req.user,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    organization_id : req.organization_id,
  },
});
exports.withContext = withContext;

// check for any validations errors and send response
exports.validationsErrors = (req, res, thisAction) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 422,
      ...thisAction,
      errors: validationErrors.array(),
    });
  }

  // utils/responseHelpers.js
  const ResponseService = require("../services/Response");
};

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
  // console.log('inside succes');

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


const giveValicationErrorFormal = (error) => {
  const errors = Object.keys(error.fields).map((field) => ({
        type: "field",
        msg: `${field} must be unique`,
        path: field,
        value: error.fields[field],
        location: "body",
      }));

      return errors;
}

exports.giveValicationErrorFormal = giveValicationErrorFormal;


const sendErrorResponse =  (thisAction, error, res) => {
  console.log(error);
  console.error("Error "+ thisAction.action + " " + thisAction.usedFor + " : ", error.message);
  return ResponseService.apiResponse({  res,  success: false,  status:  500,  ...thisAction,});
}
exports.sendErrorResponse = sendErrorResponse;


const paginateHelperFunction = async ( {model, whereFilters = {}, query ={}, extrasInQuery = {}, orderQuery = {}} ) => {
  const {
    page,
    perPage,
    sortField = "created_at",
    sortOrder = "desc",
    searchText = "",
    searchField = "",
    searchOperator = "",
  } = query;

  const result = await paginate(
    ({ offset, limit, sortField, sortOrder, where }) =>
      model.findAndCountAll({
        where: { ...whereFilters, ...where },
        ...extrasInQuery,
        offset,
        limit,
        order: orderQuery.order 
          ? orderQuery.order 
          : [[sortField, sortOrder]],
      }),
    page,
    perPage,
    sortField,
    sortOrder,
    searchText,
    searchField,
    searchOperator,
    model,
  );
  return result;
};
exports.paginateHelperFunction = paginateHelperFunction;

const auditLogCreateHelperFunction = async ({ model, data, req }) => {
  const query = async (t) => {
    return await model.create(data, {
      ...withContext(req),
      transaction: t,
    });
  };

  const result = await queryWithLogAudit({
    req,
    action: "create",
    queryCallBack: query,
    updated_columns: Object.keys(data),
  });

  return result;
};

exports.auditLogCreateHelperFunction = auditLogCreateHelperFunction;


const auditLogBulkCreateHelperFunction = async ({ model, data, req }) => {
  const query = async (t) => {
    return await model.bulkCreate(data, {
      ...withContext(req),
      transaction: t,
    });
  };

  const result = await queryWithLogAudit({
    req,
    action: "bulk_create",
    queryCallBack: query,
    updated_columns: Object.keys(data[0]),
  });

  return result;
};

exports.auditLogBulkCreateHelperFunction = auditLogBulkCreateHelperFunction;


const auditLogUpdateHelperFunction = async ({ model, data, req }) => {
  const query = async (t) => {
    return await model.update(data, {
      ...withContext(req),
      transaction: t,
    });
  };

  const result = await queryWithLogAudit({
    req,
    action: "update",
    queryCallBack: query,
    updated_columns: Object.keys(data),
  });

  return result;
};
exports.auditLogUpdateHelperFunction = auditLogUpdateHelperFunction;


const auditLogDeleteHelperFunction = async ({ model, req }) => {
  const query = async (t) => {
    return await model.destroy({
      ...withContext(req),
      transaction: t,
    });
  };

  const result = await queryWithLogAudit({
    req,
    action: "delete",
    queryCallBack: query,
  });

  return result;
};
exports.auditLogDeleteHelperFunction = auditLogDeleteHelperFunction;



