'use strict';

const TABLE_PREFIX = process.env.DB_PREFIX + "_";

module.exports = {
  async up(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}issue_histories`;

    await queryInterface.createTable(tableName, {

      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      issue_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: `${TABLE_PREFIX}issues`,
          key: 'id'
        },
        onDelete: 'CASCADE',   // If issue deleted → history removed
        onUpdate: 'CASCADE'
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      action_type: {
        type: Sequelize.ENUM(
          'created',
          'accepted',
          'rejected',
          'reassigned',
          'fixed',
          'resolved',
          'commented',
          're_opened'
        ),
        allowNull: false,
      },

      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // ⚡ Indexes (Very Important for performance)
    await queryInterface.addIndex(tableName, ['issue_id']);
    await queryInterface.addIndex(tableName, ['user_id']);
    await queryInterface.addIndex(tableName, ['action_type']);
    await queryInterface.addIndex(tableName, ['created_at']);

  },

  async down(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}issue_histories`;

    await queryInterface.dropTable(tableName);

    // Drop ENUM manually (Postgres requirement)
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_action_type";`
    );
  }
};
