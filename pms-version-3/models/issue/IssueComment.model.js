// Author: Copilot
// Created: 17th Mar 2026
// Description: Issue Comment model
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const IssueComment = sequelize.define(
    "IssueComment",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      issue_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "The issue this comment belongs to",
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "The user who made the comment (from Auth Service)",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "issue_comments",
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  commonFields(IssueComment);

  IssueComment.associate = (models) => {
    IssueComment.belongsTo(models.Issue, {
      foreignKey: "issue_id",
      as: "issue",
    });
    // Link to User model if it exists in pms-version-2, otherwise logic handles it
    // Check if models.User exists
    if (models.User) {
      IssueComment.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    } else if (models.ProjectMember) {
      // Alternatively link to ProjectMember if we want to show member details
      // But comments are usually by user.
    }
  };

  return IssueComment;
};
