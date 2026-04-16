'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tableInfo = await queryInterface.describeTable('clients');
        if (!tableInfo.allow_primary_org_change) {
            await queryInterface.addColumn('clients', 'allow_primary_org_change', {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'If true, users can request to change their primary organization'
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('clients', 'allow_primary_org_change');
    }
};
