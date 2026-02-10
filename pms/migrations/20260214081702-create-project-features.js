'use strict';

const TABLE_PREFIX = process.env.DB_PREFIX + "_";

module.exports = {
  async up(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}project_features`;

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

      feature_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: `${TABLE_PREFIX}features`,
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },

      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed'),
        defaultValue: 'pending',
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

    // 🔐 Prevent duplicate feature per project
    await queryInterface.addConstraint(tableName, {
      fields: ['project_id', 'feature_id'],
      type: 'unique',
      name: `${tableName}_project_feature_unique`
    });

    // ⚡ Indexes for performance
    await queryInterface.addIndex(tableName, ['project_id']);
    await queryInterface.addIndex(tableName, ['feature_id']);

  },

  async down(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}project_features`;

    await queryInterface.dropTable(tableName);

    // Drop ENUM manually (important in Postgres)
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_status";`
    );
  }
};
