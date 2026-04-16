// Author: Copilot
// Created: 18th Mar 2026
// Description: Sprint Model
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Sprint = sequelize.define(
    "Sprint",
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      goal: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("planned", "active", "completed"),
        defaultValue: "planned",
        allowNull: false,
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "sprints",
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  commonFields(Sprint);

  Sprint.associate = (models) => {
    // Sprint belongs to project
    Sprint.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
    });

    // Sprint has many Issues
    Sprint.hasMany(models.Issue, {
      foreignKey: "sprint_id",
      as: "issues",
      onDelete: "SET NULL",
    });

    // Sprint has many UserStories
    Sprint.hasMany(models.UserStory, {
      foreignKey: "sprint_id",
      as: "userStories",
      onDelete: "SET NULL",
    });
  };

  return Sprint;
};
