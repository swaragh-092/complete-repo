// Author: Gururaj 
// Created: 14th oct 2025
// Description: project feature relation model  
// Version: 1.0.0


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const ProjectFeature = sequelize.define("ProjectFeature", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        project_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        feature_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("pending", "in_progress", "completed"),
            defaultValue: "pending",
            allowNull: false,
            
        },
        ...commonFields()
    }, {
        tableName: tablePrefix + "project_features",
        timestamps: true,
        underscored: true,
        paranoid: true,
        deletedAt: "deleted_at"
    });

    commonFields(ProjectFeature);

    ProjectFeature.associate = (models) => {
        // ProjectFeature → Project
        ProjectFeature.belongsTo(models.Project, {
            foreignKey: "project_id",
            as: "project",
            onDelete: "CASCADE",
        });

        // ProjectFeature → Feature (master, department-owned)
        ProjectFeature.belongsTo(models.Feature, {
            foreignKey: "feature_id",
            as: "feature",
            onDelete: "CASCADE",
        });


        ProjectFeature.hasMany(models.Task, {
            foreignKey: "project_feature_id",
            as: "tasks",
        });
    };

    return ProjectFeature;
};
