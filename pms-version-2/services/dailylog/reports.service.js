// Author: Gururaj
// Description: Reports Service (DailyLog Analytics)
// Version: 1.0.0

const { Op } = require("sequelize");
const reportHelperFunction = require("../../util/reportHelperFunction");

class ReportsService {
  /**
   * 🔹 Fully Dynamic Daily Log Report
   * Supports:
   * ?from=
   * ?to=
   * ?group_by=date,status
   * ?aggregate=sum(actual_duration),count(id)
   */
  static async dailyLogReport(req) {
    const { DailyLog } = req.db;
    const { from, to, group_by, aggregate } = req.query;

    const whereFilters = {
      user_id: req.user.id,
    };

    // 🔹 Date filter
    if (from && to) {
      whereFilters.date = {
        [Op.between]: [from, to],
      };
    }

    // 🔹 Parse group_by
    const groupBy = group_by ? group_by.split(",").map((g) => g.trim()) : [];

    // 🔹 Parse aggregate
    const aggregateList = [];

    if (aggregate) {
      const items = aggregate.split(",");

      items.forEach((item) => {
        const match = item.match(/(\w+)\((.*?)\)/);

        if (match) {
          const fn = match[1].toUpperCase();
          const field = match[2];

          aggregateList.push({
            fn,
            field,
            alias: `${fn.toLowerCase()}_${field}`,
          });
        }
      });
    }

    const result = await reportHelperFunction({
      model: DailyLog,
      whereFilters,
      aggregate: aggregateList,
      groupBy,
      orderQuery: groupBy.length
        ? { order: groupBy.map((g) => [g, "ASC"]) }
        : {},
      query: req.query,
    });

    return {
      success: true,
      status: 200,
      data: result,
    };
  }

  /**
   * 🔹 Productivity Summary (Planned vs Actual)
   */
  static async productivitySummary(req) {
    const { DailyLog } = req.db;
    const { from, to } = req.query;

    const whereFilters = {
      user_id: req.user.id,
    };

    if (from && to) {
      whereFilters.date = {
        [Op.between]: [from, to],
      };
    }

    const result = await reportHelperFunction({
      model: DailyLog,
      whereFilters,
      aggregate: [
        { fn: "SUM", field: "expected_duration", alias: "total_expected" },
        { fn: "SUM", field: "actual_duration", alias: "total_actual" },
        {
          literal: "SUM(actual_duration) - SUM(expected_duration)",
          alias: "variance",
        },
        { fn: "COUNT", field: "id", alias: "total_logs" },
      ],
      query: req.query,
    });

    return {
      success: true,
      status: 200,
      data: result[0] || {},
    };
  }

  /**
   * 🔹 Status Distribution (Wrapup Only)
   */
  static async statusDistribution(req) {
    const { DailyLog } = req.db;

    const result = await reportHelperFunction({
      model: DailyLog,
      whereFilters: {
        user_id: req.user.id,
        log_type: "wrapup",
      },
      aggregate: [{ fn: "COUNT", field: "id", alias: "count" }],
      groupBy: ["status"],
      query: req.query,
    });

    return {
      success: true,
      status: 200,
      data: result,
    };
  }

  /**
   * 🔹 Project Summary
   */
  static async projectSummary(req, project_id) {
    const { DailyLog } = req.db;

    const result = await reportHelperFunction({
      model: DailyLog,
      whereFilters: {
        user_id: req.user.id,
        project_id,
      },
      aggregate: [
        { fn: "COUNT", field: "id", alias: "total_logs" },
        { fn: "SUM", field: "actual_duration", alias: "total_time_spent" },
      ],
      groupBy: ["project_id"],
      query: req.query,
    });

    return {
      success: true,
      status: 200,
      data: result[0] || {},
    };
  }

