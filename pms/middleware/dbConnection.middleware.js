// Author: Gururaj
// Created: 23rd January 2026
// Description: manage dynamic database connection for multi-tenant architecture
// Version: 1.0.0


const {
  getTenantSequelize,
} = require("../config/databaseConfig");
const ResponseService = require("../services/Response");
const { sendErrorResponse } = require("../util/helper");

async function getTenantDB(req, res, next) {
  try {
    const connectionId = req.tenantConfig?.data?.database?.key_name || "default-shared";

    const database = await getTenantSequelize(connectionId);

    req.sequelize = database.sequelize;
    req.db = database.modules;

    next();
  } catch (err) {
    console.error("Database connection error:", err);

    return ResponseService.apiResponse({
        res,
        success : false,
        status : 500,
        message : err.message || "Database connection error",
      }
    );
  }
}

module.exports = getTenantDB;
