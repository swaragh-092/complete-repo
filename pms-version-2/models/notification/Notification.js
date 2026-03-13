// Author: Gururaj 
// Created: 14th oct 2025
// Description: notification model  
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      triggered_by_id: {
        type: DataTypes.UUID,
        allowNull: true, // system if null
      },
      scope: {
        type: DataTypes.ENUM(
          "individual",
          "project",
          "department",
          "project_department"
        ),
        allowNull: false,
      },
      entity_type: {
        type: DataTypes.ENUM("task", "issue", "project", "feature"),
        allowNull: true, // optional, can be null for system notifications
      },
      entity_id: {
        type: DataTypes.UUID,
        allowNull: true, // optional, references the above entity
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true, // only when scope = individual
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: true, // when scope = project OR department
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: true, // when scope = department or project_department
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true, // for individual user
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "notifications",
      timestamps: true,
      underscored: true,
    }
  );

  commonFields(Notification);

  Notification.associate = (models) => {
    Notification.hasMany(models.NotificationRead, {
      foreignKey: "notification_id",
      as: "reads",
    });
  };

  return Notification;
};
