'use strict';

const sequelize = require('../config/database');
const defineEmailLog = require('./email_logs');
const logger = require('../utils/logger');
const path = require('path');

// Initialize model
const EmailLog = defineEmailLog(sequelize);

/**
 * Sync database tables
 * - Development: uses sync({ alter: true }) for quick iteration
 * - Production: runs pending migrations via sequelize-cli (safe, versioned)
 */
async function syncDatabase() {
    try {
        await sequelize.authenticate();
        logger.info('✅ Database connection established');

        const isDev = process.env.NODE_ENV !== 'production';

        if (isDev) {
            // Development: auto-alter tables to match models
            await sequelize.sync({ alter: true });
            logger.info('✅ Database tables synced (mode: alter)');
        } else {
            // Production: run pending migrations
            const { Umzug, SequelizeStorage } = require('umzug');
            const { Sequelize } = require('sequelize');

            const umzug = new Umzug({
                migrations: {
                    glob: path.join(__dirname, '../migrations/*.js'),
                    resolve: ({ name, path: migrationPath, context: queryInterface }) => {
                        const migration = require(migrationPath);
                        return {
                            name,
                            up: async () => migration.up(queryInterface, Sequelize),
                            down: async () => migration.down(queryInterface, Sequelize),
                        };
                    },
                },
                context: sequelize.getQueryInterface(),
                storage: new SequelizeStorage({ sequelize }),
                logger: {
                    info: (msg) => logger.info(msg),
                    warn: (msg) => logger.warn(msg),
                    error: (msg) => logger.error(msg),
                    debug: (msg) => logger.debug(msg),
                },
            });

            const pending = await umzug.pending();
            if (pending.length > 0) {
                logger.info(`📦 Running ${pending.length} pending migration(s)...`);
                await umzug.up();
                logger.info('✅ Migrations completed');
            } else {
                logger.info('✅ Database up to date (no pending migrations)');
            }
        }
    } catch (error) {
        logger.error('❌ Database sync failed:', { error: error.message });
        throw error;
    }
}

module.exports = {
    sequelize,
    EmailLog,
    syncDatabase,
};
