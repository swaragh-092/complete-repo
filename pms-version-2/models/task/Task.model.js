// Author: Gururaj 
// Created: 14th oct 2025
// Description: Task model  
// Version: 1.0.0


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const Task = sequelize.define("Task", {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
          },
          project_id: {
            type: DataTypes.UUID,
            allowNull: false
          },
          department_id: {
            type: DataTypes.UUID,
            allowNull: false
          },
          assignee: {
            type: DataTypes.UUID,
            allowNull: true,
            validate: {
              checkAssignee(value) {
                if (this.status === "assign_pending" && !value) {
                  throw new Error("assignee is required when status is assign_pending");
                }
              }
            }
          },
          assigned_to: {
            type: DataTypes.UUID,
            allowNull: true,
            validate: {
              checkAssignedTo(value) {
                if (this.status === "assign_pending" && !value) {
                  throw new Error("assigned_to is required when status is assign_pending");
                }
              }
            }
          },

          approved_by: {
            type: DataTypes.UUID,
            allowNull: true
          },
          title: {
            type: DataTypes.STRING,
            allowNull: false
          },
          description: {
            type: DataTypes.TEXT,
            allowNull: true
          },
          priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
            defaultValue: 'medium',
            allowNull: false
          },
          status: {
            type: DataTypes.ENUM('approve_pending', "approved", 'in_progress', 'completed', 'blocked', "assign_pending", "checklist_removed", "accept_pending", "reject"),
            defaultValue: 'approve_pending',
            allowNull: false
          },
          due_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            validate: {
              async checkDueDate(value) {
                if (this.status === "assign_pending" && !value) {
                  throw new Error("due_date is required when status is assign_pending");
                }
              }
            }
          },
          taken_at: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          completed_at: {
            type: DataTypes.DATE,
            allowNull: true
          },
          metadata: {
            type: DataTypes.JSON, // flexible for storing extra info (tags, custom fields)
            allowNull: true
          },
          live_status : {
            type: DataTypes.ENUM("running", "stop"),
            defaultValue: 'stop'
          },
          total_work_time : {
            type: DataTypes.INTEGER, // store in minutes
            allowNull: false,
            defaultValue: 0,
          },
          last_start_time : {
            type: DataTypes.DATE,   
            allowNull: true,  
          },
          last_worked_date : {
            type: DataTypes.DATEONLY,   
            allowNull: true,  
          },
          todays_worked_time : {
            type: DataTypes.INTEGER, // store in minutes
            allowNull: false,
            defaultValue: 0,
          },
          helped_for: {
            type: DataTypes.UUID,
            allowNull: true,
          },

          project_feature_id: {
            type: DataTypes.UUID,
            allowNull: true,
            validate: {
              notNullWhenAssignPending(value) {
                if (this.status === "assign_pending" && !value) {
                  throw new Error("project_feature_id cannot be null when status is assign_pending");
                }
              },
            },
          },
          checklist_id: {
            type: DataTypes.UUID,
            allowNull: true,
            validate: {
              notNullWhenAssignPending(value) {
                if (this.status === "assign_pending" && !value) {
                  throw new Error("project_feature_id cannot be null when status is assign_pending");
                }
              },
            },
          },

          issue_id : {
            type: DataTypes.UUID,
            allowNull: true,
          },

          task_for: {
            type: DataTypes.ENUM("normal", "issue", "checklist", "help" ),
            allowNull: false,
            defaultValue: "normal",
          },


          ...commonFields()
    }, {
        tableName: tablePrefix + "tasks",
        timestamps: true,
        underscored: true,
        paranoid: true, // soft delete
        deletedAt: "deleted_at"
    });

    commonFields(Task);

    Task.associate = (models) => {
        Task.belongsTo(models.Project, {
            foreignKey: 'project_id',
            as: 'project'
        });

        // Who created the task
        Task.belongsTo(models.ProjectMember, {
            foreignKey: 'assignee',
            as: 'creator'
        });

        // Who is assigned to do the task
        Task.belongsTo(models.ProjectMember, {
            foreignKey: 'assigned_to',
            as: 'assigned'
        });

        // Who approved the task (if required by hierarchy)
        Task.belongsTo(models.ProjectMember, {
            foreignKey: 'approved_by',
            as: 'approver'
        });

        //  Self-referencing relation for helper / sub-tasks
        Task.hasMany(models.Task, {
          foreignKey: "helped_for",
          as: "helperTasks", // get helper tasks
        });

        Task.belongsTo(models.Task, {
          foreignKey: "helped_for",
          as: "helpedTask",
        });

        Task.belongsTo(models.ProjectFeature, {
          foreignKey: "project_feature_id",
          as: "projectFeature",
          onDelete: "CASCADE",
        });

        Task.belongsTo(models.Checklist, {
          foreignKey: "checklist_id",
          as: "checklist",
          onDelete: "CASCADE",
        });


        Task.belongsTo(models.Issue, {
          foreignKey: "issue_id",
          as: "issue",
          onDelete: "CASCADE",
        });

        // Dependencies → Parent / Child relationships
        Task.belongsToMany(models.Task, {
            through: models.TaskDependency,
            foreignKey: 'parent_task_id',
            otherKey: 'dependency_task_id',
            as: 'dependencyTasks'
        });

        Task.belongsToMany(models.Task, {
            through: models.TaskDependency,
            foreignKey: 'dependency_task_id',
            otherKey: 'parent_task_id',
            as: 'parentTasks'
        });


        Task.hasMany(models.DailyLog, {
            foreignKey: "task_id",
            as: "daily_log",
        });
    };

    return Task;
};
