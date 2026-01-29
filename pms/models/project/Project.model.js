// Author: Gururaj 
// Created: 14th oct 2025
// Description: project model  
// Version: 1.0.0


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const Project = sequelize.define("Project", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        estimated_start_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        estimated_end_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        is_completed : {
            type: DataTypes.BOOLEAN,
            defaultValue : false,
            allowNull: false,
        },
        visibility: {
            type: DataTypes.ENUM("public", "private", "restricted"),
            allowNull: false,
            defaultValue: "private",
        },
        ...commonFields()
    }, {
        tableName: tablePrefix + "projects",
        timestamps: true,
        underscored: true,
        paranoid: true,              // Soft delete
        deletedAt: "deleted_at"
    });

    commonFields(Project);

    Project.associate = (models) => {

        // Project → ProjectMembers
        Project.hasMany(models.ProjectMember, {
            foreignKey: "project_id",
            as: "members",
            onDelete: "CASCADE",
        });

        // Project → Tasks
        Project.hasMany(models.Task, {
            foreignKey: "project_id",
            as: "tasks",
            onDelete: "CASCADE",
        });

        // Project → Issues
        Project.hasMany(models.Issue, {
            foreignKey: "project_id",
            as: "issues",
            onDelete: "CASCADE",
        });

        // Project → ProjectFeatures
        Project.hasMany(models.ProjectFeature, {
            foreignKey: "project_id",
            as: "features",
            onDelete: "CASCADE",
        });


        Project.hasMany(models.DailyLog, {
            foreignKey: "project_id",
            as: "daily_log",
        });
    };

    return Project;
};
