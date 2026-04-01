// Author: Gururaj
// Created: 14th Oct 2025
// Description: StoryChangeRequest Sequelize model storing change-request submissions and approval decisions.
// Version: 1.0.0
// Modified:

// Description: StoryChangeRequest model — tracks requests to change locked fields
// (due_date, status reversal) that require team lead approval
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const StoryChangeRequest = sequelize.define(
    "StoryChangeRequest",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      story_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      requested_by: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      request_type: {
        type: DataTypes.ENUM("due_date_change", "status_revert"),
        allowNull: false,
      },
      requested_value: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: "e.g. {due_date:'2026-05-01'} or {target_status:'defined'}",
      },
      current_value: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Snapshot of the value before the requested change",
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
        allowNull: false,
      },
      reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      review_comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "story_change_requests",
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  commonFields(StoryChangeRequest);

  StoryChangeRequest.associate = (models) => {
    StoryChangeRequest.belongsTo(models.UserStory, {
      foreignKey: "story_id",
      as: "story",
      onDelete: "CASCADE",
    });
  };

  return StoryChangeRequest;
};
