// Author: Gururaj
// Created: 18th Mar 2026
// Description: IssueLabel Sequelize model: label definitions for issue tagging (bug, enhancement, etc.).
// Version: 1.0.0
// Modified:

// Description: Issue Label model - for categorization
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const IssueLabel = sequelize.define(
    "IssueLabel",
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
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      color: {
        type: DataTypes.STRING(20),
        defaultValue: "#000000",
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "issue_labels",
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  commonFields(IssueLabel);

  IssueLabel.associate = (models) => {
    IssueLabel.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
    });

    // Many-to-Many associations can be complex with polymorphic junction tables in Sequelize V6
    // We'll manage linkage via EntityLabel model explicitly if needed or use custom hooks.
  };

  return IssueLabel;
};
