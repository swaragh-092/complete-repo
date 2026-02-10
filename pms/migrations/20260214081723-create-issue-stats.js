'use strict';

const TABLE_PREFIX = process.env.DB_PREFIX + "_";

module.exports = {
  async up(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}issue_stats`;

    await queryInterface.createTable(tableName, {

      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        
      },

      issue_type_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: `${TABLE_PREFIX}issue_types`,
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },

      count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      // Common Fields
      organization_id: Sequelize.UUID,
      created_by: Sequelize.UUID,
      updated_by: Sequelize.UUID,
      created_ip: Sequelize.STRING(45),
      updated_ip: Sequelize.STRING(45),
      created_user_agent: Sequelize.STRING(255),
      updated_user_agent: Sequelize.STRING(255),

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },

      deleted_at: Sequelize.DATE,

    });

    // 🔐 Prevent duplicate stats row
    await queryInterface.addConstraint(tableName, {
      fields: ['user_id', 'issue_type_id'],
      type: 'unique',
      name: `${tableName}_user_type_unique`
    });

    // ⚡ Indexes for fast reporting
    await queryInterface.addIndex(tableName, ['user_id']);
    await queryInterface.addIndex(tableName, ['issue_type_id']);
    await queryInterface.addIndex(tableName, ['count']);

  },

  async down(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}issue_stats`;

    await queryInterface.dropTable(tableName);
  }
};
