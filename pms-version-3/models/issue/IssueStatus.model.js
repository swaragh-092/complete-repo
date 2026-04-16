// Author: Gururaj
// Created: 18th Mar 2026
// Description: IssueStatus Sequelize model: workflow status with category (todo|in_progress|done) and position ordering.
// Version: 1.0.0
// Modified:

// Description: Issue Status model - for custom workflows
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const IssueStatus = sequelize.define(
    "IssueStatus",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment:
          "Null for global statuses, specific ID for custom project workflows",
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM("todo", "in_progress", "done"),
        allowNull: false,
        defaultValue: "todo",
      },
      color: {
        type: DataTypes.STRING(20),
        defaultValue: "#808080",
      },
      position: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "issue_statuses",
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  commonFields(IssueStatus);

  IssueStatus.associate = (models) => {
    IssueStatus.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
    });

    IssueStatus.hasMany(models.Issue, {
      foreignKey: "status_id",
      as: "issues",
    });

    IssueStatus.hasMany(models.UserStory, {
      foreignKey: "status_id",
      as: "userStories",
    });

    IssueStatus.hasMany(models.Feature, {
      foreignKey: "status_id",
      as: "features",
    });
  };

  return IssueStatus;
};
