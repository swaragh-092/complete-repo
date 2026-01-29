// Author: Gururaj 
// Created: 14th oct 2025
// Description: project member model  
// Version: 1.0.0


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const ProjectMember = sequelize.define("ProjectMember", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        project_id: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: "FK -> Project"
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: "FK -> User (from Auth module)"
        },
        department_id: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: "FK -> Department (from Auth module)"
        },
        project_role: {
            type: DataTypes.ENUM("member", "lead", "viewer"),
            allowNull: false,
            defaultValue: "member",
            comment: "Project-specific role (different from global role)"
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        ...commonFields()
    }, {
        tableName: tablePrefix + "project_members",
        timestamps: true,
        underscored: true,
        paranoid: true,              // Soft delete
        deletedAt: "deleted_at"
    });

    commonFields(ProjectMember);

    ProjectMember.associate = (models) => {
        // ProjectMember → Project
        ProjectMember.belongsTo(models.Project, {
            foreignKey: "project_id",
            as: "project",
            onDelete: "CASCADE",
        });

        // ProjectMember → Tasks (assigned, created, approved)
        ProjectMember.hasMany(models.Task, {
            foreignKey: "assigned_to",
            as: "assigned_tasks",
        });
        ProjectMember.hasMany(models.Task, {
            foreignKey: "assignee",
            as: "created_tasks",
        });
        ProjectMember.hasMany(models.Task, {
            foreignKey: "approved_by",
            as: "approved_tasks",
        });

    };

    return ProjectMember;
};
