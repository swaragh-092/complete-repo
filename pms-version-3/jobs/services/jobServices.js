// Author: Gururaj
// Created: 14th Oct 2025
// Description: Job service helpers with business logic for auto-ending tasks and user-story timers invoked by CronJobs.
// Version: 1.0.0
// Modified:

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

  // Auto-stop any UserStory timers left running at end-of-day
  // Also closes any open WorkLog sessions so reports remain accurate.
  static async autoEndAllUserStoryTimers(sequelize, models) {
    const { UserStory, WorkLog } = models;
    if (!UserStory)
      return {
        success: false,
        status: 500,
        message: "UserStory model not found",
      };

    const stories = await UserStory.findAll({
      where: { live_status: "running" },
    });
    const now = new Date();
    const updates = [];

    for (const story of stories) {
      if (story.taken_at) {
        const workedMs = now - new Date(story.taken_at);
        const workedMinutes = Math.round(workedMs / 60000);
        updates.push({
          id: story.id,
          total_work_time: (story.total_work_time || 0) + workedMinutes,
          taken_at: null,
          live_status: "stop",
        });

        // Close any open WorkLog sessions for this story
        if (WorkLog) {
          try {
            await WorkLog.update(
              { end_time: now, duration_minutes: Math.max(workedMinutes, 0) },
              {
                where: { user_story_id: story.id, end_time: null },
                ignoreOrganizationFilter: true,
              },
            );
          } catch (wlErr) {
            console.error(
              "WorkLog auto-close error (non-fatal):",
              wlErr?.message || wlErr,
            );
          }
        }
      }
    }

    if (updates.length) {
      const updateColumns = ["total_work_time", "taken_at", "live_status"];
      const query = async (t) => {
        return await UserStory.bulkCreate(
          updates,
          { updateOnDuplicate: updateColumns },
          { transaction: t },
        );
      };
      const result = await queryWithLogAudit({
        req: null,
        action: "bulk_update",
        queryCallBack: query,
        updated_columns: updateColumns,
        remarks: "auto-stopped all running user story timers at end of day",
      });
      return { success: true, status: 200, data: result };
    }

    return {
      success: false,
      status: 404,
      message: "No user story timers running",
    };
  }
}

module.exports = JobService;
