// Author: Copilot
// Created: 18th Mar 2026
// Description: Board Model
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Board = sequelize.define(
    "Board",
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
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("kanban", "scrum"),
        defaultValue: "kanban",
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "boards",
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  commonFields(Board);

  Board.associate = (models) => {
    Board.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
    });

    Board.hasMany(models.BoardColumn, {
      foreignKey: "board_id",
      as: "columns",
      onDelete: "CASCADE",
    });
  };

  return Board;
};
