'use strict';

const TABLE_PREFIX = process.env.DB_PREFIX + "_";

module.exports = {
  async up(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}projects`;

    await queryInterface.createTable(tableName, {

      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      code: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },

      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      estimated_start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      estimated_end_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      is_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      visibility: {
        type: Sequelize.ENUM('public', 'private', 'restricted'),
        defaultValue: 'private',
        allowNull: false,
      },

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

    await queryInterface.addIndex(tableName, ['code'], {
      unique: true,
      name: `${tableName}_code_unique`
    });
    await queryInterface.addIndex(tableName, ['organization_id'], {
      name: 'pms_projects_org_index'
    });

  },

  async down(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}projects`;

    await queryInterface.dropTable(tableName);

    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_visibility";`
    );
  }
};
