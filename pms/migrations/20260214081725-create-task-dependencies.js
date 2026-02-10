'use strict';

const TABLE_PREFIX = process.env.DB_PREFIX + "_";
const tableName = TABLE_PREFIX + "task_dependencies";

module.exports = {
  async up(queryInterface, Sequelize) {
    

    await queryInterface.createTable(tableName, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      parent_task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: TABLE_PREFIX + "tasks",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      dependency_task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: TABLE_PREFIX + "tasks",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      // Common Fields (adjust if your commonFields differs)
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

    // Optional: prevent duplicate dependencies
    await queryInterface.addConstraint(
      tableName,
      {
        fields: ["parent_task_id", "dependency_task_id"],
        type: "unique",
        name: tableName + "_unique_pair",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable(tableName);
  },
};
