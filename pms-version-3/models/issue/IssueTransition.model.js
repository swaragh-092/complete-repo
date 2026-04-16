// Author: Copilot
// Description: Issue Transition Model
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const IssueTransition = sequelize.define(
    "IssueTransition",
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
      from_status_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      to_status_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "issue_transitions",
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft delete - maybe reconsider? But commonFields forces deletedAt
      deletedAt: "deleted_at",
      indexes: [
        {
          unique: true,
          fields: ["project_id", "from_status_id", "to_status_id"],
        },
      ],
    },
  );

  commonFields(IssueTransition);

  IssueTransition.associate = (models) => {
    IssueTransition.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
    });
    IssueTransition.belongsTo(models.IssueStatus, {
      foreignKey: "from_status_id",
      as: "fromStatus",
    });
    IssueTransition.belongsTo(models.IssueStatus, {
      foreignKey: "to_status_id",
      as: "toStatus",
    });
  };

  return IssueTransition;
};
