"use strict";

const TABLE_PREFIX = "pms_";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Create Issue Statuses Table (For Workflow)
      await queryInterface.createTable(
        `${TABLE_PREFIX}issue_statuses`,
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          project_id: {
            type: Sequelize.UUID,
            allowNull: true, // Null for system defaults
            references: {
              model: `${TABLE_PREFIX}projects`,
              key: "id",
            },
            onDelete: "CASCADE",
          },
          name: {
            type: Sequelize.STRING(50),
            allowNull: false,
          },
          category: {
            type: Sequelize.ENUM("todo", "in_progress", "done"),
            allowNull: false,
            defaultValue: "todo",
          },
          color: {
            type: Sequelize.STRING(20),
            defaultValue: "#808080",
          },
          position: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        { transaction },
      );

      // 2. Create Issue Labels Table
      await queryInterface.createTable(
        `${TABLE_PREFIX}issue_labels`,
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          project_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: `${TABLE_PREFIX}projects`,
              key: "id",
            },
            onDelete: "CASCADE",
          },
          name: {
            type: Sequelize.STRING(50),
            allowNull: false,
          },
          color: {
            type: Sequelize.STRING(20),
            defaultValue: "#000000",
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        { transaction },
      );

      // 3. Create Entity Labels (Polymorphic Many-to-Many)
      await queryInterface.createTable(
        `${TABLE_PREFIX}entity_labels`,
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          label_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: `${TABLE_PREFIX}issue_labels`,
              key: "id",
            },
            onDelete: "CASCADE",
          },
          entity_id: {
            type: Sequelize.UUID,
            allowNull: false,
            comment: "ID of Issue, UserStory, or Feature",
          },
          entity_type: {
            type: Sequelize.ENUM("issue", "user_story", "feature"),
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        { transaction },
      );

      // Add unique constraint to prevent duplicate labels on same entity
      await queryInterface.addConstraint(`${TABLE_PREFIX}entity_labels`, {
        fields: ["label_id", "entity_id", "entity_type"],
        type: "unique",
        name: "unique_label_entity",
        transaction,
      });

      // 4. Enhance Issues Table (Bugs)
      // Add Assignee
      await queryInterface.addColumn(
        `${TABLE_PREFIX}issues`,
        "assignee_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: `${TABLE_PREFIX}project_members`, // Linking to project member to ensure permission
            key: "id",
          },
          onDelete: "SET NULL",
        },
        { transaction },
      );
      // Add Status FK
      await queryInterface.addColumn(
        `${TABLE_PREFIX}issues`,
        "status_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: `${TABLE_PREFIX}issue_statuses`,
            key: "id",
          },
          onDelete: "SET NULL",
        },
        { transaction },
      );

      // 5. Enhance Features Table (Epics)
      await queryInterface.addColumn(
        `${TABLE_PREFIX}features`,
        "assignee_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          // Feature assignee might not be a project member in strictly same table if features are global,
          // but V2 says features are project scoped.
        },
        { transaction },
      );
      await queryInterface.addColumn(
        `${TABLE_PREFIX}features`,
        "priority",
        {
          type: Sequelize.ENUM("low", "medium", "high", "critical"),
          defaultValue: "medium",
        },
        { transaction },
      );
      await queryInterface.addColumn(
        `${TABLE_PREFIX}features`,
        "status_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: `${TABLE_PREFIX}issue_statuses`,
            key: "id",
          },
          onDelete: "SET NULL",
        },
        { transaction },
      );

      // 6. Enhance User Stories (Stories/Tasks)
      await queryInterface.addColumn(
        `${TABLE_PREFIX}user_stories`,
        "status_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: `${TABLE_PREFIX}issue_statuses`,
            key: "id",
          },
          onDelete: "SET NULL",
        },
        { transaction },
      );

      // Add Labels count cache or similar? No, keep it simple.

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn(
        `${TABLE_PREFIX}user_stories`,
        "status_id",
        { transaction },
      );

      await queryInterface.removeColumn(
        `${TABLE_PREFIX}features`,
        "status_id",
        { transaction },
      );
      await queryInterface.removeColumn(`${TABLE_PREFIX}features`, "priority", {
        transaction,
      });
      await queryInterface.removeColumn(
        `${TABLE_PREFIX}features`,
        "assignee_id",
        { transaction },
      );

      await queryInterface.removeColumn(`${TABLE_PREFIX}issues`, "status_id", {
        transaction,
      });
      await queryInterface.removeColumn(
        `${TABLE_PREFIX}issues`,
        "assignee_id",
        { transaction },
      );

      await queryInterface.dropTable(`${TABLE_PREFIX}entity_labels`, {
        transaction,
      });
      await queryInterface.dropTable(`${TABLE_PREFIX}issue_labels`, {
        transaction,
      });
      await queryInterface.dropTable(`${TABLE_PREFIX}issue_statuses`, {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
