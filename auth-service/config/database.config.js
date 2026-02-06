/**
 * Sequelize CLI Configuration
 * 
 * This file is used by sequelize-cli for migrations and seeders.
 * It reads from environment variables in Docker, with fallbacks for local development.
 */
require('dotenv').config();

const config = {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'authzotion_db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,
    dialectOptions: process.env.DB_SSL === 'true' ? {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    } : {},
};

module.exports = {
    development: config,
    test: config,
    production: config,
};
