'use strict';

require('dotenv').config();

const requiredEnvVars = [
    'SERVICE_SECRET',
    'DB_HOST',
    'DB_PASSWORD',
];

// Validate required environment variables
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}

module.exports = {
    // Server
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT, 10) || 4011,

    // SMTP — Primary
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    FROM_EMAIL: process.env.FROM_EMAIL,

    // SMTP — Backup (failover)
    SMTP_BACKUP_HOST: process.env.SMTP_BACKUP_HOST,
    SMTP_BACKUP_PORT: parseInt(process.env.SMTP_BACKUP_PORT, 10) || 587,
    SMTP_BACKUP_USER: process.env.SMTP_BACKUP_USER,
    SMTP_BACKUP_PASS: process.env.SMTP_BACKUP_PASS,

    // Application
    APP_NAME: process.env.APP_NAME || 'Email Service',

    // Security
    SERVICE_SECRET: process.env.SERVICE_SECRET,

    // SMTP Pool
    MAXCONNECTIONS: parseInt(process.env.MAXCONNECTIONS, 10) || 5,
    MAXMESSAGES: parseInt(process.env.MAXMESSAGES, 10) || 100,
    POOL: process.env.POOL === 'true',

    // Database
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
    DB_NAME: process.env.DB_NAME || 'email_service',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD,

    // Redis (for BullMQ)
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,

    // Queue
    QUEUE_MAX_ATTEMPTS: parseInt(process.env.QUEUE_MAX_ATTEMPTS, 10) || 3,

    // Cleanup
    LOG_RETENTION_DAYS: parseInt(process.env.LOG_RETENTION_DAYS, 10) || 90,

    // Scheduling
    MAX_DELAY_MS: parseInt(process.env.MAX_DELAY_MS, 10) || 7 * 24 * 60 * 60 * 1000, // 7 days max

    // Derived
    isProduction: process.env.NODE_ENV === 'production',
};
