// Author: Gururaj 
// Created: 14th oct 2025
// Description: feature model  
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const Feature = sequelize.define("Feature", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        department_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("active", "inactive"),
            defaultValue: "active",
        },
        ...commonFields()
    }, {
        tableName: tablePrefix + "features",
        timestamps: true,
        underscored: true,
        paranoid: true,          // Soft delete
        deletedAt: "deleted_at"
    });

    commonFields(Feature);

    Feature.associate = (models) => {
        
        // Feature → ChecklistItems
        Feature.hasMany(models.Checklist, {
            foreignKey: "feature_id",
            as: "checklists",
            onDelete: "CASCADE",
        });

        // Feature → Projects (many-to-many via ProjectFeature)
        Feature.hasMany(models.ProjectFeature, {
            foreignKey: "feature_id",
            as: "projects",
            onDelete: "CASCADE",
        });
    };

    return Feature;
};
