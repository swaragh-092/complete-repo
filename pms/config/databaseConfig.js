// Author: Gururaj
// Created: 23rd January 2026
// Description: manage dynamic database connection for multi-tenant architecture
// Version: 1.0.0


const { Sequelize } = require("sequelize");
const initModels = require("../models/initModels");

const connections = {};

const {DATABASE_DETAILS} = require('./config');

async function getTenantSequelize(connectionId) {
  if (connections[connectionId]) {
    return connections[connectionId];
  }
  const connection = DATABASE_DETAILS[connectionId];

  console.log("Database connection details:", connection);

  if (!connection) {
    throw new Error(`Database configuration not found.`);
  }


  const sequelize = new Sequelize(
    connection.name,
    connection.user,
    connection.password,
    {
      host: connection.host,
      dialect: connection.type,
      pool: { max: 10, min: 0, idle: 10000 },
      logging: process.env.NODE_ENV === "development"? (msg) => console.log(`[Sequelize] ${msg}`): false,
    }
  );

  await sequelize.authenticate();

  const modules = initModels(sequelize)

  connections[connectionId] = {sequelize, modules};
  return sequelize;
}

module.exports = {
  getTenantSequelize,
};


// const connectionId = req.tenantConfig?.data?.database?.key_name || "default-shared";