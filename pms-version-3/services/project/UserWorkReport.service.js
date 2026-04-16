// Author: Gururaj
// Created: 1st Jan 2026
// Description: User work-report service for daily, per-project, and per-department work-log aggregation.
// Version: 1.0.0
// Modified:

// Description: User Work Report Service — aggregates WorkLog data by day / project / department
// Version: 1.0.0

const { Op, Sequelize } = require("sequelize");

class UserWorkReportService {
  /**
   * Daily work report for the requesting user (or a given user_id).
   * Returns an array of day-objects, each containing total minutes and
   * a list of individual timer sessions.
   */
  static async getDailyReport(req, { start_date, end_date, user_id }) {
    const { WorkLog, UserStory, Feature, Project, Sprint } = req.db;
    const userId = user_id || req.user?.id;

    const where = {
      user_id: userId,
      log_date: { [Op.between]: [start_date, end_date] },
      end_time: { [Op.not]: null },
    };

    const logs = await WorkLog.findAll({
      where,
      include: [
        {
          model: UserStory,
          as: "userStory",
          attributes: ["id", "title", "status", "story_points"],
          required: false,
        },
        {
          model: Feature,
          as: "feature",
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: Sprint,
          as: "sprint",
          attributes: ["id", "name"],
          required: false,
        },
      ],
      order: [
        ["log_date", "ASC"],
        ["start_time", "ASC"],
      ],
    });

    // Group by date
    const dailyMap = {};
    logs.forEach((log) => {
      const date = log.log_date;
      if (!dailyMap[date]) {
        dailyMap[date] = { date, total_minutes: 0, sessions: [] };
      }
      dailyMap[date].total_minutes += log.duration_minutes || 0;
      dailyMap[date].sessions.push({
        id: log.id,
        user_story_id: log.user_story_id,
        user_story_title: log.userStory?.title || "Unknown",
        user_story_status: log.userStory?.status || null,
        feature_id: log.feature_id,
        feature_name: log.feature?.name || "Unknown",
        project_id: log.project_id,
        project_name: log.project?.name || "Unknown",
        sprint_id: log.sprint_id,
        sprint_name: log.sprint?.name || null,
        start_time: log.start_time,
        end_time: log.end_time,
        duration_minutes: log.duration_minutes || 0,
      });
    });

    const data = Object.values(dailyMap).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const total_minutes = data.reduce((sum, d) => sum + d.total_minutes, 0);

    return {
      success: true,
      status: 200,
      data,
      meta: { total_minutes, days: data.length, user_id: userId },
    };
  }

  /**
   * Project-wise work report — how long the user worked on a project,
   * broken down by feature → user story.
   */
  static async getProjectReport(
    req,
    projectId,
    { start_date, end_date, user_id },
  ) {
    const { WorkLog, UserStory, Feature, Sprint } = req.db;
    const userId = user_id || req.user?.id;

    const where = {
      user_id: userId,
      project_id: projectId,
      end_time: { [Op.not]: null },
    };
    if (start_date && end_date) {
      where.log_date = { [Op.between]: [start_date, end_date] };
    }

    const logs = await WorkLog.findAll({
      where,
      include: [
        {
          model: UserStory,
          as: "userStory",
          attributes: ["id", "title", "status", "story_points"],
          required: false,
        },
        {
          model: Feature,
          as: "feature",
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: Sprint,
          as: "sprint",
          attributes: ["id", "name"],
          required: false,
        },
      ],
      order: [
        ["log_date", "ASC"],
        ["start_time", "ASC"],
      ],
    });

    // Group: feature → user_story → sessions
    const featureMap = {};
    let totalMinutes = 0;

    logs.forEach((log) => {
      const fid = log.feature_id;
      if (!featureMap[fid]) {
        featureMap[fid] = {
          feature_id: fid,
          feature_name: log.feature?.name || "Unknown",
          total_minutes: 0,
          user_stories: {},
        };
      }
      const feat = featureMap[fid];
      const mins = log.duration_minutes || 0;
      feat.total_minutes += mins;
      totalMinutes += mins;

      const uid = log.user_story_id;
      if (uid) {
        if (!feat.user_stories[uid]) {
          feat.user_stories[uid] = {
            user_story_id: uid,
            title: log.userStory?.title || "Unknown",
            status: log.userStory?.status || null,
            story_points: log.userStory?.story_points || null,
            total_minutes: 0,
            sessions: [],
          };
        }
        feat.user_stories[uid].total_minutes += mins;
        feat.user_stories[uid].sessions.push({
          id: log.id,
          log_date: log.log_date,
          sprint_id: log.sprint_id,
          sprint_name: log.sprint?.name || null,
          start_time: log.start_time,
          end_time: log.end_time,
          duration_minutes: mins,
        });
      }
    });

    const data = Object.values(featureMap).map((f) => ({
      ...f,
      user_stories: Object.values(f.user_stories).sort(
        (a, b) => b.total_minutes - a.total_minutes,
      ),
    }));

    return {
      success: true,
      status: 200,
      data,
      meta: {
        total_minutes: totalMinutes,
        project_id: projectId,
        user_id: userId,
      },
    };
  }

