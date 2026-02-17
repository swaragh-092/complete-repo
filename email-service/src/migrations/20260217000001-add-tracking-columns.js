'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Add tracking columns
            await queryInterface.addColumn('email_logs', 'scope', {
                type: Sequelize.STRING(20),
                allowNull: false,
                defaultValue: 'system',
            }, { transaction });

            await queryInterface.addColumn('email_logs', 'org_id', {
                type: Sequelize.UUID,
                allowNull: true,
            }, { transaction });

            await queryInterface.addColumn('email_logs', 'user_id', {
                type: Sequelize.UUID,
                allowNull: true,
            }, { transaction });

            await queryInterface.addColumn('email_logs', 'client_key', {
                type: Sequelize.STRING(50),
                allowNull: true,
            }, { transaction });

            await queryInterface.addColumn('email_logs', 'service_name', {
                type: Sequelize.STRING(50),
                allowNull: true,
            }, { transaction });

            // Add CHECK constraint for scope (enterprise pattern — no ENUM migration headaches)
            await queryInterface.sequelize.query(
                `ALTER TABLE email_logs ADD CONSTRAINT chk_email_logs_scope
                 CHECK (scope IN ('system', 'organization', 'user'))`,
                { transaction },
            );

            // Add indexes
            await queryInterface.addIndex('email_logs', ['org_id'], { transaction });
            await queryInterface.addIndex('email_logs', ['user_id'], { transaction });
            await queryInterface.addIndex('email_logs', ['scope'], { transaction });
            await queryInterface.addIndex('email_logs', ['client_key'], { transaction });
            await queryInterface.addIndex('email_logs', ['scope', 'org_id'], { transaction });
            await queryInterface.addIndex('email_logs', ['service_name', 'type'], { transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Remove indexes
            await queryInterface.removeIndex('email_logs', ['service_name', 'type'], { transaction });
            await queryInterface.removeIndex('email_logs', ['scope', 'org_id'], { transaction });
            await queryInterface.removeIndex('email_logs', ['client_key'], { transaction });
            await queryInterface.removeIndex('email_logs', ['scope'], { transaction });
            await queryInterface.removeIndex('email_logs', ['user_id'], { transaction });
            await queryInterface.removeIndex('email_logs', ['org_id'], { transaction });

            // Remove CHECK constraint
            await queryInterface.sequelize.query(
                'ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS chk_email_logs_scope',
                { transaction },
            );

            // Remove columns
            await queryInterface.removeColumn('email_logs', 'service_name', { transaction });
            await queryInterface.removeColumn('email_logs', 'client_key', { transaction });
            await queryInterface.removeColumn('email_logs', 'user_id', { transaction });
            await queryInterface.removeColumn('email_logs', 'org_id', { transaction });
            await queryInterface.removeColumn('email_logs', 'scope', { transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },
};
