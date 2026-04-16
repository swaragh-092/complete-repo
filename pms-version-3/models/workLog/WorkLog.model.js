// Author: Gururaj
// Created: 29th May 2025
// Description: WorkLog Sequelize model recording time-tracking entries for user stories and tasks.
// Version: 1.0.0
// Modified:

// Description: WorkLog model — records individual timer sessions for a user on a UserStory
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const WorkLog = sequelize.define(
    "WorkLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "FK → User (from Auth module)",
      },
      user_story_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "FK → pms_user_stories",
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      feature_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sprint_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "NULL means the session is still open",
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Computed when timer is stopped",
      },
      log_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: "Calendar date bucket for daily grouping",
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "work_logs",
      timestamps: true,
      underscored: true,
      paranoid: false,
    },
  );

  commonFields(WorkLog);

  WorkLog.associate = (models) => {
    WorkLog.belongsTo(models.UserStory, {
      foreignKey: "user_story_id",
      as: "userStory",
      onDelete: "SET NULL",
    });
    WorkLog.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
    });
    WorkLog.belongsTo(models.Feature, {
      foreignKey: "feature_id",
      as: "feature",
    });
    WorkLog.belongsTo(models.Sprint, {
      foreignKey: "sprint_id",
      as: "sprint",
      onDelete: "SET NULL",
    });
  };

  return WorkLog;
};
