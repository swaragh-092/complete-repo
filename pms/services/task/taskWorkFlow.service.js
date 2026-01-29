// Author: Gururaj
// Created: 14th oct 2025
// Description: task work flow service related logics.
// Version: 1.0.0
// Modified:


const {
  Sequelize,
} = require("sequelize");
const { withContext, giveValicationErrorFormal, auditLogUpdateHelperFunction } = require("../../util/helper");
const { queryWithLogAudit } = require("../auditLog.service");

class TaskService {
  /**
   * Create a task
   * Only allowed if the creator has hierarchical permission in the project/department
   * @param {Object} data - Task data { project_id, department_id, title, description, ... }
   * @param {Object} options - Optional params ({ req })
   * @returns {Promise<Object>}
   */
  async takeTask(req, taskId) {
    const { Task } = req.db;
    try {
      const task = await Task.findByPk(taskId, {
        include: [
          {
            association: "assigned",
            required: true,
            where: { user_id: req.user.id },
          },
        ],
      });

      if (!task)
        return {
          success: false,
          status: 404,
          message: "Your Task not found!.",
        };

      if (task.status !== "in_progress" && task.status !== "approved")
        return {
          success: false,
          status: 401,
          message: "The task is " + task.status + " state cannot start.",
        };

      if (task.live_status === "running")
        return {
          success: false,
          status: 409,
          message: "The task is already in running stage.",
        };

      await this.endTasks(req);

      const updateData = {
        last_start_time: new Date(),
        live_status: "running",
        last_worked_date: new Date(),
      };

      if ( !task.taken_at ) updateData.taken_at = new Date();

      if (task.status === "approved") updateData.status = "in_progress";

      await auditLogUpdateHelperFunction({model:task, data: updateData, req});

      return { success: true, status: 200, data: task };
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

  async endTasks(req) {
    const { Task } = req.db;
    try {
      const tasks = await Task.findAll({
        where: { live_status: "running" },
        include: [{ association: "assigned", where: { user_id: req.user.id } }],
      });

      const now = new Date();
      const updates = [];

      for (const task of tasks) {
        if (task.last_start_time) {
          const workedMs = now - new Date(task.last_start_time);
          const workedMinutes = Math.floor(workedMs / 60000);

          updates.push({
            id: task.id,
            project_id: task.project_id,
            department_id: task.department_id,
            title: task.title,
            total_work_time: (task.total_work_time || 0) + workedMinutes,
            todays_worked_time: (task.todays_worked_time || 0) + workedMinutes,
            last_start_time: null,
            live_status: "stop",
          });
        }
      }

      if (updates.length) {
        const updateColumns = [
            "total_work_time",
            "todays_worked_time",
            "last_start_time",
            "live_status",
          ];
        await queryWithLogAudit({
          action: "bulk_update",
          req, 
          updated_columns : updateColumns,
          queryCallBack: async (t) => {
            return await Task.bulkCreate(updates, {
              updateOnDuplicate: updateColumns,
            },
            {...withContext(req), transaction: t}
          );
          },
        });
      }

      return { success: true, status: 200, data: tasks };
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

  


  async getCurrentWrokingTask(req) {
    const { Task } = req.db;
    const tasks = await Task.findAll({
      where: { live_status: "running" },
      include : [
        {required: true, association: "assigned", where: {user_id : req.user.id, }},
        { association: "project"},
        { association: "helpedTask"},
        { association: "checklist"},
        { association: "issue"},
      ]
    });
    return {status : 200, success : true, data: tasks}
  }
}

module.exports = new TaskService();
