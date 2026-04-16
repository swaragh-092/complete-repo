// Author: Gururaj
// Created: 1st Jan 2026
// Description: Admin monitor service that aggregates KPI summaries, user/project reports, and worklog analytics.
// Version: 1.0.0
// Modified:

// Description: Admin Monitor Service — cross-user aggregated reporting for org owners/admins
// Version: 1.0.0

const { Op, Sequelize } = require("sequelize");
const { authClient } = require("../serviceClients");

class AdminMonitorService {
  // ─── helpers ────────────────────────────────────────────────────────────────

  static _dateWhere(start_date, end_date) {
    if (start_date && end_date) {
      return { log_date: { [Op.between]: [start_date, end_date] } };
    }
    return {};
  }

  /**
   * Lookup user display names from auth-service.
   * Returns a Map<user_id, displayName>.
   * Failures are swallowed so the rest of the report still works.
   */
  static async _fetchUserNames(userIds) {
    if (!userIds || userIds.length === 0) return {};
    const unique = [...new Set(userIds.filter(Boolean))];
    try {
      const client = authClient();
      const response = await client.post("/auth/internal/users/lookup", {
        user_ids: unique,
      });
      const users = response.data?.data?.users || [];
      const nameMap = {};
      users.forEach((u) => {
        const fn = u.first_name || "";
        const ln = u.last_name || "";
        const full = `${fn} ${ln}`.trim();
        nameMap[u.id] = full || u.username || u.email || u.id;
      });
      return nameMap;
    } catch (err) {
      console.error("[AdminMonitor] Failed to fetch user names:", err.message);
      return {};
    }
  }

  // ─── 1. Admin Summary (dashboard KPIs) ───────────────────────────────────

