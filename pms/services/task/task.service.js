// Author: Gururaj
// Created: 14th oct 2025
// Description: task related service logics.
// Version: 1.0.0
// Modified:
// 

const { Op, Sequelize } = require("sequelize");
const { withContext, giveValicationErrorFormal, paginateHelperFunction, auditLogUpdateHelperFunction } = require("../../util/helper");

const { createNotification } = require("../notification/notification.service");
const { queryWithLogAudit } = require("../auditLog.service");


class TaskService {
  /**
   * Create a task
   * Only allowed if the creator has hierarchical permission in the project/department
   * @param {Object} data - Task data { project_id, department_id, title, description, ... }
   * @param {Object} options - Optional params ({ req })
   * @returns {Promise<Object>}
   */
  async createTask(req, data) {
    const {Task, ProjectMember} = req.db;

    try {
      const assignedMember = await ProjectMember.findByPk(
        data.project_member_id,
        {
          include: [
            {
              association: "project", 
              required: true, 
            },
          ],
        }
      );

      if (!assignedMember)
        return {
          success: false,
          message: "Project member not found",
          status: 404,
        };

      let parentTask;

      if (
        data.parent_task_id &&
        (data.create_dependency_task || data.create_helper_task)
      ) {
        parentTask = await Task.findByPk(data.parent_task_id);

        if (!parentTask) return { success: false, status: 404, message: "Parent Task not found!..", };
        if (data.create_helper_task && assignedMember.id === parentTask.assigned_to ) return {success: false, status: 401, message : "Helper task cant assigned to same person"};
        if ( data.create_helper_task && ( parentTask.status !== "in_progress" && parentTask.status !== "approved") ) return {success: false, status: 409, message : "Cannot ask help for completed Task!.."}  
      }

      const project = assignedMember.project;


      if ( parentTask && (project.id !== parentTask.project_id) )  return {success: false, status: 401, message : "Other project task cannot be assigned"};

      const user = req.user;

      let assigneeMemberId;

      if (user.id === assignedMember.user_id) {
        assigneeMemberId = assignedMember.id;
        data.status = "approve_pending";
      } else {
        const assigneeMember = await ProjectMember.findOne({
          where: {
            project_id: project.id,
            user_id: user.id,
            department_id: assignedMember.department_id,
          },
        });

        if (!assigneeMember)
          return {
            success: false,
            message: "No access to assign member to this proejct",
            status: 403,
          };

        assigneeMemberId = assigneeMember.id;
        data.status = "approved";
        data.approved_by = assigneeMember.id;
      }

      const finalData = {
        ...data,
        project_id: project.id,
        department_id: assignedMember.department_id,
        assignee: assigneeMemberId,
        assigned_to: assignedMember.id,
      };

      finalData.status = "approved"; // to-do this is for now remove this later by checking correct validations

      // TODO: add hierarchy logic → check if `creator` has permission to assign or create for others
      // (e.g., compare `creator.role_level` vs `assignee.role_level` if your system tracks hierarchy)

      if (parentTask && data.create_helper_task){
        finalData.helped_for = parentTask.id;
        finalData.status = "accept_pending";
        finalData.task_for = "help";
      }

      if (data.issue_id) {
        if (project.id !== data.projectIdForCompare)
          return {
            success: false,
            status: 409,
            message: "Different project member!..",
          };

        finalData.task_for = "issue";
      }

      const result = await queryWithLogAudit({
        action : "create",
        req,
        queryCallBack: async (t) => {
          const task = await Task.create(finalData, {...withContext(req), transaction: t});
          if (parentTask && data.create_dependency_task)
            await parentTask.addDependencyTask(Task.id, {...withContext(req), transaction: t});
          const notificationData = {
            scope: "individual",
            title: `Task is added`,
            message: `${task.title} Task is added for you for the project - ${project.name}.`,
            triggeredById: req?.user?.id,
            entityType: "task",
            entityId: task.id,
            userId: assignedMember.user_id,
          };

          if (project.iscompleted) {
            await project.update( {is_completed : false },{...withContext(req),transaction: t,});
          }

          const notificationResult = await createNotification(
            req,
            notificationData,
          );

          return task;

        },
        updated_columns : Object.keys(finalData),
      });

      return { success: true, status: 201, data: result };
    } catch (err) {
      if (err instanceof Sequelize.ValidationError) {
        console.log(err);
        return {
          success: false,
          status: 422,
          message: "Validation Error",
          errors: giveValicationErrorFormal(err),
        };
      }
      throw err;
    }
  }

