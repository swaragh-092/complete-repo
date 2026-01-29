// Author: Gururaj 
// Created: 14th oct 2025
// Description: task dependency model  
// Version: 1.0.0


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const TaskDependency = sequelize.define("TaskDependency", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        parent_task_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        dependency_task_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        ...commonFields()
    }, {
        tableName: tablePrefix + "task_dependencies",
        timestamps: true,
        underscored: true,
        paranoid: true, // soft delete
        deletedAt: "deleted_at"
    });

    commonFields(TaskDependency);

    TaskDependency.associate = (models) => {
        // Parent Task
        TaskDependency.belongsTo(models.Task, {
            foreignKey: "parent_task_id",
            as: "parent_task",
            onDelete: "CASCADE",
        });

        // Child Task
        TaskDependency.belongsTo(models.Task, {
            foreignKey: "dependency_task_id",
            as: "depencency_task",
            onDelete: "CASCADE",
        });
    };

    return TaskDependency;
};
 