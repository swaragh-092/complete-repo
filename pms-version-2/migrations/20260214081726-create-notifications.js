'use strict';

const TABLE_PREFIX = process.env.DB_PREFIX + "_";

const tableName = TABLE_PREFIX + "notifications";

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable(tableName, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      triggered_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },

      scope: {
        type: Sequelize.ENUM(
          "individual",
          "project",
          "department",
          "project_department"
        ),
        allowNull: false,
      },

      entity_type: {
        type: Sequelize.ENUM(
          "task",
          "issue",
          "project",
          "feature"
        ),
        allowNull: true,
      },

      entity_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },

      project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: TABLE_PREFIX + "projects",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      department_id: {
        type: Sequelize.UUID,
        allowNull: true,
        
      },

      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

       // Common fields
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

    // 🔥 Useful Indexes for fast filtering
    await queryInterface.addIndex(
      tableName,
      ["scope"],
      { name: tableName+ "_scope_idx" }
    );

    await queryInterface.addIndex(
      tableName,
      ["user_id"],
      { name: tableName+ "_user_idx" }
    );

    await queryInterface.addIndex(
      tableName,
      ["project_id"],
      { name: tableName+ "_project_idx" }
    );

    await queryInterface.addIndex(
      tableName,
      ["department_id"],
      { name: tableName+ "_department_idx" }
    );
  },

  async down(queryInterface) {

    await queryInterface.dropTable(tableName);

    // ENUM cleanup (important for Postgres)
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_scope";`
    );

    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_entity_type";`
    );
  },
};
