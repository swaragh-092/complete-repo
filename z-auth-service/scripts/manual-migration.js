const { sequelize, Sequelize } = require('../config/database');
const migration = require('../migrations/20260128000000-add-org-fields');

async function runMigration() {
    console.log('🚀 Starting manual migration...');
    try {
        const queryInterface = sequelize.getQueryInterface();
        await migration.up(queryInterface, Sequelize);
        console.log('✅ Manual migration executed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Manual migration failed:', error);
        process.exit(1);
    }
}

runMigration();
