// Author : Gururaj
// Created: 30th July 2025
// Description: Establishing the connection to database
// Version: 1.0.0
// Modified: 


const Sequelize = require('sequelize');
require('dotenv').config();

const config = {
        database: process.env.DB_NAME || "super_administrator" ,
        username: process.env.DB_USER || "postgres" ,
        password: process.env.DB_PASSWORD || "1234",
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        dialect: process.env.DB_TYPE || "postgres",
        timezone: process.env.DB_ZONE || "+05:30",
        logging: process.env.ENV?.toLowerCase() === "development", // Disabled logging for production for performance and security
}

console.log(config);

const sequelize = new Sequelize(config);


module.exports = sequelize;
