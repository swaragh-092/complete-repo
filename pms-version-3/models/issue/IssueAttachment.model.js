// Author: Copilot
// Created: 18th Mar 2026
// Description: Model for Issue Attachments
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const IssueAttachment = sequelize.define(
    "IssueAttachment",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      issue_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "Uploader ID",
      },
      file_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ...commonFields(), // Includes created_at, updated_at, deleted_at (if paranoid)
    },
    {
      tableName: tablePrefix + "issue_attachments",
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft delete
      deletedAt: "deleted_at",
    },
  );

  commonFields(IssueAttachment);

  IssueAttachment.associate = (models) => {
    // Relationship: Attachment -> Issue
    IssueAttachment.belongsTo(models.Issue, {
      foreignKey: "issue_id",
      as: "issue",
      onDelete: "CASCADE",
    });

    // Relationship: Attachment -> User (if we had User model here)
    // IssueAttachment.belongsTo(models.User, { foreignKey: 'user_id', as: 'uploader' });
  };

  return IssueAttachment;
};
