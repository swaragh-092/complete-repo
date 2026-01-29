const { queryWithLogAudit } = require("../../services/auditLog.service");

class JobService {
  static async autoEndAllTasks(sequelize, models) {
    const { Task } = models;
    const tasks = await Task.findAll({
      ignoreOrganizationFilter: true,
      where: { live_status: "running" },
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
      const query = async (t) => {
        return await Task.bulkCreate(
          updates,
          {
            updateOnDuplicate: updateColumns,
          },
          { transaction: t },
        );
      };

      const result = await queryWithLogAudit({
        req: null,
        action: "bulk_update",
        queryCallBack: query,
        updated_columns: updateColumns,
        remarks: "stopped all left off running task!",
      });

      return { success: true, status: 200, data: result };
    } else {
      return {
        success: false,
        status: 404,
        message: "No task left with running",
      };
    }
  }

  static async generateDailyLogs(sequelize, models) {

    const { Task, DailyLog } = models;

    const today = new Date().toISOString().slice(0, 10);
    const summary = { totalTasks: 0, updated: 0, created: 0 };

    const tasks = await Task.findAll({
      ignoreOrganizationFilter: true,
      include: [
        {
          association: "assigned",
          required: true,
        },
        {
          association: "daily_log",
          required: false, // important!
          where: { date: today },
        },
      ],
      where: {
        [Op.or]: [
          { last_worked_date: today },
          sequelize.where(sequelize.col("daily_log.date"), today),
        ],
      },
    });

    const taskIds = tasks.map((t) => t.id);

    summary.totalTasks = tasks.length;

    if (!tasks.length)
      return { success: true, message: "No activity today", summary };

    // update stand up
    const toUpdateStandUp = [];

    const toCreateWrapUp = [];

    for (const task of tasks) {
      if (task.daily_log.length) {
        const standUp = task.daily_log[0];

        const status =
          task.last_worked_date !== today
            ? "not_taken"
            : task.status === "completed"
              ? "completed"
              : task.status === "blocked"
                ? "blocked"
                : "in_progress";

        toUpdateStandUp.push({
          id: standUp.id,
          project_id: task.project_id,
          user_id: task.assigned.user_id,
          task_id: task.id,
          date: today,
          log_type: "standup",
          actual_duration: task.todays_worked_time || 0,
          status,
          organization_id: task.organization_id,
        });
        summary.updated++;
      } else {
        toCreateWrapUp.push({
          project_id: task.project_id,
          user_id: task.assigned.user_id,
          task_id: task.id,
          date: today,
          log_type: "wrapup",
          expected_duration: null,
          actual_duration: task.todays_worked_time || 0,
          status:
            task.status === "completed"
              ? "completed"
              : task.status === "blocked"
                ? "blocked"
                : "in_progress",

          organization_id: task.organization_id,
        });
        summary.created++;
      }
    }

    const multipleOperation = [];

    //  Perform DB operations efficiently
    if (toCreateWrapUp.length) {
      multipleOperation.push({
        queryCallBack: async (t) => {
          return await DailyLog.bulkCreate(
            toCreateWrapUp,
            { ignoreDuplicates: true },
            { transaction: t },
          );
        },
        updated_columns: Object.keys(toCreateWrapUp[0]),
        action: "bulk_create",
        remarks: "Creating Wrapup which is not in standup by job.",
        model: DailyLog,
      });
    }

    if (toUpdateStandUp.length) {
      const updateColumns = ["actual_duration", "status"];

      multipleOperation.push({
        queryCallBack: async (t) => {
          return await DailyLog.bulkCreate(
            toUpdateStandUp,
            { updateOnDuplicate: updateColumns },
            { transaction: t },
          );
        },
        updated_columns: updateColumns,
        action: "bulk_update",
        remarks: "Updating Wrapup which is already created in standup by job.",
        model: DailyLog,
      });
    }

    multipleOperation.push({
      queryCallBack: async (t) => {
        return await Task.update(
          {
            todays_worked_time: 0,
          },
          {
            where: { id: { [Op.in]: taskIds } },
          },
          { transaction: t, returning: true },
        );
      },
      updated_columns: ["todays_worked_time"],
      action: "bulk_update",
      remarks: "Updating Tasks to make todays work time to 0.",
      model: Task,
    });

    await queryMultipleWithAuditLog({
      req: null,
      operations: multipleOperation,
    });

    return {
      success: true,
      message: "Daily logs auto-generated and updated successfully",
      data: summary,
    };
  }
}


module.exports = JobService;