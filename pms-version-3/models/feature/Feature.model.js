// Author: Gururaj
// Created: 14th Oct 2025
// Description: Feature Sequelize model: project-scoped feature entity supporting parent-child hierarchy.
// Version: 2.0.0
// Modified:

// Description: Feature model - independent project-scoped entity
// In v2, features belong directly to a project and contain user stories.
// Hierarchy: Feature → User Stories → Sub User Stories
// Version: 2.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Feature = sequelize.define(
    "Feature",
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
      parent_feature_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Hierarchy for Sub-Features",
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
      },
      status_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high", "critical"),
        defaultValue: "medium",
      },
      assignee_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "features",
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  commonFields(Feature);

  Feature.associate = (models) => {
    // Feature → Project
    Feature.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
      onDelete: "CASCADE",
    });

    // Self-referencing: Sub-features
    Feature.belongsTo(models.Feature, {
      foreignKey: "parent_feature_id",
      as: "parentFeature",
    });

    Feature.hasMany(models.Feature, {
      foreignKey: "parent_feature_id",
      as: "subFeatures",
      onDelete: "CASCADE",
    });

    // Feature → User Stories
    Feature.hasMany(models.UserStory, {
      foreignKey: "feature_id",
      as: "userStories",
      onDelete: "CASCADE",
    });

    // Feature → Projects (legacy many-to-many via ProjectFeature)
    Feature.hasMany(models.ProjectFeature, {
      foreignKey: "feature_id",
      as: "projectFeatures",
      onDelete: "CASCADE",
    });

    Feature.belongsTo(models.IssueStatus, {
      foreignKey: "status_id",
      as: "issueStatus",
    });
  };

  return Feature;
};
