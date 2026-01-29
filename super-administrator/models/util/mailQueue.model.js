// Author: Gururaj
// Created: 16th May 2025
// Description: This file returns the MailQueue model.
// Version: 1.0.0
// Modified: 


module.exports = (sequelize, DataTypes, tablePrefix) => {

  const MailQueue = sequelize.define(
    "MailQueue",
    {
      type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      to_email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      payload: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "sent", "failed"),
        defaultValue: "pending",
      },
      tries: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      last_error: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },
    }, 
    {
      timestamps: true,
      underscored: true,
      tableName: tablePrefix+'mail_queue',
    }
  );

  return MailQueue;
}

