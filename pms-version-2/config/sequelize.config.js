// Author: Gururaj
// Created: 16th May 2025
// Description: Sequelize CLI configuration for database migrations and seeders.
// Version: 1.0.0
// Modified:

module.exports = {
  development: {
    username: "postgres",
    password: "1234",
    database: "pms_v2",
    host: "localhost",
    port: 5411, // or whatever port you exposed
    dialect: "postgres",
    logging: false,
  },
  test: {
    username: "postgres",
    password: "1234",
    database: "pms_v2",
    host: "localhost",
    port: 5411, // or whatever port you exposed
    dialect: "postgres",
    logging: false,
  },
  production: {
    username: "postgres",
    password: "1234",
    database: "pms_v2",
    host: "db-pms",
    dialect: "postgres",
    logging: false,
  }
};
