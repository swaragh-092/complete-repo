'use strict';

/**
 * Safety net: Add LOCALHOST to audit_logs environment enum
 * Even though code sanitizes the value, this prevents DB errors
 * if raw values slip through edge cases.
 */
module.exports = {
    up: async (queryInterface) => {
        // ADD VALUE IF NOT EXISTS is safe to run multiple times
        await queryInterface.sequelize.query(
            "ALTER TYPE enum_audit_logs_environment ADD VALUE IF NOT EXISTS 'LOCALHOST';"
        );
    },

    down: async () => {
        // PostgreSQL does not support removing values from enums
        // This is intentionally a no-op
        console.log('Cannot remove enum value from PostgreSQL - no-op');
    },
};
