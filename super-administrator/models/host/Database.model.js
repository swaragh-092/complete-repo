// Author : Gururaj
// Created: 31th July 2025
// Description: Organization database model 
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const Database = sequelize.define('Database', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        organization_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: tablePrefix + 'organizations',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        module_version_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: tablePrefix + 'module_versions',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            
        },
        key_name: DataTypes.STRING,
        schema_version: DataTypes.STRING,
        ...commonFields()
    }, {
        tableName: tablePrefix + 'database',
        timestamps: true,
        underscored: true,
        defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
        indexes: [
          {
            unique: true,
            fields: ['organization_id', 'module_version_id'],
            name: 'unique_org_module_version'
          }
        ],
      },
    });

    commonFields(Database);

    Database.associate = (models) => {

    Database.belongsTo(models.Organization, {
      foreignKey: "organization_id",
      as: "organization",
    });
    Database.belongsTo(models.ModuleVersion, {
      foreignKey: "module_version_id",
      as: "version",
    });

  };

    return Database;
};