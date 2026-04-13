'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('global_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      value: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('number', 'boolean', 'string', 'json'),
        defaultValue: 'string',
      },
      category: {
        type: Sequelize.ENUM('limits', 'security', 'features', 'branding', 'system'),
        defaultValue: 'system',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'user_metadata',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      }
    });

    await queryInterface.addIndex('global_settings', ['key'], { unique: true });
    await queryInterface.addIndex('global_settings', ['category']);
    await queryInterface.addIndex('global_settings', ['is_public']);

    // Insert default system limits into the table
    await queryInterface.bulkInsert('global_settings', [
      {
        id: Sequelize.fn('gen_random_uuid'),
        key: 'MAX_WORKSPACES_PER_ORG',
        value: JSON.stringify(5),
        type: 'number',
        category: 'limits',
        description: 'Maximum number of workspaces allowed per organization',
        is_system: true,
        is_public: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('global_settings');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_global_settings_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_global_settings_category";');
  }
};
