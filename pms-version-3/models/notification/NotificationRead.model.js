// Author: Gururaj 
// Created: 14th oct 2025
// Description: notification read model  
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const NotificationRead = sequelize.define(
    "NotificationRead",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      notification_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: tablePrefix + "notifications",
          key: "id",
        },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        // references auth User table
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "notification_reads",
      timestamps: true,
      underscored: true,
    }
  );

  NotificationRead.associate = (models) => {
    NotificationRead.belongsTo(models.Notification, {
      foreignKey: "notification_id",
      as: "notification",
    });
  };

  return NotificationRead;
};
