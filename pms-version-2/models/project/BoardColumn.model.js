// Author: Copilot
// Created: 18th Mar 2026
// Description: Board Column Model
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const BoardColumn = sequelize.define(
    "BoardColumn",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      board_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      position: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      mapped_status_ids: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Array of IssueStatus IDs",
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "board_columns",
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  commonFields(BoardColumn);

  BoardColumn.associate = (models) => {
    BoardColumn.belongsTo(models.Board, {
      foreignKey: "board_id",
      as: "board",
    });
  };

  return BoardColumn;
};
