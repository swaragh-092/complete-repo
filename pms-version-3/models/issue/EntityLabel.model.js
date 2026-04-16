// Author: Gururaj
// Created: 18th Mar 2026
// Description: EntityLabel junction model: many-to-many association between issues and labels.
// Version: 1.0.0
// Modified:

// Description: Entity Labels (Issue, Story, Feature labels junction)
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const EntityLabel = sequelize.define(
    "EntityLabel",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      label_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      entity_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      entity_type: {
        type: DataTypes.ENUM("issue", "user_story", "feature"),
        allowNull: false,
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "entity_labels",
      underscored: true,
      timestamps: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  commonFields(EntityLabel);

  EntityLabel.associate = (models) => {
    EntityLabel.belongsTo(models.IssueLabel, {
      foreignKey: "label_id",
      as: "label",
      onDelete: "CASCADE",
    });
  };

  return EntityLabel;
};