  /**
   * Update a task (title, description, status, etc.)
   * @param {String} taskId - Task UUID
   * @param {Object} updates - Fields to update
   * @param {Object} options - Optional ({ req })
   */
  async addTaskDependency(req, { dependency_task_id, parent_task_id }) {
    const {Task, TaskDependency} = req.db;

    if (dependency_task_id === parent_task_id) {
      return {
        success: false,
        status: 409,
        message: "Parent and dependency task cannot be same",
      };
    }

    const existingRelation = await TaskDependency.findOne({
      where: {
        [Op.or]: [
          { dependency_task_id, parent_task_id },
          {
            dependency_task_id: parent_task_id,
            parent_task_id: dependency_task_id,
          }, // optional reverse check
        ],
      },
    });

    if (existingRelation) {
      return {
        success: false,
        status: 400,
        message: "Task dependency already exists",
      };
    }

    const tasks = await Task.findAll({
      where: { id: [dependency_task_id, parent_task_id] },
    });

    const dependencyTask = tasks.find((t) => t.id === dependency_task_id);
    const parentTask = tasks.find((t) => t.id === parent_task_id);

    if (!dependencyTask) {
      return {
        success: false,
        status: 404,
        message: "Dependency task not found",
      };
    }
    if (!parentTask) {
      return { success: false, status: 404, message: "Parent task not found" };
    }

    await queryWithLogAudit({
      action : "update",
      req,
      updated_columns : ["dependency_task_id", "parent_task_id "],
      remarks: "Adding dependency task (many to many relation)",
      queryCallBack: async (t) => {
        return await dependencyTask.addParentTask(parentTask, {transaction: t, ...withContext(req)});
      }
    });

    
    return {
      success: true,
      status: 200,
      data: { task: parentTask, dependencyTask },
    };
  }

  async removeTaskDependency(req, { dependency_task_id, parent_task_id }) {
    const {Task, TaskDependency} = req.db;

    if (dependency_task_id === parent_task_id) {
      return {
        success: false,
        status: 409,
        message: "Parent and dependency task cannot be same",
      };
    }

    // Check if relation exists
    const existingRelation = await TaskDependency.findOne({
      where: {
        dependency_task_id,
        parent_task_id,
      },
    });

    if (!existingRelation) {
      return {
        success: false,
        status: 404,
        message: "Task dependency not found",
      };
    }

    // Fetch both tasks
    const tasks = await Task.findAll({
      where: { id: [dependency_task_id, parent_task_id] },
    });

    const dependencyTask = tasks.find((t) => t.id === dependency_task_id);
    const parentTask = tasks.find((t) => t.id === parent_task_id);

    if (!dependencyTask) {
      return {
        success: false,
        status: 404,
        message: "Dependency task not found",
      };
    }
    if (!parentTask) {
      return { success: false, status: 404, message: "Parent task not found" };
    }

    await queryWithLogAudit({
      action : "update",
      req,
      updated_columns : ["dependency_task_id", "parent_task_id "],
      remarks: "Removed dependency task (many to many relation)",
      queryCallBack: async (t) => {
        return await dependencyTask.removeParentTask(parentTask, {transaction: t, ...withContext(req)});
      },
      model: TaskDependency
    });


    return {
      success: true,
      status: 200,
      message: "Task dependency removed successfully",
    };
  }

