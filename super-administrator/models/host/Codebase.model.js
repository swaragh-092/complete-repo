// Author : Gururaj
// Created: 31th July 2025
// Description: Organization code base model
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const Codebase = sequelize.define('Codebase', {
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
        module_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: tablePrefix + 'module_registry',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        codebase_version: DataTypes.STRING,
        repo_branch: DataTypes.STRING,
        deploy_target: DataTypes.STRING,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        ...commonFields()
    }, {
        tableName: tablePrefix + 'codebase',
        timestamps: true,
        underscored: true,
        defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
    });

    commonFields(Codebase);

    Codebase.associate = (models) => {

    Codebase.belongsTo(models.Organization, {
      foreignKey: "organization_id",
      as: "organization",
    });
    Codebase.belongsTo(models.ModuleRegistry, {
      foreignKey: "module_id",
      as: "module",
    });

  };

    return Codebase;
};