  /**
   * 🔹 Comprehensive User Project Report (Ongoing Projects Only)
   * Answers:
   * 1. Actual working hours on each project and total working hours
   * 2. Total tasks completed
   * 3. Total ongoing tasks (not completed)
   * 4. Project-wise distinction
   * 5. Paginated logs for required dates
   */
  static async userProjectReport(req) {
    try {
      const { Project, Task, DailyLog, ProjectMember } = req.db;
      const { from, to, page = 1, pageSize = 10 } = req.query;
      const userId = req.user.id;

      // 1. Get all active projects for this user
      const userProjectIds = await ProjectMember.findAll({
        attributes: ["project_id"],
        where: { user_id: userId, is_active: true },
        raw: true,
      });
      const projectIds = userProjectIds.map((p) => p.project_id);

      if (!projectIds.length) {
        return {
          success: true,
          status: 200,
          data: {
            projects: [],
            total_working_minutes: 0,
            total_completed_tasks: 0,
            total_ongoing_tasks: 0,
            logs: [],
            total_logs: 0,
          },
        };
      }

      // 2. Get ongoing projects (not completed)
      const ongoingProjects = await Project.findAll({
        where: { id: { [Op.in]: projectIds }, is_completed: false },
        raw: true,
      });
      const ongoingProjectIds = ongoingProjects.map((p) => p.id);

      if (!ongoingProjectIds.length) {
        return {
          success: true,
          status: 200,
          data: {
            projects: [],
            total_working_minutes: 0,
            total_completed_tasks: 0,
            total_ongoing_tasks: 0,
            logs: [],
            total_logs: 0,
          },
        };
      }

      // 3. Aggregate working hours per project
      const logsWhere = {
        user_id: userId,
        project_id: { [Op.in]: ongoingProjectIds },
      };
      if (from && to) {
        logsWhere.date = { [Op.between]: [from, to] };
      }

      const allLogs = await DailyLog.findAll({
        attributes: [
          "project_id",
          [
            DailyLog.sequelize.fn(
              "SUM",
              DailyLog.sequelize.col("actual_duration"),
            ),
            "total_working_minutes",
          ],
        ],
        where: logsWhere,
        group: ["project_id"],
        raw: true,
      });

      // 4. Get completed and ongoing tasks per project (only for logs in date range)
      // Get task IDs that have logs in the selected date range
      const tasksInDateRange = await DailyLog.findAll({
        attributes: [
          "task_id",
          "project_id",
          [
            DailyLog.sequelize.fn("COUNT", DailyLog.sequelize.col("id")),
            "log_count",
          ],
        ],
        where: logsWhere,
        group: ["task_id", "project_id"],
        raw: true,
      });

      const taskIds = tasksInDateRange
        .map((t) => t.task_id)
        .filter((id) => id !== null && id !== undefined);

      let allTasks = [];
      if (taskIds.length > 0) {
        allTasks = await Task.findAll({
          attributes: [
            "project_id",
            [
              Task.sequelize.fn(
                "COUNT",
                Task.sequelize.literal(
                  "CASE WHEN status = 'completed' THEN 1 END",
                ),
              ),
              "completed_tasks",
            ],
            [
              Task.sequelize.fn(
                "COUNT",
                Task.sequelize.literal(
                  "CASE WHEN status != 'completed' THEN 1 END",
                ),
              ),
              "ongoing_tasks",
            ],
          ],
          where: {
            id: { [Op.in]: taskIds },
            project_id: { [Op.in]: ongoingProjectIds },
          },
          group: ["project_id"],
          raw: true,
        });
      }

      // 5. Compose stats
      let total_working_minutes = 0,
        total_completed_tasks = 0,
        total_ongoing_tasks = 0;
      const projectStats = {};

      allLogs.forEach((l) => {
        projectStats[l.project_id] = {
          total_working_minutes: Number(l.total_working_minutes || 0),
          completed_tasks: 0,
          ongoing_tasks: 0,
        };
        total_working_minutes += Number(l.total_working_minutes || 0);
      });

      allTasks.forEach((t) => {
        if (!projectStats[t.project_id]) {
          projectStats[t.project_id] = {
            total_working_minutes: 0,
            completed_tasks: 0,
            ongoing_tasks: 0,
          };
        }
        projectStats[t.project_id].completed_tasks = Number(
          t.completed_tasks || 0,
        );
        projectStats[t.project_id].ongoing_tasks = Number(t.ongoing_tasks || 0);
        total_completed_tasks += Number(t.completed_tasks || 0);
        total_ongoing_tasks += Number(t.ongoing_tasks || 0);
      });

      // 6. Paginated logs
      const logsPage = await DailyLog.findAndCountAll({
        where: logsWhere,
        include: [
          { model: Project, as: "project", attributes: ["id", "name"] },
          { model: Task, as: "task", attributes: ["id", "title", "status"] },
        ],
        order: [["date", "DESC"]],
        offset: (page - 1) * pageSize,
        limit: Number(pageSize),
      });

      // 7. Compose project-wise distinction
      const projects = ongoingProjects.map((p) => ({
        ...p,
        ...projectStats[p.id],
      }));

      return {
        success: true,
        status: 200,
        data: {
          projects,
          total_working_minutes,
          total_completed_tasks,
          total_ongoing_tasks,
          logs: logsPage.rows,
          total_logs: logsPage.count,
        },
      };
    } catch (err) {
      console.error("Error in userProjectReport:", err);
      return {
        success: false,
        status: 500,
        message: "Error fetching user project report",
      };
    }
  }
}

module.exports = ReportsService;