  /**
   * Get all tasks for a project (optionally filter by department, status, assignee)
   */
  async getTasks(req, { project_id, department_id, onlyUser, statusFilter = null }, { query = {} }) {
    const {Task, Project} = req.db;

    const filter = {};
    if (project_id) {
      const project = await Project.findByPk(project_id);
  
      if (!project)
        return { status: 404, success: false, message: "Project not found!.. " };
      
      filter.project_id = project_id;
    }


    const STATUS_VALUES = ['approve_pending', "approved", 'in_progress', 'completed', 'blocked', "assign_pending", "checklist_removed", "accept_pending", "reject"];
    const TASK_FOR_VALUES = ["normal", "issue", "checklist", "help"];

    if (STATUS_VALUES.includes(statusFilter)) {
      filter.status = statusFilter;
    }

    if (TASK_FOR_VALUES.includes(statusFilter)) {
      filter.task_for = statusFilter;
    }

    if (department_id) filter.department_id = department_id;

    if (project_id && department_id) {
      filter.status = { [Op.in]: ["approved", "in_progress"] };
    }


    const extrasInQuery = {
      include : [
        { association : "project", required : true },
        {
          association: "assigned",
          ...(onlyUser ? { where: { user_id: req.user.id }, required: true } : {}),
        },
        { association : "helperTasks", attributes: ["id"]  },
        { association : "dependencyTasks", attributes: ["id"]  },
        { association : "parentTasks", attributes: ["id"]  },

      ]
    };


    const result = await paginateHelperFunction({model: Task, whereFilters : filter, query, extrasInQuery });
    
    return { success: true, status: 200, data: result };
  }

  async getTasksForDailyLog(req, { query = {} }) { 
    const {Task, DailyLog} = req.db;
  
    const today = new Date().toISOString().split("T")[0];

    // Find all task_ids already logged TODAY by THIS USER
    const loggedTaskIds = await DailyLog.findAll({
      attributes: ["task_id"],
      where: {
        date: today,
        user_id: req.user.id,       // <<=== Filter for logged-in user
        deleted_at: null
      },
      raw: true
    }).then(rows => rows.map(r => r.task_id));


    //  Main task filter
    const filter = {
      status: { [Op.in]: ["in_progress", "approved"] },
      id: { [Op.notIn]: loggedTaskIds },   // exclude tasks logged today by this user
    };

    const extrasInQuery = {
      include : [
        { association : "project", required : true },
        {
          association: "assigned",
          required: true,
          where: { user_id: req.user.id },   // user assigned filter
        }
      ]
    };

    const result = await paginateHelperFunction({
      model: Task,
      whereFilters: filter,
      query,
      extrasInQuery
    });

    return { success: true, status: 200, data: result };
  }





  /**
   * Soft delete a task
   */
  async deleteTask(req, taskId) {
    const {Task} = req.db;

    const task = await Task.findByPk(taskId, {include : [{association: "assigned"}]});
    if (!task) {
      return { success: false, status: 404, message: "Task not found" };
    }

    const allowedDeleteStatus = ["approve_pending", "approved", "assign_pending", "accept_pending"];

    if (!allowedDeleteStatus.includes(task.status)) {
      return {
        success: false,
        status: 409,
        message: `Task cannot be deleted because it is in '${task.status}' state.`
      };
    }

    const notificationData = {
      scope: "individual",
      title: `Task is deleted`,
      message: `${task.title} Task is deleted of the project.`,
      triggeredById: req?.user?.id,
      entityType: "task",
      entityId: task.id,
      userId: task?.assigned?.user_id,
    };

    await queryWithLogAudit({
      action: "delete",
      req,
      queryCallBack : async (t) => {
        const taskDeleted = await task.destroy({...withContext(req), transaction: t});
        
        if (task?.assigned?.user_id) await createNotification(req, notificationData);

        return taskDeleted;

      },
    });
    
    return { success: true, status: 200, message: "Task deleted successfully" };
  }

  async getDependencyTask(req, { task_id }) {
    const {Task} = req.db;

    const task = await Task.findByPk(task_id, {
      include: [{ association: "dependencyTasks", attributes: ["id"], through: { attributes: [] }, }],
    });

    if (!task) {
      return { success: false, status: 404, message: "Task not found" };
    }

    const taskIds = task.dependencyTasks.map(t => t.id);

    const dependencyTasks = await paginateHelperFunction({
      model: Task,
      query: req.query,
      whereFilters: { id: { [Op.in]: taskIds } }
    });



    return { success: true, status: 200, data: dependencyTasks };
  }
  async getParentTasks(req, { task_id }) {
    const {Task} = req.db;

    const task = await Task.findByPk(task_id, {
      include: [{ association: "parentTasks", attributes: ["id"], through: { attributes: [] }, }],
    });

    if (!task) {
      return { success: false, status: 404, message: "Task not found" };
    }

    const taskIds = task.parentTasks.map(t => t.id);

    const parentTasks = await paginateHelperFunction({
      model: Task,
      query: req.query,
      whereFilters: { id: { [Op.in]: taskIds } }
    });



    return { success: true, status: 200, data: parentTasks };
  }