  /**
   * High-level KPIs across ALL users:
   *   total_minutes, active_users, active_projects, active_departments,
   *   by_user (top contributors), by_project, by_department, daily trend
   */
  static async getAdminSummary(req, { start_date, end_date }) {
    const { WorkLog, Project } = req.db;

    const baseWhere = {
      end_time: { [Op.not]: null },
      ...AdminMonitorService._dateWhere(start_date, end_date),
    };

    // Aggregated by user
    const byUser = await WorkLog.findAll({
      where: baseWhere,
      attributes: [
        "user_id",
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
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("user_story_id")),
          ),
          "unique_stories",
        ],
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("log_date")),
          ),
          "active_days",
        ],
      ],
      group: ["user_id"],
      raw: true,
    });

    // Aggregated by project
    const byProject = await WorkLog.findAll({
      where: baseWhere,
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
            Sequelize.fn("DISTINCT", Sequelize.col("user_id")),
          ),
          "unique_users",
        ],
      ],
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "is_completed"],
        },
      ],
      group: ["WorkLog.project_id", "project.id"],
      raw: true,
    });

    // Aggregated by department
    const byDepartment = await WorkLog.findAll({
      where: baseWhere,
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
            Sequelize.fn("DISTINCT", Sequelize.col("user_id")),
          ),
          "unique_users",
        ],
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

    // Daily trend
    const byDay = await WorkLog.findAll({
      where: baseWhere,
      attributes: [
        "log_date",
        [
          Sequelize.fn("SUM", Sequelize.col("duration_minutes")),
          "total_minutes",
        ],
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("user_id")),
          ),
          "unique_users",
        ],
      ],
      group: ["log_date"],
      order: [["log_date", "ASC"]],
      raw: true,
    });

    const grandTotal = byUser.reduce(
      (s, r) => s + Number(r.total_minutes || 0),
      0,
    );

    const userNameMap = await AdminMonitorService._fetchUserNames(
      byUser.map((r) => r.user_id),
    );

    return {
      success: true,
      status: 200,
      data: {
        grand_total_minutes: grandTotal,
        active_users: byUser.length,
        active_projects: byProject.length,
        active_departments: byDepartment.length,
        by_user: byUser
          .map((r) => ({
            user_id: r.user_id,
            user_name: userNameMap[r.user_id] || null,
            total_minutes: Number(r.total_minutes || 0),
            session_count: Number(r.session_count || 0),
            unique_projects: Number(r.unique_projects || 0),
            unique_stories: Number(r.unique_stories || 0),
            active_days: Number(r.active_days || 0),
          }))
          .sort((a, b) => b.total_minutes - a.total_minutes),
        by_project: byProject
          .map((r) => ({
            project_id: r["project.id"] || r.project_id,
            project_name: r["project.name"] || "Unknown",
            project_status:
              r["project.is_completed"] != null
                ? r["project.is_completed"]
                  ? "completed"
                  : "ongoing"
                : null,
            total_minutes: Number(r.total_minutes || 0),
            session_count: Number(r.session_count || 0),
            unique_users: Number(r.unique_users || 0),
          }))
          .sort((a, b) => b.total_minutes - a.total_minutes),
        by_department: byDepartment
          .map((r) => ({
            department_id: r.department_id,
            total_minutes: Number(r.total_minutes || 0),
            session_count: Number(r.session_count || 0),
            unique_users: Number(r.unique_users || 0),
            unique_projects: Number(r.unique_projects || 0),
          }))
          .sort((a, b) => b.total_minutes - a.total_minutes),
        by_day: byDay.map((r) => ({
          date: r.log_date,
          total_minutes: Number(r.total_minutes || 0),
          unique_users: Number(r.unique_users || 0),
        })),
      },
    };
  }

  // ─── 2. Users Detail Report ──────────────────────────────────────────────

  /**
   * Per-user summary with project + feature + story breakdown.
   * If user_id is provided → detailed drill-down for that single user.
   */
  static async getUsersReport(req, { start_date, end_date, user_id }) {
    const { WorkLog, UserStory, Feature, Project, Sprint } = req.db;

    const baseWhere = {
      end_time: { [Op.not]: null },
      ...AdminMonitorService._dateWhere(start_date, end_date),
    };
    if (user_id) baseWhere.user_id = user_id;

    const logs = await WorkLog.findAll({
      where: baseWhere,
      attributes: [
        "id",
        "user_id",
        "project_id",
        "feature_id",
        "user_story_id",
        "department_id",
        "sprint_id",
        "log_date",
        "start_time",
        "end_time",
        "duration_minutes",
      ],
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

    // Group by user → project → feature → story
    const userMap = {};

    logs.forEach((log) => {
      const uid = log.user_id;
      if (!userMap[uid]) {
        userMap[uid] = {
          user_id: uid,
          total_minutes: 0,
          session_count: 0,
          active_days: new Set(),
          projects: {},
        };
      }

      const user = userMap[uid];
      const mins = log.duration_minutes || 0;
      user.total_minutes += mins;
      user.session_count += 1;
      user.active_days.add(log.log_date);

      const pid = log.project_id;
      if (!user.projects[pid]) {
        user.projects[pid] = {
          project_id: pid,
          project_name: log.project?.name || "Unknown",
          total_minutes: 0,
          features: {},
        };
      }
      const proj = user.projects[pid];
      proj.total_minutes += mins;

      const fid = log.feature_id;
      if (!proj.features[fid]) {
        proj.features[fid] = {
          feature_id: fid,
          feature_name: log.feature?.name || "Unknown",
          total_minutes: 0,
          stories: {},
        };
      }
      const feat = proj.features[fid];
      feat.total_minutes += mins;

      const sid = log.user_story_id;
      if (sid) {
        if (!feat.stories[sid]) {
          feat.stories[sid] = {
            story_id: sid,
            title: log.userStory?.title || "Unknown",
            status: log.userStory?.status || null,
            story_points: log.userStory?.story_points || null,
            total_minutes: 0,
            sessions: [],
          };
        }
        feat.stories[sid].total_minutes += mins;
        feat.stories[sid].sessions.push({
          id: log.id,
          log_date: log.log_date,
          start_time: log.start_time,
          end_time: log.end_time,
          duration_minutes: mins,
          sprint_name: log.sprint?.name || null,
        });
      }
    });

    const userNameMap = await AdminMonitorService._fetchUserNames(
      Object.keys(userMap),
    );

    const data = Object.values(userMap)
      .map((u) => ({
        ...u,
        user_name: userNameMap[u.user_id] || null,
        active_days: u.active_days.size,
        projects: Object.values(u.projects).map((p) => ({
          ...p,
          features: Object.values(p.features).map((f) => ({
            ...f,
            stories: Object.values(f.stories).sort(
              (a, b) => b.total_minutes - a.total_minutes,
            ),
          })),
        })),
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes);

    return { success: true, status: 200, data };
  }

  // ─── 3. Projects Detail Report ───────────────────────────────────────────

  /**
   * Per-project breakdown: feature → story → all contributing users.
   * Includes completion stats from UserStory model.
   */
  static async getProjectsReport(req, { start_date, end_date, project_id }) {
    const { WorkLog, UserStory, Feature, Project } = req.db;

    // Work log stats per project
    const baseWhere = {
      end_time: { [Op.not]: null },
      ...AdminMonitorService._dateWhere(start_date, end_date),
    };
    if (project_id) baseWhere.project_id = project_id;

    const logs = await WorkLog.findAll({
      where: baseWhere,
      attributes: [
        "id",
        "user_id",
        "project_id",
        "feature_id",
        "user_story_id",
        "log_date",
        "start_time",
        "end_time",
        "duration_minutes",
      ],
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
          attributes: ["id", "name", "is_completed"],
          required: false,
        },
      ],
      order: [
        ["project_id", "ASC"],
        ["feature_id", "ASC"],
      ],
    });

    const projectMap = {};
    logs.forEach((log) => {
      const pid = log.project_id;
      if (!projectMap[pid]) {
        projectMap[pid] = {
          project_id: pid,
          project_name: log.project?.name || "Unknown",
          project_status:
            log.project?.is_completed != null
              ? log.project.is_completed
                ? "completed"
                : "ongoing"
              : null,
          total_minutes: 0,
          unique_users: new Set(),
          features: {},
        };
      }
      const proj = projectMap[pid];
      const mins = log.duration_minutes || 0;
      proj.total_minutes += mins;
      proj.unique_users.add(log.user_id);

      const fid = log.feature_id;
      if (!proj.features[fid]) {
        proj.features[fid] = {
          feature_id: fid,
          feature_name: log.feature?.name || "Unknown",
          total_minutes: 0,
          contributor_users: new Set(),
          stories: {},
        };
      }
      const feat = proj.features[fid];
      feat.total_minutes += mins;
      feat.contributor_users.add(log.user_id);

      const sid = log.user_story_id;
      if (sid) {
        if (!feat.stories[sid]) {
          feat.stories[sid] = {
            story_id: sid,
            title: log.userStory?.title || "Unknown",
            status: log.userStory?.status || null,
            story_points: log.userStory?.story_points || null,
            total_minutes: 0,
            contributors: new Set(),
          };
        }
        feat.stories[sid].total_minutes += mins;
        feat.stories[sid].contributors.add(log.user_id);
      }
    });

    // Story completion stats per project (no date filter — static snapshot)
    const userStoryQuery = {
      ...(project_id ? { project_id } : {}),
      deleted_at: null,
    };
    const allStories = await UserStory.findAll({
      where: userStoryQuery,
      attributes: ["id", "project_id", "feature_id", "status", "story_points"],
      raw: true,
    });

    const storyStatsByProject = {};
    allStories.forEach((s) => {
      const pid = s.project_id;
      if (!storyStatsByProject[pid]) {
        storyStatsByProject[pid] = {
          total: 0,
          completed: 0,
          in_progress: 0,
          blocked: 0,
        };
      }
      storyStatsByProject[pid].total += 1;
      if (s.status === "completed") storyStatsByProject[pid].completed += 1;
      if (s.status === "in_progress") storyStatsByProject[pid].in_progress += 1;
      if (s.status === "blocked") storyStatsByProject[pid].blocked += 1;
    });

    const data = Object.values(projectMap)
      .map((p) => ({
        ...p,
        unique_users: p.unique_users.size,
        story_stats: storyStatsByProject[p.project_id] || {
          total: 0,
          completed: 0,
          in_progress: 0,
          blocked: 0,
        },
        features: Object.values(p.features)
          .map((f) => ({
            ...f,
            contributor_users: f.contributor_users.size,
            stories: Object.values(f.stories)
              .map((s) => ({
                ...s,
                contributors: s.contributors.size,
              }))
              .sort((a, b) => b.total_minutes - a.total_minutes),
          }))
          .sort((a, b) => b.total_minutes - a.total_minutes),
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes);

    return { success: true, status: 200, data };
  }

  // ─── 4. Departments Detail Report ────────────────────────────────────────

  static async getDepartmentsReport(
    req,
    { start_date, end_date, department_id },
  ) {
    const { WorkLog, UserStory, Feature, Project } = req.db;

    const baseWhere = {
      end_time: { [Op.not]: null },
      ...AdminMonitorService._dateWhere(start_date, end_date),
    };
    if (department_id) baseWhere.department_id = department_id;

    const logs = await WorkLog.findAll({
      where: baseWhere,
      attributes: [
        "id",
        "user_id",
        "project_id",
        "feature_id",
        "user_story_id",
        "department_id",
        "log_date",
        "duration_minutes",
      ],
      include: [
        {
          model: UserStory,
          as: "userStory",
          attributes: ["id", "title", "status"],
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
      ],
      order: [["department_id", "ASC"]],
    });

    const deptMap = {};
    logs.forEach((log) => {
      const did = log.department_id;
      if (!deptMap[did]) {
        deptMap[did] = {
          department_id: did,
          total_minutes: 0,
          unique_users: new Set(),
          unique_projects: new Set(),
          projects: {},
        };
      }
      const dept = deptMap[did];
      const mins = log.duration_minutes || 0;
      dept.total_minutes += mins;
      dept.unique_users.add(log.user_id);
      dept.unique_projects.add(log.project_id);

      const pid = log.project_id;
      if (!dept.projects[pid]) {
        dept.projects[pid] = {
          project_id: pid,
          project_name: log.project?.name || "Unknown",
          total_minutes: 0,
          unique_users: new Set(),
          features: {},
        };
      }
      const proj = dept.projects[pid];
      proj.total_minutes += mins;
      proj.unique_users.add(log.user_id);

      const fid = log.feature_id;
      if (!proj.features[fid]) {
        proj.features[fid] = {
          feature_id: fid,
          feature_name: log.feature?.name || "Unknown",
          total_minutes: 0,
          unique_users: new Set(),
        };
      }
      proj.features[fid].total_minutes += mins;
      proj.features[fid].unique_users.add(log.user_id);
    });

    const data = Object.values(deptMap)
      .map((d) => ({
        ...d,
        unique_users: d.unique_users.size,
        unique_projects: d.unique_projects.size,
        projects: Object.values(d.projects)
          .map((p) => ({
            ...p,
            unique_users: p.unique_users.size,
            features: Object.values(p.features)
              .map((f) => ({
                ...f,
                unique_users: f.unique_users.size,
              }))
              .sort((a, b) => b.total_minutes - a.total_minutes),
          }))
          .sort((a, b) => b.total_minutes - a.total_minutes),
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes);

    return { success: true, status: 200, data };
  }

  // ─── 5. Features Detail Report ───────────────────────────────────────────

  /**
   * All features across all projects with:
   *   story counts by status, total work hours, active contributors
   */
  static async getFeaturesReport(req, { start_date, end_date, project_id }) {
    const { WorkLog, UserStory, Feature, Project } = req.db;

    // Story snapshot (static — not date-filtered)
    const storyWhere = { deleted_at: null };
    if (project_id) storyWhere.project_id = project_id;

    const allStories = await UserStory.findAll({
      where: storyWhere,
      attributes: [
        "id",
        "feature_id",
        "project_id",
        "status",
        "story_points",
        "title",
      ],
      include: [
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
      ],
    });

    const featureSnapshot = {};
    allStories.forEach((s) => {
      const fid = s.feature_id;
      if (!featureSnapshot[fid]) {
        featureSnapshot[fid] = {
          feature_id: fid,
          feature_name: s.feature?.name || "Unknown",
          project_id: s.project_id,
          project_name: s.project?.name || "Unknown",
          total_stories: 0,
          completed: 0,
          in_progress: 0,
          review: 0,
          blocked: 0,
          defined: 0,
          story_points_total: 0,
          story_points_done: 0,
        };
      }
      const f = featureSnapshot[fid];
      f.total_stories += 1;
      f.story_points_total += s.story_points || 0;
      if (s.status === "completed") {
        f.completed += 1;
        f.story_points_done += s.story_points || 0;
      } else if (s.status === "in_progress") f.in_progress += 1;
      else if (s.status === "review") f.review += 1;
      else if (s.status === "blocked") f.blocked += 1;
      else f.defined += 1;
    });

    // Work hours per feature (date-filtered)
    const baseWhere = {
      end_time: { [Op.not]: null },
      ...AdminMonitorService._dateWhere(start_date, end_date),
    };
    if (project_id) baseWhere.project_id = project_id;

    const workByFeature = await WorkLog.findAll({
      where: baseWhere,
      attributes: [
        "feature_id",
        [
          Sequelize.fn("SUM", Sequelize.col("duration_minutes")),
          "total_minutes",
        ],
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("user_id")),
          ),
          "unique_users",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("WorkLog.id")), "session_count"],
      ],
      group: ["feature_id"],
      raw: true,
    });

    const workMap = {};
    workByFeature.forEach((r) => {
      workMap[r.feature_id] = {
        total_minutes: Number(r.total_minutes || 0),
        unique_users: Number(r.unique_users || 0),
        session_count: Number(r.session_count || 0),
      };
    });

    const data = Object.values(featureSnapshot)
      .map((f) => ({
        ...f,
        completion_pct:
          f.total_stories > 0
            ? Math.round((f.completed / f.total_stories) * 100)
            : 0,
        total_minutes: workMap[f.feature_id]?.total_minutes || 0,
        unique_users: workMap[f.feature_id]?.unique_users || 0,
        session_count: workMap[f.feature_id]?.session_count || 0,
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes);

    return { success: true, status: 200, data };
  }

  // ─── 6. Raw Work Log (for export / table view) ───────────────────────────

  /**
   * Full paginated work log across all users, filterable by any dimension.
   * Returns flat rows suitable for Excel export.
   */
  static async getRawWorkLog(
    req,
    {
      start_date,
      end_date,
      user_id,
      project_id,
      department_id,
      feature_id,
      page = 1,
      limit = 500,
    },
  ) {
    const { WorkLog, UserStory, Feature, Project, Sprint } = req.db;

    const where = { end_time: { [Op.not]: null } };
    if (start_date && end_date)
      where.log_date = { [Op.between]: [start_date, end_date] };
    if (user_id) where.user_id = user_id;
    if (project_id) where.project_id = project_id;
    if (department_id) where.department_id = department_id;
    if (feature_id) where.feature_id = feature_id;

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: logs, count: total } = await WorkLog.findAndCountAll({
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
        ["log_date", "DESC"],
        ["start_time", "DESC"],
      ],
      limit: Number(limit),
      offset,
    });

    const userNameMap = await AdminMonitorService._fetchUserNames(
      logs.map((l) => l.user_id),
    );

    const data = logs.map((log) => ({
      id: log.id,
      user_id: log.user_id,
      user_name: userNameMap[log.user_id] || null,
      project_id: log.project_id,
      project_name: log.project?.name || "Unknown",
      department_id: log.department_id,
      feature_id: log.feature_id,
      feature_name: log.feature?.name || "Unknown",
      story_id: log.user_story_id,
      story_title: log.userStory?.title || "Unknown",
      story_status: log.userStory?.status || null,
      story_points: log.userStory?.story_points || null,
      sprint_name: log.sprint?.name || null,
      log_date: log.log_date,
      start_time: log.start_time,
      end_time: log.end_time,
      duration_minutes: log.duration_minutes || 0,
    }));

    return {
      success: true,
      status: 200,
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = AdminMonitorService;