  /**
   * Department-wise work report — all work done within a department,
   * broken down project → feature → user story.
   */
  static async getDepartmentReport(
    req,
    departmentId,
    { start_date, end_date, user_id },
  ) {
    const { WorkLog, UserStory, Feature, Project, Sprint } = req.db;
    const userId = user_id || req.user?.id;

    const where = {
      user_id: userId,
      department_id: departmentId,
      end_time: { [Op.not]: null },
    };
    if (start_date && end_date) {
      where.log_date = { [Op.between]: [start_date, end_date] };
    }

    const logs = await WorkLog.findAll({
      where,
      include: [
        {
          model: UserStory,
          as: "userStory",
          attributes: ["id", "title", "status", "story_points"],
          required: false,
        },
        {
          model: Feature,
          as: "feature",
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: Sprint,
          as: "sprint",
          attributes: ["id", "name"],
          required: false,
        },
      ],
      order: [
        ["log_date", "ASC"],
        ["start_time", "ASC"],
      ],
    });

    // Group: project → feature → user_story → sessions
    const projectMap = {};
    let totalMinutes = 0;

    logs.forEach((log) => {
      const pid = log.project_id;
      if (!projectMap[pid]) {
        projectMap[pid] = {
          project_id: pid,
          project_name: log.project?.name || "Unknown",
          total_minutes: 0,
          features: {},
        };
      }
      const proj = projectMap[pid];
      const mins = log.duration_minutes || 0;
      proj.total_minutes += mins;
      totalMinutes += mins;

      const fid = log.feature_id;
      if (!proj.features[fid]) {
        proj.features[fid] = {
          feature_id: fid,
          feature_name: log.feature?.name || "Unknown",
          total_minutes: 0,
          user_stories: {},
        };
      }
      const feat = proj.features[fid];
      feat.total_minutes += mins;

      const uid = log.user_story_id;
      if (uid) {
        if (!feat.user_stories[uid]) {
          feat.user_stories[uid] = {
            user_story_id: uid,
            title: log.userStory?.title || "Unknown",
            status: log.userStory?.status || null,
            story_points: log.userStory?.story_points || null,
            total_minutes: 0,
            sessions: [],
          };
        }
        feat.user_stories[uid].total_minutes += mins;
        feat.user_stories[uid].sessions.push({
          id: log.id,
          log_date: log.log_date,
          sprint_id: log.sprint_id,
          sprint_name: log.sprint?.name || null,
          start_time: log.start_time,
          end_time: log.end_time,
          duration_minutes: mins,
        });
      }
    });

    const data = Object.values(projectMap).map((p) => ({
      ...p,
      features: Object.values(p.features).map((f) => ({
        ...f,
        user_stories: Object.values(f.user_stories).sort(
          (a, b) => b.total_minutes - a.total_minutes,
        ),
      })),
    }));

    return {
      success: true,
      status: 200,
      data,
      meta: {
        total_minutes: totalMinutes,
        department_id: departmentId,
        user_id: userId,
      },
    };
  }

  /**
   * Overview — aggregated summary of the user's work across all projects,
   * departments, and dates. Used to populate overview cards and the
   * department/project selector dropdowns.
   */
  static async getOverview(req, { start_date, end_date, user_id }) {
    const { WorkLog, Project } = req.db;
    const userId = user_id || req.user?.id;

    const where = { user_id: userId, end_time: { [Op.not]: null } };
    if (start_date && end_date) {
      where.log_date = { [Op.between]: [start_date, end_date] };
    }

    // By project
    const byProject = await WorkLog.findAll({
      where,
      attributes: [
        "project_id",
        [
          Sequelize.fn("SUM", Sequelize.col("WorkLog.duration_minutes")),
          "total_minutes",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("WorkLog.id")), "session_count"],
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("user_story_id")),
          ),
          "unique_stories",
        ],
        [Sequelize.fn("MIN", Sequelize.col("log_date")), "first_date"],
        [Sequelize.fn("MAX", Sequelize.col("log_date")), "last_date"],
      ],
      include: [{ model: Project, as: "project", attributes: ["id", "name"] }],
      group: ["WorkLog.project_id", "project.id"],
      raw: true,
    });

    // By department
    const byDepartment = await WorkLog.findAll({
      where,
      attributes: [
        "department_id",
        [
          Sequelize.fn("SUM", Sequelize.col("duration_minutes")),
          "total_minutes",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("WorkLog.id")), "session_count"],
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("project_id")),
          ),
          "unique_projects",
        ],
      ],
      group: ["department_id"],
      raw: true,
    });

    // Daily totals (for bar/line chart)
    const byDay = await WorkLog.findAll({
      where,
      attributes: [
        "log_date",
        [
          Sequelize.fn("SUM", Sequelize.col("duration_minutes")),
          "total_minutes",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("WorkLog.id")), "session_count"],
      ],
      group: ["log_date"],
      order: [["log_date", "ASC"]],
      raw: true,
    });

    const grandTotal = byDay.reduce(
      (s, d) => s + (parseInt(d.total_minutes) || 0),
      0,
    );

    return {
      success: true,
      status: 200,
      data: {
        by_project: byProject.map((p) => ({
          project_id: p.project_id,
          project_name: p["project.name"] || "Unknown",
          total_minutes: parseInt(p.total_minutes) || 0,
          session_count: parseInt(p.session_count) || 0,
          unique_stories: parseInt(p.unique_stories) || 0,
          first_date: p.first_date,
          last_date: p.last_date,
        })),
        by_department: byDepartment.map((d) => ({
          department_id: d.department_id,
          total_minutes: parseInt(d.total_minutes) || 0,
          session_count: parseInt(d.session_count) || 0,
          unique_projects: parseInt(d.unique_projects) || 0,
        })),
        by_day: byDay.map((d) => ({
          date: d.log_date,
          total_minutes: parseInt(d.total_minutes) || 0,
          session_count: parseInt(d.session_count) || 0,
        })),
        grand_total_minutes: grandTotal,
      },
      meta: { user_id: userId, start_date, end_date },
    };
  }
}

module.exports = UserWorkReportService;