  async addTaskHelper(req, { task_id, helper_task_id }) {
    const {Task} = req.db;

    if (task_id === helper_task_id) {
      return {
        success: false,
        status: 400,
        message: "Task and helper task cannot be the same.",
      };
    }

    // check duplicate
    const existingHelper = await Task.findOne({
      where: {
        id: helper_task_id,
        helped_for: task_id,
        id: task_id,
        helped_for: helper_task_id,
      },
    });

    if (existingHelper) {
      return {
        success: false,
        status: 400,
        message: "Same Helper already assigned to this task",
      };
    }

    // ensure both task and member exist
    const taskIds = [task_id, helper_task_id].filter(Boolean); // removes null/undefined

    const [task, helperTask] = await Task.findAll({
      where: { id: taskIds },
      include : [{association: "assigned"}],
    }).then((tasks) => {
      const main = tasks.find((t) => t.id === task_id) || null;
      const helper = tasks.find((t) => t.id === helper_task_id) || null;
      return [main, helper];
    });

    if (!task) return { success: false, status: 404, message: "Task not found" };
    if (!helperTask) return { success: false, status: 404, message: "Helper Task not found" };
    if (req.user.id !== helperTask.assigned?.user_id ) return {success: false, status: 401, };
    if (task.assigned_to === helperTask.assigned_to) return {success: false, status: 401, message : "Helper task cant assigned to same person"};
    if (task.project_id !== helperTask.project_id) return {success: false, status: 401, message : "Other project task cannot be assigned"};

    await auditLogUpdateHelperFunction({model:helperTask, data: {helped_for: task.id, task_for: "help"}, req });

    return { success: true, status: 201, data: helperTask };
  }

  async removeTaskHelper(req, { parent_task_id, helper_task_id }) {
    const {Task} = req.db;

    const existingHelper = await Task.findOne({
      where: { helped_for: parent_task_id, id: helper_task_id },
      include : [{association: "assigned"}],
    });

    if (!existingHelper) {
      return { success: false, status: 404, message: "Task helper not found" };
    }

    if (existingHelper.assigned?.user_id !== req.user.id) return {success: false, status: 401, }; 
     
    await auditLogUpdateHelperFunction({model:existingHelper, data: { helped_for: null, task_for: "normal" }, req });

    return {
      success: true,
      status: 200,
      message: "Task helper removed successfully",
    };
  }

  async getAcceptableTask(req) {
    const {Task} = req.db;

    const extrasInQuery = {include: [
        {association: "assigned", where : {user_id: req.user.id}, required : true },
        {association: "helpedTask", include : [{association: "assigned"}] },

      ], }

    const helpingTasks = await paginateHelperFunction({
      model : Task,
      extrasInQuery,
      whereFilters: { task_for: "help", status : "accept_pending" },
      query: req.query
    });

    return { success: true, status: 200, data: helpingTasks };
  }

