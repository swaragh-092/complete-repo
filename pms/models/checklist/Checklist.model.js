// Author: Gururaj 
// Created: 14th oct 2025
// Description: check list model  
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const Checklist = sequelize.define("Checklist", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        feature_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
       
        ...commonFields()
    }, {
        tableName: tablePrefix + "checklist_items",
        timestamps: true,
        underscored: true,
        paranoid: true,       // Soft delete
        deletedAt: "deleted_at"
    });

    commonFields(Checklist);

    Checklist.associate = (models) => {
        // ChecklistItem → Feature
        Checklist.belongsTo(models.Feature, {
            foreignKey: "feature_id",
            as: "feature",
            onDelete: "CASCADE",
        });
        Checklist.hasMany(models.Task, {
            foreignKey: "checklist_id",
            as: "tasks",
            onDelete: "CASCADE",
        });

       
    };

    return Checklist;
};
