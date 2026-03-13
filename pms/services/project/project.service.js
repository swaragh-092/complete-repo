/*
Author: Homshree
Created: 13th June 2025
Description: Service layer for project-related business logic.
Version: 1.0.0
Modified: Gururaj, modifired completey based on new req, 14th oct 2025
*/

const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const { namespace } = require("../../config/cls");
const {
  giveValicationErrorFormal,
  paginateHelperFunction,
  auditLogCreateHelperFunction,
  auditLogUpdateHelperFunction,
  auditLogDeleteHelperFunction,
} = require("../../util/helper");
const {
  getProjectDeliverySnapshot,
  getProjectHealthOverview,
} = require("../analytics.repository");

class ProjectService {
  /**
   * Create a new project
   * @param {Object} data - Project data (name, description, startDate, endDate, organization_id)
   * @param {Object} options - Optional parameters (user, req for context)
   * @returns {Promise<Object>} - Created project
   */
  async createProject(req, data) {
    const { Project } = req.db;

    // Create project with context
    try {
      const project = await auditLogCreateHelperFunction({
        model: Project,
        data,
        req,
      });
      return { success: true, status: 201, data: project };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return {
          success: false,
          status: 422,
          message: `Validation Error`,
          errors: giveValicationErrorFormal(err),
        };
      }
      throw err;
    }
  }

  /**
   * Fetch a project by ID or name
   * @param {String} projectId - Project UUID
   * @returns {Promise<Object|null>} - Found project or null
   */
  async getProject(req, projectId, { include_features } = {}) {
    const { Project } = req.db;

    const project = await Project.findByPk(projectId, {
      include: include_features
        ? [{ association: "features", include: [{ association: "feature" }] }]
        : [],
    });

    if (!project)
      return { status: 404, message: "project not found", success: false };

    return { data: project, success: true, status: 200 };
  }

  /**
   * Update an existing project
   * @param {String} projectId - Project UUID
   * @param {Object} data - Project data to update (name, description, startDate, endDate, organization_id)
   * @param {Object} options - Optional parameters ( req for context)
   * @returns {Promise<Object>} - Updated project
   */
  async updateProject(req, projectId, data) {
    const { Project } = req.db;

    try {
      const project = await Project.findByPk(projectId);
      if (!project)
        return { status: 404, message: "Project not found", success: false };

      // Update project with context
      await auditLogUpdateHelperFunction({ model: project, data, req });

      return { status: 200, success: true, data: project };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return {
          success: false,
          status: 422,
          message: `Validation Error`,
          errors: giveValicationErrorFormal(err),
        };
      }
      throw err;
    }
  }

  /**
   * Delete a project
   * @param {String} projectId - Project UUID
   * @param {Object} options - Optional parameters (user, req for context)
   * @returns {Promise<void>}
   */
  async deleteProject(req, projectId) {
    const { Project } = req.db;
    const project = await Project.findByPk(projectId);
    if (!project) {
      return { status: 404, success: false, message: "Project Not Found!" };
    }

    await auditLogDeleteHelperFunction({ model: project, req });

    return {
      status: 200,
      success: true,
      message: "project deleted successfully",
    };
  }

  /**
   * Fetch all projects
   * @param {Object} options - Optional parameters (user, req for context)
   * @returns {Promise<Array>} - List of projects
   */
  async getAllProjects({ req, query, extrafilter } = {}) {
    const { Project, Issue, Task } = req.db;
    try {
      const organization_id =
        req.organization_id || namespace.get("organization_id");
      let whereFilters = { organization_id };
      const extrasInQuery = {
        as: "project",
        attributes: {
          include: [
            // Count of critical/high priority issues
            [
              Sequelize.literal(`(
                SELECT COUNT(*)
                FROM ${Issue.getTableName()} i
                WHERE i.project_id = "Project"."id"
                AND i.priority IN ('critical', 'high')
                AND i.deleted_at IS NULL
              )`),
              "critical_high_issues_count",
            ],
            // Count of overdue incomplete tasks
            [
              Sequelize.literal(`(
                SELECT COUNT(*)
                FROM ${Task.getTableName()} t
                WHERE t.project_id = "Project"."id"
                AND t.due_date < NOW()
                AND t.status NOT IN ('completed', 'blocked', 'reject')
                AND t.deleted_at IS NULL
              )`),
              "overdue_tasks_count",
            ],
          ],
        },
      };

      if (extrafilter) {
        if (extrafilter === "ongoing") {
          whereFilters.is_completed = false;
        } else if (extrafilter === "on_track") {
          whereFilters.is_completed = false;

          whereFilters = {
            ...whereFilters,
            [Op.and]: [
              Sequelize.literal(`
                NOT EXISTS (
                  SELECT 1
                  FROM ${Issue.getTableName()} i
                  WHERE i.project_id = "Project"."id"
                    AND i.deleted_at IS NULL
                    AND i.priority IN ('high','critical')
                    AND i.status IN ('open','re_open','in_progress','resolved')
                )
              `),
              Sequelize.literal(`
                NOT EXISTS (
                  SELECT 1
                  FROM ${Task.getTableName()} t
                  WHERE t.project_id = "Project"."id"
                    AND t.deleted_at IS NULL
                    AND t.status NOT IN ('blocked','completed','reject')
                    AND t.due_date < NOW()
                )
              `),
            ],
          };

          // IMPORTANT for findAndCountAll
          extrasInQuery.subQuery = false;
          extrasInQuery.distinct = true;
          extrasInQuery.col = '"Project"."id"';
        } else if (extrafilter === "at_risk") {
          whereFilters.is_completed = false;

          whereFilters = {
            ...whereFilters,
            [Op.and]: [
              // At least ONE risky issue OR task
              Sequelize.literal(`
                (
                  (
                    SELECT COUNT(1)
                    FROM ${Issue.getTableName()} i
                    WHERE i.project_id = "Project"."id"
                      AND i.deleted_at IS NULL
                      AND i.priority IN ('high','critical')
                      AND i.status IN ('open','re_open','in_progress','resolved')
                  ) BETWEEN 1 AND 5

                  OR

                  (
                    SELECT COUNT(1)
                    FROM ${Task.getTableName()} t
                    WHERE t.project_id = "Project"."id"
                      AND t.deleted_at IS NULL
                      AND t.status NOT IN ('blocked','completed','reject')
                      AND t.due_date < NOW()
                  ) BETWEEN 1 AND 5
                )
              `),

              // BUT NOT critical overflow
              Sequelize.literal(`
                (
                  (
                    SELECT COUNT(1)
                    FROM ${Issue.getTableName()} i
                    WHERE i.project_id = "Project"."id"
                      AND i.deleted_at IS NULL
                      AND i.priority IN ('high','critical')
                      AND i.status IN ('open','re_open','in_progress','resolved')
                  ) < 6

                  AND

                  (
                    SELECT COUNT(1)
                    FROM ${Task.getTableName()} t
                    WHERE t.project_id = "Project"."id"
                      AND t.deleted_at IS NULL
                      AND t.status NOT IN ('blocked','completed','reject')
                      AND t.due_date < NOW()
                  ) < 6
                )
              `),
            ],
          };

          extrasInQuery.subQuery = false;
          extrasInQuery.distinct = true;
          extrasInQuery.col = '"Project"."id"';
        } else if (extrafilter === "critical") {
          whereFilters.is_completed = false;
          whereFilters = {
            ...whereFilters,
            [Op.or]: [
              Sequelize.literal(`
                (
                  SELECT COUNT(1)
                  FROM ${Issue.getTableName()} i
                  WHERE i.project_id = "Project"."id"
                    AND i.deleted_at IS NULL
                    AND i.priority IN ('high','critical')
                    AND i.status IN ('open','re_open','in_progress','resolved')
                ) >= 6
              `),
              Sequelize.literal(`
                (
                  SELECT COUNT(1)
                  FROM ${Task.getTableName()} t
                  WHERE t.project_id = "Project"."id"
                    AND t.deleted_at IS NULL
                    AND t.status NOT IN ('blocked','completed','reject')
                    AND t.due_date < NOW()
                ) >= 6
              `),
            ],
          };
          extrasInQuery.subQuery = false;
          extrasInQuery.distinct = true;
          extrasInQuery.col = '"Project"."id"';
        } else if (extrafilter === "near_deadline") {
          whereFilters.is_completed = false;
          const next14Days = new Date();
          next14Days.setDate(next14Days.getDate() + 14);

          whereFilters.end_date = {
            [Sequelize.Op.between]: [new Date(), next14Days],
          };
        } else if (extrafilter === "no_update") {
          whereFilters.is_completed = false;
          const fiveDaysAgo = new Date();
          fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

          whereFilters = {
            ...whereFilters,
            [Op.and]: [
              Sequelize.literal(`
                (
                  SELECT COUNT(1)
                  FROM ${Task.getTableName()} t
                  WHERE t.project_id = "Project"."id"
                    AND t.deleted_at IS NULL
                    AND t.updated_at > '${fiveDaysAgo.toISOString()}'
                ) = 0
              `),
            ],
          };
          extrasInQuery.subQuery = false;
          extrasInQuery.distinct = true;
          extrasInQuery.col = '"Project"."id"';
        } else if (extrafilter === "overdue") {
          whereFilters.is_completed = false;
          whereFilters.estimated_end_date = {
            [Sequelize.Op.lt]: Sequelize.fn("NOW"),
          };
        }
      }

      const result = await paginateHelperFunction({
        model: Project,
        query,
        whereFilters,
        extrasInQuery,
      });

      return { status: 200, data: result, success: true };
    } catch (error) {
      console.log(error);
      throw new Error(`Error fetching all projects: ${error.message}`);
    }
  }

  async getAllUserOngoingProjects(req, { departmentId } = {}) {
    const { Project } = req.db;
    try {
      const memberFilter = { user_id: req.user.id };

      if (departmentId) {
        memberFilter.department_id = departmentId;
      }
      const projects = await Project.findAll({
        where: { is_completed: false },
        include: [
          {
            association: "members",
            required: true,
            attributes: ["id", "user_id"],
            where: memberFilter,
          },
        ],
        attributes: ["id", "name", "is_completed"],
      });

      return { status: 200, data: projects, success: true };
    } catch (error) {
      throw new Error(`Error fetching all projects: ${error.message}`);
    }
  }
  async getOverviewData(req) {
    const { Project } = req.db;
    try {
      const organization_id =
        req.organization_id || namespace.get("organization_id");

      const ongoingProjects = await Project.count({
        where: { is_completed: false, organization_id },
      });
      const completedProjects = await Project.count({
        where: { is_completed: true, organization_id },
      });

      const totalProjects = ongoingProjects + completedProjects;

      const healthoverview = await getProjectHealthOverview(req, {
        organization_id,
      });
      const deliverySnapshot = await getProjectDeliverySnapshot(req, {
        organization_id,
      });

      const summary = healthoverview
        ? {
            critical_high_issues_count: healthoverview.projects.all.reduce(
              (sum, p) => sum + parseInt(p.high_issues || 0, 10),
              0,
            ),
            overdue_tasks_count: healthoverview.projects.all.reduce(
              (sum, p) => sum + parseInt(p.overdue_tasks || 0, 10),
              0,
            ),
          }
        : { critical_high_issues_count: 0, overdue_tasks_count: 0 };

      const responseData = {
        totalProjects,
        ongoingProjects,
        completedProjects,
        healthoverview,
        deliverySnapshot,
        summary,
      };

      return { status: 200, data: responseData, success: true };
    } catch (error) {
      console.log(error);
      throw new Error(`Error fetching all projects: ${error.message}`);
    }
  }

  // ...existing code...

  /**
   * Complete a project with validations
   * @param {String} projectId - Project UUID
   * @param {Object} options - Optional parameters (req for context)
   * @returns {Promise<Object>} - Completion result with validation details
   */
  async completeProject(req, projectId) {
    const { Project, Task, Issue } = req.db;

    try {
      const project = await Project.findByPk(projectId);

      if (!project) {
        return {
          status: 404,
          success: false,
          message: "Project not found",
        };
      }

      // Check if project is already completed
      if (project.is_completed) {
        return {
          status: 400,
          success: false,
          message: "Project is already completed",
        };
      }

      // Check for open/pending issues
      const openIssuesCount = await Issue.count({
        where: {
          project_id: projectId,
          status: {
            [Op.in]: ["open", "re_open", "in_progress"],
          },
          deleted_at: null,
        },
      });

      if (openIssuesCount > 0) {
        return {
          status: 400,
          success: false,
          message: `Cannot complete project. There are ${openIssuesCount} open issues.`,
          validation_errors: {
            open_issues: openIssuesCount,
          },
        };
      }

      // Check for pending/incomplete tasks
      const pendingTasksCount = await Task.count({
        where: {
          project_id: projectId,
          status: {
            [Op.notIn]: ["completed", "blocked", "reject"],
          },
          deleted_at: null,
        },
      });

      if (pendingTasksCount > 0) {
        return {
          status: 400,
          success: false,
          message: `Cannot complete project. There are ${pendingTasksCount} pending tasks.`,
          validation_errors: {
            pending_tasks: pendingTasksCount,
          },
        };
      }

      // Check for at least 5 completed tasks
      const completedTasksCount = await Task.count({
        where: {
          project_id: projectId,
          status: "completed",
          deleted_at: null,
        },
      });

      if (completedTasksCount < 5) {
        return {
          status: 400,
          success: false,
          message: `Cannot complete project. Minimum 5 completed tasks required. Currently ${completedTasksCount} tasks completed.`,
          validation_errors: {
            completed_tasks: completedTasksCount,
            required: 5,
          },
        };
      }

      // All validations passed - mark project as completed
      const updateData = {
        is_completed: true,
        end_date: new Date(),
      };

      await auditLogUpdateHelperFunction({
        model: project,
        data: updateData,
        req,
      });

      return {
        status: 200,
        success: true,
        message: "Project completed successfully",
        data: project,
      };
    } catch (error) {
      console.error("Error completing project:", error);
      throw error;
    }
  }

  async getMemberDashboardData(req) {
    const { Task, ProjectMember, Project, Issue } = req.db;
    const DailyLog = req.db.DailyLog;
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    // All project memberships for current user
    const memberships = await ProjectMember.findAll({
      where: { user_id: userId },
      attributes: ["id", "project_id", "department_id", "project_role"],
      include: [
        {
          association: "project",
          attributes: ["id", "is_completed"],
          required: true,
        },
      ],
    });

    const memberIds = memberships.map((m) => m.id);
    const deptIds = [...new Set(memberships.map((m) => m.department_id))];
    const projectIds = [...new Set(memberships.map((m) => m.project_id))];
    const activeProjectIds = memberships
      .filter((m) => !m.project?.is_completed)
      .map((m) => m.project_id);

    // Task counts by status (tasks assigned to current user)
    const taskStatusList = [
      "approve_pending",
      "approved",
      "in_progress",
      "blocked",
      "assign_pending",
      "accept_pending",
    ];
    const taskCounts =
      memberIds.length > 0
        ? await Task.findAll({
            attributes: [
              "status",
              [Sequelize.fn("COUNT", Sequelize.col("Task.id")), "count"],
            ],
            where: {
              assigned_to: { [Op.in]: memberIds },
              status: { [Op.in]: taskStatusList },
            },
            group: ["status"],
            raw: true,
          })
        : [];

    const taskByStatus = {};
    for (const row of taskCounts) {
      taskByStatus[row.status] = parseInt(row.count, 10);
    }

    // Overdue tasks (due_date < today, active status)
    const overdueCount =
      memberIds.length > 0
        ? await Task.count({
            where: {
              assigned_to: { [Op.in]: memberIds },
              status: {
                [Op.in]: ["approved", "in_progress", "accept_pending"],
              },
              due_date: { [Op.lt]: today },
            },
          })
        : 0;

    // Today's log count
    const todayLogCount = await (DailyLog
      ? DailyLog.count({ where: { user_id: userId, date: today } })
      : Promise.resolve(0));

    // Tasks with approve_pending (created by me, waiting for me to approve — as lead)
    const pendingApprovalCount =
      memberIds.length > 0
        ? await Task.count({
            where: {
              assignee: { [Op.in]: memberIds },
              status: "approve_pending",
            },
          })
        : 0;

    // Issues in my departments
    const issueCount =
      deptIds.length > 0
        ? await Issue.count({
            where: {
              status: { [Op.in]: ["open", "re_open", "in_progress"] },
              [Op.or]: [
                { from_department_id: { [Op.in]: deptIds } },
                { to_department_id: { [Op.in]: deptIds } },
              ],
            },
          })
        : 0;

    const highPriorityIssueCount =
      deptIds.length > 0
        ? await Issue.count({
            where: {
              status: { [Op.in]: ["open", "re_open", "in_progress"] },
              priority: { [Op.in]: ["high", "critical"] },
              [Op.or]: [
                { from_department_id: { [Op.in]: deptIds } },
                { to_department_id: { [Op.in]: deptIds } },
              ],
            },
          })
        : 0;

    return {
      status: 200,
      success: true,
      data: {
        tasks: {
          in_progress: taskByStatus["in_progress"] || 0,
          approve_pending: taskByStatus["approve_pending"] || 0,
          approved: taskByStatus["approved"] || 0,
          blocked: taskByStatus["blocked"] || 0,
          assign_pending: taskByStatus["assign_pending"] || 0,
          accept_pending: taskByStatus["accept_pending"] || 0,
          overdue: overdueCount,
          pending_my_approval: pendingApprovalCount,
          total_active:
            (taskByStatus["in_progress"] || 0) +
            (taskByStatus["approve_pending"] || 0) +
            (taskByStatus["approved"] || 0) +
            (taskByStatus["blocked"] || 0) +
            (taskByStatus["assign_pending"] || 0),
        },
        issues: {
          open: issueCount,
          high_priority: highPriorityIssueCount,
        },
        logs: {
          today_count: todayLogCount,
          has_log_today: todayLogCount > 0,
        },
        projects: {
          active: [...new Set(activeProjectIds)].length,
          total: projectIds.length,
        },
        role: {
          is_lead: memberships.some((m) => m.project_role === "lead"),
        },
      },
    };
  }

  // ...existing code...
}

module.exports = new ProjectService();
