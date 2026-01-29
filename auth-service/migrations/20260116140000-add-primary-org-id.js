'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Check if primary_org_id column already exists
        const tableDescription = await queryInterface.describeTable('user_metadata');
        if (tableDescription.primary_org_id) {
            console.log('✅ primary_org_id column already exists, skipping...');
            return;
        }

        // 2. Add primary_org_id column
        await queryInterface.addColumn('user_metadata', 'primary_org_id', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'organizations',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

        // 3. Backfill primary_org_id for existing users
        // Strategy: Take the first membership for each user (by id since created_at may not exist)
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.sequelize.query(`
        UPDATE user_metadata um
        SET primary_org_id = (
          SELECT org_id 
          FROM organization_memberships om
          WHERE om.user_id = um.id
          ORDER BY om.id ASC
          LIMIT 1
        )
        WHERE primary_org_id IS NULL AND EXISTS (
          SELECT 1 FROM organization_memberships om WHERE om.user_id = um.id
        );
      `, { transaction });

            await transaction.commit();
            console.log('✅ Backfilled primary_org_id for existing users');
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Failed to backfill primary_org_id:', error);
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        const tableDescription = await queryInterface.describeTable('user_metadata');
        if (tableDescription.primary_org_id) {
            await queryInterface.removeColumn('user_metadata', 'primary_org_id');
        }
    }
};
