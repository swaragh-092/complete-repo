// Author: Gururaj 
// Created: 14th oct 2025
// Description: issue model  
// Version: 1.0.0


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const Issue = sequelize.define("Issue", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },

        project_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },

        from_department_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },

        to_department_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },

        issue_type_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        status: {
            type: DataTypes.ENUM("open", "re_open", "in_progress", "resolved", "closed", "reject"),
            allowNull: false,
            defaultValue: "open",
        },

        priority: {
            type: DataTypes.ENUM("low", "medium", "high", "critical"),
            allowNull: false,
            defaultValue: "medium",
        },
        ...commonFields()       
    }, {
        tableName: tablePrefix + "issues",
        timestamps: true,
        underscored: true,
        paranoid: true,              // Soft delete  
        deletedAt: "deleted_at"                            
    });

    commonFields(Issue);

    Issue.associate = (models) => {
        // Issue → Project
        Issue.belongsTo(models.Project, {
            foreignKey: "project_id",
            as: "project",
            onDelete: "CASCADE",
        });

        // Issue → IssueHistory
        Issue.hasMany(models.IssueHistory, {
            foreignKey: "issue_id",
            as: "history",
            onDelete: "CASCADE",
        });

        Issue.hasMany(models.Task, {
            foreignKey: "issue_id",
            as: "tasks",
        });

        Issue.belongsTo(models.IssueType, {
            foreignKey: "issue_type_id",
            as: "type"
        });
    };

    return Issue;
};
