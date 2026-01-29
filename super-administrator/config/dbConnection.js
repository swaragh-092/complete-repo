// Author : Gururaj
// Created: 30th July 2025
// Description: Establishing the connection to database
// Version: 1.0.0
// Modified: 


const Sequelize = require('sequelize');
require('dotenv').config();

const config = {
        database: process.env.DB_NAME ,
        username: process.env.DB_USER ,
        password: process.env.DB_PASSWORD ,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_TYPE,
        timezone: process.env.DB_ZONE,
        logging: process.env.ENV?.toLowerCase() === "development", // Disabled logging for production for performance and security
}

const sequelize = new Sequelize(config);


module.exports = sequelize;
