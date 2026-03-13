'use strict';

const TABLE_PREFIX = process.env.DB_PREFIX + "_";

module.exports = {
  async up(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}project_members`;

    await queryInterface.createTable(tableName, {

      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: `${TABLE_PREFIX}projects`,
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        // If auth module uses prefix, change table name accordingly
      },

      department_id: {
        type: Sequelize.UUID,
        allowNull: false,
        
      },

      project_role: {
        type: Sequelize.ENUM('member', 'lead', 'viewer'),
        allowNull: false,
        defaultValue: 'member',
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // 🔐 Prevent duplicate user in same project
    await queryInterface.addConstraint(tableName, {
      fields: ['project_id', 'user_id'],
      type: 'unique',
      name: `${tableName}_project_user_unique`
    });

    // ⚡ Indexes for performance
    await queryInterface.addIndex(tableName, ['project_id']);
    await queryInterface.addIndex(tableName, ['user_id']);
    await queryInterface.addIndex(tableName, ['department_id']);

  },

  async down(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}project_members`;

    await queryInterface.dropTable(tableName);

    // Drop ENUM (Postgres requirement)
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_project_role";`
    );
  }
};
