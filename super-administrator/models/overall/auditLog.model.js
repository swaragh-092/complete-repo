// Author : Gururaj
// Created: 30th July 2025
// Description: All table audit log for create update and delete
// Version: 1.0.0
// Modified: 

const { REQUIRE_HISTORY_TABLE } = require("../index");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  
    const AuditLog = sequelize.define(
      "AuditLog",
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        
        reference_id: {
          type: DataTypes.UUID,
          allowNull : true,
        },
        
        table_name: {
          type: DataTypes.ENUM(REQUIRE_HISTORY_TABLE),
          allowNull: false,
        },
        snapshot: {
          type: DataTypes.JSON,
          allowNull: false,
          comment : "snapshot data of what changed"
        },
        updated_columns: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        remarks: {
          type: DataTypes.STRING,
          comment: "any review, remark, comment or discription",
        },
        ...commonFields(),

        
      },
      {
        tableName: tablePrefix + "audit_logs",
        timestamps: false,
        underscored: true,
      }
    );

    commonFields(AuditLog);


  
    return AuditLog;
  };