  async assignChecklistTask(req, data) {
    const {Task, ProjectMember} = req.db;
    try {
      const task = await Task.findOne({
        where: {
          id: data.task_id,
          status: "assign_pending",
          project_feature_id: { [Op.ne]: null },
        },
      });

      if (!task)
        return { success: false, message: "Task not found.", status: 404 };

      const assignedMember = await ProjectMember.findByPk(
        data.project_member_id,
        {
          include: [
            {
              association: "project", // must match the alias in your model association
              required: true, // ensures INNER JOIN (will return null if no project)
            },
          ],
        }
      );

      if (!assignedMember)
        return {
          success: false,
          message: "Project member not found",
          status: 404,
        };

      const project = assignedMember.project;

      const user = req.user;

      let assigneeMemberId;

      if (user.id === assignedMember.user_id) {
        assigneeMemberId = assignedMember.id;
        data.status = "approve_pending";
      } else {
        const assigneeMember = await ProjectMember.findOne({
          where: {
            project_id: project.id,
            user_id: user.id,
            department_id: assignedMember.department_id,
          },
        });

        if (!assigneeMember)
          return {
            success: false,
            message: "No access to assign member to this proejct",
            status: 403,
          };

        assigneeMemberId = assigneeMember.id;
        data.status = "approved";
        data.approved_by = assigneeMember.id;
      }

      const finalData = {
        due_date: data.due_date,
        assignee: assigneeMemberId,
        assigned_to: assignedMember.id,
        approved_by: data.approved_by,
        status: data.status,
      };

      // TODO: add hierarchy logic → check if `creator` has permission to assign or create for others
      // (e.g., compare `creator.role_level` vs `assignee.role_level` if your system tracks hierarchy)


      await queryWithLogAudit({
        action : "update",
        req, 
        updated_columns: Object.keys(finalData),
        remarks: "assign member to checklist task",
        queryCallBack : async (t) => {
          const updatedTast = await task.update(finalData, {transaction: t, ...withContext(req)});

          const notificationData = {
            scope: "individual",
            title: `Assigned to task`,
            message: `You are assigned to the task of ${task.title}`,
            triggeredById: req?.user?.id,
            entityType: "task",
            entityId: task.id,
            userId: assignedMember.user_id,
          };

          const notificationResult = await createNotification(
            req,
            notificationData,
          );

          return updatedTast;
        }

      });
      

      return { success: true, status: 201, data: task };
    } catch (err) {
      if (err instanceof Sequelize.ValidationError) {
        console.log(err);
        return {
          success: false,
          status: 422,
          message: "Validation Error",
          errors: giveValicationErrorFormal(err),
        };
      }
      throw err;
    }
  }


  async updateTask (req, data) {
    const {Task} = req.db;

    try {
      const task = await Task.findByPk(data.task_id, { include : [ {association : "assigned", require: true} ] });

      if (!task) return {success: false, message: "Task not found!.", status: 404};

      if (task.live_status === "running") return {success : false, message : "Please stop the task!.", status: 409}; 

      if (data.status === "completed" && task.status === "completed") return {success: false, message: "Task is already completed", status : 409}; 
      if (data.status === "completed" && task.status !== "in_progress") return {success: false, message: "Task can be completed only if in progress state", status : 409}; 

      if (task.assigned?.user_id !== req.user.id) return {success: false, message : "Not autorized", status : 401};

      await auditLogUpdateHelperFunction({model: task, data, req});

      return { success: true, status: 201, data: task };
    } catch (err) {
      if (err instanceof Sequelize.ValidationError) {
        console.log(err);
        return {
          success: false,
          status: 422,
          message: "Validation Error",
          errors: giveValicationErrorFormal(err),
        };
      }
      throw err;
    }
  }

  async getAssistedTasks (req, taskId) {
    const {Task} = req.db;

    const task = await Task.findByPk(taskId, {
      include : [
        {association: "assigned"}
      ],
    });

    if (!task) return {message : "Task not found!...", status: 404, success: false};
    
    if ( task.assigned?.user_id !== req.user.id )  return { status: 401, success: false};

    const assistedTasks = await paginateHelperFunction({ model: Task, whereFilters:{ helped_for: task.id,  }, query: req.query });

    return {success: true, data : assistedTasks, status:200};
  }
  
  async helperAcceptOrReject (req, {status, taskId}) {
    const {Task} = req.db;

    const task = await Task.findByPk(taskId, {
      where : { task_for: "help", status : "accept_pending" },
      include : [
        {association: "assigned", where : {user_id : req.user.id}, required: true},
      ],
    });

    if (!task) return {message : "Task not found!...", status: 404, success: false};
    const updateStatus = (status === "accept") ? "in_progress" : "reject"; 

    await auditLogUpdateHelperFunction({model: task, data: {status : updateStatus}, req});


    return {success: true, data : task, status:200, message: "Task " + status + "ed successfully!.."};
  }


}

module.exports = new TaskService();
