'use strict';

const TABLE_PREFIX = process.env.DB_PREFIX + "_";

module.exports = {
  async up(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}features`;

    await queryInterface.createTable(tableName, {

      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      department_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: false,
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

    // 🔐 Prevent duplicate feature name inside same department
    await queryInterface.addConstraint(tableName, {
      fields: ['department_id', 'name'],
      type: 'unique',
      name: `${tableName}_department_name_unique`
    });

    // ⚡ Indexes
    await queryInterface.addIndex(tableName, ['department_id']);
    await queryInterface.addIndex(tableName, ['status']);

  },

  async down(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}features`;

    await queryInterface.dropTable(tableName);

    // Drop ENUM manually (Postgres)
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_status";`
    );
  }
};
