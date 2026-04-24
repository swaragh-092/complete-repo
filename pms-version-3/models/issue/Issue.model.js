// Author: Gururaj
// Created: 14th oct 2025
// Description: issue model
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Issue = sequelize.define(
    "Issue",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      from_department_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      to_department_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      issue_type_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      user_story_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Linked User Story",
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM(
          "open",
          "re_open",
          "in_progress",
          "resolved",
          "closed",
          "reject",
        ),
        allowNull: false,
        defaultValue: "open",
      },

      priority: {
        type: DataTypes.ENUM("low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "medium",
      },

      assignee_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Assigned Project Member",
      },

      status_id: {
        type: DataTypes.UUID,
        allowNull: true, // Nullable to fallback to 'status' enum or default
      },

      sprint_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Sprint this issue belongs to",
      },

      parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Parent Issue ID for hierarchy (Epic -> Parent -> Subtask)",
      },

      board_order: {
        type: DataTypes.FLOAT,
        defaultValue: 65535.0,
      },

      // Site-type linked work items (page_id / section_id / component_id are
      // mutually exclusive with user_story_id — enforced by DB CHECK constraint)
      page_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Linked Page (Site-type projects)",
      },
      section_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Linked Section (Site-type projects)",
      },
      component_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Linked Component (Site-type projects)",
      },

      ...commonFields(),
    },
    {
      tableName: tablePrefix + "issues",
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft delete
      deletedAt: "deleted_at",
    },
  );

  commonFields(Issue);

  Issue.associate = (models) => {
    // Issue → Project
    Issue.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
      onDelete: "CASCADE",
    });

    // Issue → Sprint
    Issue.belongsTo(models.Sprint, {
      foreignKey: "sprint_id",
      as: "sprint",
      onDelete: "SET NULL",
    });

    // Issue → Parent (Self-Reference)
    Issue.belongsTo(models.Issue, {
      foreignKey: "parent_id",
      as: "parent",
      onDelete: "SET NULL",
    });

    // Issue → Children (Self-Reference)
    Issue.hasMany(models.Issue, {
      foreignKey: "parent_id",
      as: "children",
    });

    // Issue → IssueHistory
    Issue.hasMany(models.IssueHistory, {
      foreignKey: "issue_id",
      as: "history",
      onDelete: "CASCADE",
    });

    // Issue → IssueComment
    Issue.hasMany(models.IssueComment, {
      foreignKey: "issue_id",
      as: "comments",
      onDelete: "CASCADE",
    });

    // Issue → IssueAttachment
    Issue.hasMany(models.IssueAttachment, {
      foreignKey: "issue_id",
      as: "attachments",
      onDelete: "CASCADE",
    });

    Issue.belongsTo(models.UserStory, {
      foreignKey: "user_story_id",
      as: "userStory",
      onDelete: "SET NULL",
    });

    Issue.belongsTo(models.IssueType, {
      foreignKey: "issue_type_id",
      as: "type",
    });

    Issue.belongsTo(models.IssueStatus, {
      foreignKey: "status_id",
      as: "issueStatus",
    });

    Issue.belongsTo(models.ProjectMember, {
      foreignKey: "assignee_id",
      as: "assignee",
    });

    // Site-type linked items
    Issue.belongsTo(models.Page, {
      foreignKey: "page_id",
      as: "page",
      onDelete: "SET NULL",
    });

    Issue.belongsTo(models.Section, {
      foreignKey: "section_id",
      as: "linkedSection",
      onDelete: "SET NULL",
    });

    Issue.belongsTo(models.Component, {
      foreignKey: "component_id",
      as: "component",
      onDelete: "SET NULL",
    });
  };

  return Issue;
};
