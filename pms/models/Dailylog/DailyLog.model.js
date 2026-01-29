// Author: Gururaj 
// Created: 14th oct 2025
// Description: daily log (standup and wrapup) model  
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const DailyLog = sequelize.define(
    "DailyLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      task_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      log_type: {
        type: DataTypes.ENUM("standup", "wrapup"),
        allowNull: false,
      },
      expected_duration: {
        type: DataTypes.INTEGER, // in minutes, only for stand-up
        allowNull: true,
      },
      actual_duration: {
        type: DataTypes.INTEGER, // in minutes, only for wrap-up
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("completed", "in_progress", "blocked", "not_taken"),
        allowNull: true, // mainly for wrap-up
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      related_id: {
        type: DataTypes.UUID,
        allowNull: true, // reference the related log (stand-up -> wrap-up)
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "daily_logs",
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft delete
      deletedAt: "deleted_at",
    }
  );

  commonFields(DailyLog);

  DailyLog.associate = (models) => {

    // Feature → Projects (many-to-many via ProjectFeature)
    DailyLog.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
    });
    DailyLog.belongsTo(models.Task, {
      foreignKey: "task_id",
      as: "task",
    });
  };

  return DailyLog;
};
