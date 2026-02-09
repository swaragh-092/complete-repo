'use strict';

const { createLogger, format, transports } = require('winston');
const config = require('../config');

const logger = createLogger({
    level: config.isProduction ? 'info' : 'debug',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.json()
    ),
    defaultMeta: { service: 'email-service' },
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                    return `[${timestamp}] ${level}: ${message}${metaStr}`;
                })
            ),
        }),
    ],
});

// Add file transport in production
if (config.isProduction) {
    logger.add(
        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
        })
    );
    logger.add(
        new transports.File({
            filename: 'logs/combined.log',
        })
    );
}

module.exports = logger;
