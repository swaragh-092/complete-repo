// Author: Gururaj
// Created: 14th Oct 2025
// Description: UserStory Sequelize model: core work-item entity with status lifecycle, timer fields, and hierarchy support.
// Version: 2.0.0
// Modified:

// Description: User Story model - represents work items within features
// Follows hierarchy: Feature → User Stories → Sub User Stories
// Version: 2.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const UserStory = sequelize.define(
    "UserStory",
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
      feature_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      parent_user_story_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment:
          "Self-referencing FK for sub user stories. NULL means top-level user story.",
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("story", "task"),
        defaultValue: "story",
        allowNull: false,
        comment:
          "Distinguishes between a functional User Story and a technical Task",
      },
      story_for: {
        type: DataTypes.ENUM("normal", "help"),
        defaultValue: "normal",
        allowNull: false,
        comment: "Flags whether this is a helper story assisting another story",
      },
      helped_for: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "FK to the UserStory being helped. NULL for normal stories.",
      },
      reporter_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "User who reported/created the item",
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: tablePrefix + "issue_statuses",
          key: "id",
        },
      },
      acceptance_criteria: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high", "critical"),
        defaultValue: "medium",
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "defined",
          "in_progress",
          "review",
          "completed",
          "blocked",
          "accept_pending", // helper story awaiting acceptance
          "reject", // helper story rejected
        ),
        defaultValue: "defined",
        allowNull: false,
      },
      assignee: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "User who assigned, or creator",
      },
      assigned_to: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "User performing the work",
      },
      approval_status: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "not_required"),
        defaultValue: "not_required",
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      total_work_time: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Time spent in minutes",
      },
      live_status: {
        type: DataTypes.ENUM("running", "stop"),
        defaultValue: "stop",
      },
      taken_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      story_points: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Estimation in story points",
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Display order within parent",
      },
      sprint_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "NULL = in backlog; UUID = assigned to this sprint",
      },
      backlog_order: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 65535.0,
        comment: "Float rank for drag-and-drop ordering in backlog / board",
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "user_stories",
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  commonFields(UserStory);

  UserStory.associate = (models) => {
    // UserStory → Project
    UserStory.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
      onDelete: "CASCADE",
    });

    // UserStory → Feature
    UserStory.belongsTo(models.Feature, {
      foreignKey: "feature_id",
      as: "feature",
      onDelete: "CASCADE",
    });

    // Self-referencing: Parent ↔ Sub User Stories
    UserStory.belongsTo(models.UserStory, {
      foreignKey: "parent_user_story_id",
      as: "parentStory",
    });

    UserStory.hasMany(models.UserStory, {
      foreignKey: "parent_user_story_id",
      as: "subStories",
      onDelete: "CASCADE",
    });

    // UserStory → Issues
    UserStory.hasMany(models.Issue, {
      foreignKey: "user_story_id",
      as: "issues",
      onDelete: "SET NULL",
    });

    UserStory.belongsTo(models.IssueStatus, {
      foreignKey: "status_id",
      as: "issueStatus",
    });

    // Sprint
    UserStory.belongsTo(models.Sprint, {
      foreignKey: "sprint_id",
      as: "sprint",
      onDelete: "SET NULL",
    });

    // Helper Stories: a story can have many helpers, and a helper knows which story it helps
    UserStory.hasMany(models.UserStory, {
      foreignKey: "helped_for",
      as: "helperStories",
    });
    UserStory.belongsTo(models.UserStory, {
      foreignKey: "helped_for",
      as: "helpedStory",
    });

    // UserStoryDependency: many-to-many through join table
    if (models.UserStoryDependency) {
      UserStory.belongsToMany(models.UserStory, {
        through: models.UserStoryDependency,
        foreignKey: "parent_story_id",
        otherKey: "dependency_story_id",
        as: "dependencyStories",
      });
      UserStory.belongsToMany(models.UserStory, {
        through: models.UserStoryDependency,
        foreignKey: "dependency_story_id",
        otherKey: "parent_story_id",
        as: "parentStories",
      });
    }
  };

  return UserStory;
};
