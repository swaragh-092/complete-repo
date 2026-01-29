// Author : Gururaj
// Created: 30th July 2025
// Description: All table audit log for create update and delete
// Version: 1.0.0
// Modified: 


module.exports = (sequelize, DataTypes, tablePrefix, commonFields, REQUIRE_HISTORY_TABLE) => {
  
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
        },
        updated_columns: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        remarks: {
          type: DataTypes.STRING,
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