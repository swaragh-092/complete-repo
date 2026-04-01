// Author: Gururaj
// Created: 14th Oct 2025
// Description: UserStoryDependency junction model tracking blocking/blocked-by dependency pairs between user stories.
// Version: 1.0.0
// Modified:

// Description: UserStoryDependency model - join table for user story dependencies
// A UserStory (parent) depends on another UserStory (dependency) being done first.
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix) => {
  const UserStoryDependency = sequelize.define(
    "UserStoryDependency",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      parent_story_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "The story that has the dependency (depends on another)",
      },
      dependency_story_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "The story that must be completed first (blocking story)",
      },
    },
    {
      tableName: tablePrefix + "user_story_dependencies",
      timestamps: true,
      underscored: true,
    },
  );

  UserStoryDependency.associate = (models) => {
    UserStoryDependency.belongsTo(models.UserStory, {
      foreignKey: "parent_story_id",
      as: "parentStory",
    });
    UserStoryDependency.belongsTo(models.UserStory, {
      foreignKey: "dependency_story_id",
      as: "dependencyStory",
    });
  };

  return UserStoryDependency;
};
