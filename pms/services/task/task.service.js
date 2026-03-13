// Author: Gururaj
// Created: 14th oct 2025
// Description: task related service logics.
// Version: 1.0.0
// Modified:
//

const { Op, Sequelize } = require("sequelize");
const {
  withContext,
  giveValicationErrorFormal,
  paginateHelperFunction,
  auditLogUpdateHelperFunction,
} = require("../../util/helper");
const { DOMAIN } = require("../../config/config");
const { authClient } = require("../serviceClients");

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
    const { Task, ProjectMember } = req.db;

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
        },
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

        if (!parentTask)
          return {
            success: false,
            status: 404,
            message: "Parent Task not found!..",
          };
        if (
          data.create_helper_task &&
          assignedMember.id === parentTask.assigned_to
        )
          return {
            success: false,
            status: 401,
            message: "Helper task cant assigned to same person",
          };
        if (
          data.create_helper_task &&
          parentTask.status !== "in_progress" &&
          parentTask.status !== "approved"
        )
          return {
            success: false,
            status: 409,
            message: "Cannot ask help for completed Task!..",
          };
      }

      const project = assignedMember.project;

      if (parentTask && project.id !== parentTask.project_id)
        return {
          success: false,
          status: 401,
          message: "Other project task cannot be assigned",
        };

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

      // TODO: add hierarchy logic → check if `creator` has permission to assign or create for others
      // (e.g., compare `creator.role_level` vs `assignee.role_level` if your system tracks hierarchy)

      if (parentTask && data.create_helper_task) {
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
        action: "create",
        req,
        queryCallBack: async (t) => {
          const task = await Task.create(finalData, {
            ...withContext(req),
            transaction: t,
          });
          if (parentTask && data.create_dependency_task)
            await parentTask.addDependencyTask(Task.id, {
              ...withContext(req),
              transaction: t,
            });
          const notificationData = {
            scope: "individual",
            title: `Task is added`,
            message: `${task.title} Task is added for you for the project - ${project.name}.`,
            triggeredById: req?.user?.id,
            entityType: "task",
            entityId: task.id,
            userId: assignedMember.user_id,
          };

          const projectUpdates = {};

          if (project.is_completed) {
            projectUpdates.is_completed = false;
          }

          if (!project.start_date) {
            projectUpdates.start_date = new Date();
          }

          if (Object.keys(projectUpdates).length > 0) {
            await project.update(projectUpdates, {
              ...withContext(req),
              transaction: t,
            });
          }

          const notificationResult = await createNotification(
            req,
            notificationData,
          );

          return task;
        },
        updated_columns: Object.keys(finalData),
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
    const { Task, TaskDependency } = req.db;

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
      action: "update",
      req,
      updated_columns: ["dependency_task_id", "parent_task_id "],
      remarks: "Adding dependency task (many to many relation)",
      queryCallBack: async (t) => {
        return await dependencyTask.addParentTask(parentTask, {
          transaction: t,
          ...withContext(req),
        });
      },
    });

    return {
      success: true,
      status: 200,
      data: { task: parentTask, dependencyTask },
    };
  }

  async removeTaskDependency(req, { dependency_task_id, parent_task_id }) {
    const { Task, TaskDependency } = req.db;

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
      action: "update",
      req,
      updated_columns: ["dependency_task_id", "parent_task_id "],
      remarks: "Removed dependency task (many to many relation)",
      queryCallBack: async (t) => {
        return await dependencyTask.removeParentTask(parentTask, {
          transaction: t,
          ...withContext(req),
        });
      },
      model: TaskDependency,
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
  async getTasks(
    req,
    { project_id, department_id, onlyUser, statusFilter = null },
    { query = {} },
  ) {
    const { Task, Project } = req.db;

    const filter = {};
    if (project_id) {
      const project = await Project.findByPk(project_id);

      if (!project)
        return {
          status: 404,
          success: false,
          message: "Project not found!.. ",
        };

      filter.project_id = project_id;
    }

    const STATUS_VALUES = [
      "approve_pending",
      "approved",
      "in_progress",
      "completed",
      "blocked",
      "assign_pending",
      "checklist_removed",
      "accept_pending",
      "reject",
    ];
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
      include: [
        { association: "project", required: true },
        {
          association: "assigned",
          attributes: ["id", "user_id", "department_id", "project_role"],
          ...(onlyUser
            ? { where: { user_id: req.user.id }, required: true }
            : {}),
        },
        {
          association: "creator",
          attributes: ["id", "user_id", "department_id", "project_role"],
        },
        {
          association: "approver",
          attributes: ["id", "user_id", "department_id", "project_role"],
        },
        { association: "helperTasks", attributes: ["id"] },
        { association: "dependencyTasks", attributes: ["id"] },
        { association: "parentTasks", attributes: ["id"] },
      ],
    };

    const result = await paginateHelperFunction({
      model: Task,
      whereFilters: filter,
      query,
      extrasInQuery,
    });

    // Batch-fetch user + department (workspace) details from auth-service in
    // ONE call so the frontend gets names/emails instead of raw IDs.
    // department_id in PMS == workspace_id in auth-service.
    if (result.data && result.data.length > 0) {
      // Extract user_ids - handle both plain objects and Sequelize instances
      const uniqueUserIds = [
        ...new Set(
          result.data
            .flatMap((task) => {
              const taskData = task.toJSON ? task.toJSON() : task;
              return [
                taskData.assigned?.user_id,
                taskData.creator?.user_id,
                taskData.approver?.user_id,
              ];
            })
            .filter(Boolean),
        ),
      ];

      console.log("[getTasks] Extracted user IDs from tasks:", {
        uniqueUserIds,
        sampleTask: {
          assigned: result.data[0]?.assigned,
          assigned_json: result.data[0].toJSON
            ? result.data[0].toJSON().assigned
            : result.data[0].assigned,
          creator: result.data[0]?.creator,
          creator_json: result.data[0].toJSON
            ? result.data[0].toJSON().creator
            : result.data[0].creator,
          approver: result.data[0]?.approver,
        },
      });

      const uniqueDepartmentIds = [
        ...new Set(
          result.data.map((task) => task.department_id).filter(Boolean),
        ),
      ];

      if (uniqueUserIds.length > 0 || uniqueDepartmentIds.length > 0) {
        try {
          // Use service-to-service auth (Client Credentials) instead of
          // forwarding the user's browser JWT.
          const authServiceClient = authClient();

          // Build map: UserMetadata.id → { id, name, email }
          const userDetailsMap = {};
          // Build map: workspace(department) id → { id, name, description }
          const departmentDetailsMap = {};

          // STEP 1: Fetch user details (for assigned, creator, approver)
          if (uniqueUserIds.length > 0) {
            console.log("[getTasks] Fetching user details:", {
              url: `${DOMAIN.auth}/auth/internal/users/lookup`,
              user_ids: uniqueUserIds,
            });

            const userResponse = await authServiceClient.post(
              `${DOMAIN.auth}/auth/internal/users/lookup`,
              {
                user_ids: uniqueUserIds,
                user_id_type: "id", // PMS stores UserMetadata.id
              },
            );

            console.log(`[getTasks] User lookup response:`, {
              status: userResponse.status,
              usersCount: userResponse.data?.data?.users?.length || 0,
              firstUser: userResponse.data?.data?.users?.[0],
            });

            const users = userResponse.data?.data?.users || [];
            for (const user of users) {
              if (user.id) {
                userDetailsMap[user.id] = {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                };
              }
            }

            console.log("[getTasks] UserDetailsMap created:", {
              mapKeys: Object.keys(userDetailsMap),
              mapValues: Object.values(userDetailsMap),
            });
          }

          // STEP 2: Fetch workspace/department details
          if (uniqueDepartmentIds.length > 0) {
            console.log("[getTasks] Fetching workspace details:", {
              url: `${DOMAIN.auth}/auth/workspaces/batch-lookup`,
              workspace_ids: uniqueDepartmentIds,
            });

            const workspaceResponse = await authServiceClient.post(
              `${DOMAIN.auth}/auth/workspaces/batch-lookup`,
              {
                workspace_ids: uniqueDepartmentIds,
              },
            );

            console.log(`[getTasks] Workspace lookup response:`, {
              status: workspaceResponse.status,
              workspacesCount:
                workspaceResponse.data?.data?.workspaces?.length || 0,
            });

            const workspaces = workspaceResponse.data?.data?.workspaces || [];
            for (const ws of workspaces) {
              departmentDetailsMap[ws.id] = {
                id: ws.id,
                name: ws.name,
                description: ws.description,
                slug: ws.slug,
              };
            }
          }

          // Attach user_details + department_details to each task
          result.data = result.data.map((task, index) => {
            const plain = task.toJSON ? task.toJSON() : { ...task };

            if (index === 0) {
              console.log("[getTasks] Processing FIRST task - looking up:", {
                assigned_user_id: plain.assigned?.user_id,
                creator_user_id: plain.creator?.user_id,
                approver_user_id: plain.approver?.user_id,
                availableInMap: Object.keys(userDetailsMap),
              });
            }

            if (plain.assigned?.user_id) {
              plain.assigned.user_details =
                userDetailsMap[plain.assigned.user_id] ?? null;
              if (index === 0) {
                console.log("[getTasks] Assigned enrichment:", {
                  user_id: plain.assigned.user_id,
                  found: userDetailsMap[plain.assigned.user_id],
                  user_details: plain.assigned.user_details,
                });
              }
            }
            if (plain.creator?.user_id) {
              plain.creator.user_details =
                userDetailsMap[plain.creator.user_id] ?? null;
            }
            if (plain.approver?.user_id) {
              plain.approver.user_details =
                userDetailsMap[plain.approver.user_id] ?? null;
            }
            plain.department_details =
              departmentDetailsMap[plain.department_id] ?? null;
            return plain;
          });

          console.log("[getTasks] After enrichment - sample task:", {
            assigned: result.data[0]?.assigned,
            creator: result.data[0]?.creator,
            department_details: result.data[0]?.department_details,
          });
        } catch (authErr) {
          // Non-critical — tasks are still returned without enriched details
          // if auth-service is temporarily unreachable.
          console.warn(
            "[getTasks] Failed to fetch details from auth-service:",
            authErr.message,
          );
        }
      }
    }

    console.log(
      "Fetched tasks with filter:",
      result,
      "Result count:",
      result.data.length,
    );

    return { success: true, status: 200, data: result };
  }

  async getTasksForDailyLog(req, { query = {} }) {
    const { Task, DailyLog } = req.db;

    const today = new Date().toISOString().split("T")[0];

    // Find all task_ids already logged TODAY by THIS USER
    const loggedTaskIds = await DailyLog.findAll({
      attributes: ["task_id"],
      where: {
        date: today,
        user_id: req.user.id, // <<=== Filter for logged-in user
        deleted_at: null,
      },
      raw: true,
    }).then((rows) => rows.map((r) => r.task_id));

    //  Main task filter
    const filter = {
      status: { [Op.in]: ["in_progress", "approved"] },
      id: { [Op.notIn]: loggedTaskIds }, // exclude tasks logged today by this user
    };

    const extrasInQuery = {
      include: [
        { association: "project", required: true },
        {
          association: "assigned",
          required: true,
          where: { user_id: req.user.id }, // user assigned filter
        },
      ],
    };

    const result = await paginateHelperFunction({
      model: Task,
      whereFilters: filter,
      query,
      extrasInQuery,
    });

    return { success: true, status: 200, data: result };
  }

  /**
   * Soft delete a task
   */
  async deleteTask(req, taskId) {
    const { Task } = req.db;

    const task = await Task.findByPk(taskId, {
      include: [
        {
          association: "assigned",
          attributes: ["id", "user_id", "department_id", "project_role"],
        },
      ],
    });
    if (!task) {
      return { success: false, status: 404, message: "Task not found" };
    }

    const allowedDeleteStatus = [
      "approve_pending",
      "approved",
      "assign_pending",
      "accept_pending",
    ];

    if (!allowedDeleteStatus.includes(task.status)) {
      return {
        success: false,
        status: 409,
        message: `Task cannot be deleted because it is in '${task.status}' state.`,
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
      queryCallBack: async (t) => {
        const taskDeleted = await task.destroy({
          ...withContext(req),
          transaction: t,
        });

        if (task?.assigned?.user_id)
          await createNotification(req, notificationData);

        return taskDeleted;
      },
    });

    return { success: true, status: 200, message: "Task deleted successfully" };
  }

  async getDependencyTask(req, { task_id }) {
    const { Task } = req.db;

    const task = await Task.findByPk(task_id, {
      include: [
        {
          association: "dependencyTasks",
          attributes: ["id"],
          through: { attributes: [] },
        },
      ],
    });

    if (!task) {
      return { success: false, status: 404, message: "Task not found" };
    }

    const taskIds = task.dependencyTasks.map((t) => t.id);

    const dependencyTasks = await paginateHelperFunction({
      model: Task,
      query: req.query,
      whereFilters: { id: { [Op.in]: taskIds } },
    });

    return { success: true, status: 200, data: dependencyTasks };
  }
  async getParentTasks(req, { task_id }) {
    const { Task } = req.db;

    const task = await Task.findByPk(task_id, {
      include: [
        {
          association: "parentTasks",
          attributes: ["id"],
          through: { attributes: [] },
        },
      ],
    });

    if (!task) {
      return { success: false, status: 404, message: "Task not found" };
    }

    const taskIds = task.parentTasks.map((t) => t.id);

    const parentTasks = await paginateHelperFunction({
      model: Task,
      query: req.query,
      whereFilters: { id: { [Op.in]: taskIds } },
    });

    return { success: true, status: 200, data: parentTasks };
  }

  async addTaskHelper(req, { task_id, helper_task_id }) {
    const { Task } = req.db;

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
      include: [
        {
          association: "assigned",
          attributes: ["id", "user_id", "department_id", "project_role"],
        },
      ],
    }).then((tasks) => {
      const main = tasks.find((t) => t.id === task_id) || null;
      const helper = tasks.find((t) => t.id === helper_task_id) || null;
      return [main, helper];
    });

    if (!task)
      return { success: false, status: 404, message: "Task not found" };
    if (!helperTask)
      return { success: false, status: 404, message: "Helper Task not found" };
    if (req.user.id !== helperTask.assigned?.user_id)
      return { success: false, status: 401 };
    if (task.assigned_to === helperTask.assigned_to)
      return {
        success: false,
        status: 401,
        message: "Helper task cant assigned to same person",
      };
    if (task.project_id !== helperTask.project_id)
      return {
        success: false,
        status: 401,
        message: "Other project task cannot be assigned",
      };

    await auditLogUpdateHelperFunction({
      model: helperTask,
      data: { helped_for: task.id, task_for: "help" },
      req,
    });

    return { success: true, status: 201, data: helperTask };
  }

  async removeTaskHelper(req, { parent_task_id, helper_task_id }) {
    const { Task } = req.db;

    const existingHelper = await Task.findOne({
      where: { helped_for: parent_task_id, id: helper_task_id },
      include: [
        {
          association: "assigned",
          attributes: ["id", "user_id", "department_id", "project_role"],
        },
      ],
    });

    if (!existingHelper) {
      return { success: false, status: 404, message: "Task helper not found" };
    }

    if (existingHelper.assigned?.user_id !== req.user.id)
      return { success: false, status: 401 };

    await auditLogUpdateHelperFunction({
      model: existingHelper,
      data: { helped_for: null, task_for: "normal" },
      req,
    });

    return {
      success: true,
      status: 200,
      message: "Task helper removed successfully",
    };
  }

  async getAcceptableTask(req) {
    const { Task } = req.db;

    const extrasInQuery = {
      include: [
        {
          association: "assigned",
          attributes: ["id", "user_id", "department_id", "project_role"],
          where: { user_id: req.user.id },
          required: true,
        },
        {
          association: "helpedTask",
          include: [
            {
              association: "assigned",
              attributes: ["id", "user_id", "department_id", "project_role"],
            },
          ],
        },
      ],
    };

    const helpingTasks = await paginateHelperFunction({
      model: Task,
      extrasInQuery,
      whereFilters: { task_for: "help", status: "accept_pending" },
      query: req.query,
    });

    // Enrich with user details from auth-service
    if (helpingTasks.data && helpingTasks.data.length > 0) {
      try {
        const authServiceClient = authClient();

        // Collect all user IDs from both the help task and the helped task
        const uniqueUserIds = [
          ...new Set(
            helpingTasks.data
              .flatMap((task) => [
                task.assigned?.user_id,
                task.helpedTask?.assigned?.user_id,
              ])
              .filter(Boolean),
          ),
        ];

        const uniqueDepartmentIds = [
          ...new Set(
            helpingTasks.data.map((task) => task.department_id).filter(Boolean),
          ),
        ];

        const userDetailsMap = {};
        const departmentDetailsMap = {};

        // Fetch user details
        if (uniqueUserIds.length > 0) {
          const userResponse = await authServiceClient.post(
            `${DOMAIN.auth}/auth/internal/users/lookup`,
            {
              user_ids: uniqueUserIds,
              user_id_type: "id",
            },
          );

          const users = userResponse.data?.data?.users || [];
          for (const user of users) {
            if (user.id) {
              userDetailsMap[user.id] = {
                id: user.id,
                name: user.name,
                email: user.email,
              };
            }
          }
        }

        // Fetch workspace/department details
        if (uniqueDepartmentIds.length > 0) {
          const workspaceResponse = await authServiceClient.post(
            `${DOMAIN.auth}/auth/workspaces/batch-lookup`,
            {
              workspace_ids: uniqueDepartmentIds,
            },
          );

          const workspaces = workspaceResponse.data?.data?.workspaces || [];
          for (const ws of workspaces) {
            departmentDetailsMap[ws.id] = {
              id: ws.id,
              name: ws.name,
              description: ws.description,
              slug: ws.slug,
            };
          }
        }

        // Enrich tasks with user and department details
        helpingTasks.data = helpingTasks.data.map((task) => {
          const plain = task.toJSON ? task.toJSON() : { ...task };

          if (plain.assigned?.user_id) {
            plain.assigned.user_details =
              userDetailsMap[plain.assigned.user_id] ?? null;
          }

          if (plain.helpedTask?.assigned?.user_id) {
            plain.helpedTask.assigned.user_details =
              userDetailsMap[plain.helpedTask.assigned.user_id] ?? null;
          }

          plain.department_details =
            departmentDetailsMap[plain.department_id] ?? null;

          return plain;
        });
      } catch (authErr) {
        console.warn(
          "[getAcceptableTask] Failed to fetch details from auth-service:",
          authErr.message,
        );
      }
    }

    return { success: true, status: 200, data: helpingTasks };
  }

  async getAvailableChecklistTasks(req, { query = {} } = {}) {
    const { Task, ProjectMember } = req.db;
    try {
      // Find all departments where the current user is a project member
      const myMemberships = await ProjectMember.findAll({
        where: { user_id: req.user.id },
        attributes: ["id", "department_id", "project_id", "project_role"],
      });

      if (!myMemberships.length) {
        return { success: true, status: 200, data: { data: [], total: 0 } };
      }

      const departmentIds = [
        ...new Set(myMemberships.map((m) => m.department_id).filter(Boolean)),
      ];

      const extrasInQuery = {
        include: [
          {
            association: "project",
            required: true,
            attributes: ["id", "name", "code"],
          },
          {
            association: "checklist",
            attributes: ["id", "title", "description"],
          },
          { association: "projectFeature", attributes: ["id", "feature_id"] },
        ],
      };

      const result = await paginateHelperFunction({
        model: Task,
        whereFilters: {
          task_for: "checklist",
          status: "assign_pending",
          department_id: { [Op.in]: departmentIds },
        },
        query,
        extrasInQuery,
      });

      // Enrich department details from auth-service
      const uniqueDepartmentIds = [
        ...new Set(
          result.data
            .map((t) => {
              const d = t.toJSON ? t.toJSON() : t;
              return d.department_id;
            })
            .filter(Boolean),
        ),
      ];

      if (uniqueDepartmentIds.length > 0) {
        try {
          const authServiceClient = authClient();
          const workspaceResponse = await authServiceClient.post(
            `${DOMAIN.auth}/auth/workspaces/batch-lookup`,
            { workspace_ids: uniqueDepartmentIds },
          );
          const workspaces = workspaceResponse.data?.data?.workspaces || [];
          const deptMap = {};
          for (const ws of workspaces) {
            deptMap[ws.id] = { id: ws.id, name: ws.name, slug: ws.slug };
          }
          result.data = result.data.map((task) => {
            const plain = task.toJSON ? task.toJSON() : { ...task };
            plain.department_details = deptMap[plain.department_id] ?? null;
            // Attach logged-in user's role for this project+department
            const membership = myMemberships.find(
              (m) =>
                m.department_id === plain.department_id &&
                m.project_id === plain.project_id,
            );
            plain.my_role = membership?.project_role ?? null;
            plain.my_project_member_id = membership
              ? (myMemberships.find(
                  (m) =>
                    m.department_id === plain.department_id &&
                    m.project_id === plain.project_id,
                )?.id ?? null)
              : null;
            return plain;
          });
        } catch (authErr) {
          console.warn(
            "[getAvailableChecklistTasks] Failed to enrich dept details:",
            authErr.message,
          );
        }
      }

      // Attach my_project_member_id for tasks whose dept/project the user belongs to
      // (in case auth enrichment was skipped)
      result.data = result.data.map((task) => {
        const plain = task.toJSON ? task.toJSON() : { ...task };
        if (plain.my_project_member_id === undefined) {
          const membership = myMemberships.find(
            (m) =>
              m.department_id === plain.department_id &&
              m.project_id === plain.project_id,
          );
          plain.my_role = membership?.project_role ?? null;
          plain.my_project_member_id = membership?.id ?? null;
        }
        return plain;
      });

      return { success: true, status: 200, data: result };
    } catch (err) {
      throw err;
    }
  }

  async assignChecklistTask(req, data) {
    const { Task, ProjectMember } = req.db;
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
              association: "project",
              required: true,
            },
          ],
        },
      );

      if (!assignedMember)
        return {
          success: false,
          message: "Project member not found",
          status: 404,
        };

      // Enforce: the assignee must belong to the same department as the task
      if (assignedMember.department_id !== task.department_id) {
        return {
          success: false,
          status: 403,
          message: "Member does not belong to the task's department",
        };
      }

      const project = assignedMember.project;
      const user = req.user;
      let assigneeMemberId;

      if (user.id === assignedMember.user_id) {
        // Self-assign: any member of the same department can take the task
        assigneeMemberId = assignedMember.id;
        data.status = "approve_pending";
      } else {
        // Assigning to someone else: the assigner must be a lead in the same department
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
            message: "You are not a member of this department in this project",
            status: 403,
          };

        if (assigneeMember.project_role !== "lead") {
          return {
            success: false,
            status: 403,
            message: "Only department leads can assign tasks to other members",
          };
        }

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
        action: "update",
        req,
        updated_columns: Object.keys(finalData),
        remarks: "assign member to checklist task",
        queryCallBack: async (t) => {
          const updatedTast = await task.update(finalData, {
            transaction: t,
            ...withContext(req),
          });

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
        },
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

  async updateTask(req, data) {
    const { Task } = req.db;

    try {
      const task = await Task.findByPk(data.task_id, {
        include: [
          {
            association: "assigned",
            attributes: ["id", "user_id", "department_id", "project_role"],
            require: true,
          },
        ],
      });

      if (!task)
        return { success: false, message: "Task not found!.", status: 404 };

      if (task.live_status === "running")
        return {
          success: false,
          message: "Please stop the task!.",
          status: 409,
        };

      if (data.status === "completed" && task.status === "completed")
        return {
          success: false,
          message: "Task is already completed",
          status: 409,
        };
      if (data.status === "completed" && task.status !== "in_progress")
        return {
          success: false,
          message: "Task can be completed only if in progress state",
          status: 409,
        };

      if (task.assigned?.user_id !== req.user.id)
        return { success: false, message: "Not autorized", status: 401 };

      await auditLogUpdateHelperFunction({ model: task, data, req });

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

  async getAssistedTasks(req, taskId) {
    const { Task } = req.db;

    const task = await Task.findByPk(taskId, {
      include: [
        {
          association: "assigned",
          attributes: ["id", "user_id", "department_id", "project_role"],
        },
      ],
    });

    if (!task)
      return { message: "Task not found!...", status: 404, success: false };

    if (task.assigned?.user_id !== req.user.id)
      return { status: 401, success: false };

    const assistedTasks = await paginateHelperFunction({
      model: Task,
      whereFilters: { helped_for: task.id },
      query: req.query,
    });

    return { success: true, data: assistedTasks, status: 200 };
  }

  /**
   * Create a task for the current user themselves within a project.
   * - If project_role is 'lead': task is immediately approved.
   * - If project_role is 'member': task requires approval (approve_pending).
   * - If project_role is 'viewer': forbidden.
   */
  async createSelfTask(req, data) {
    const { Task, ProjectMember } = req.db;
    const user = req.user;

    try {
      const myMembership = await ProjectMember.findOne({
        where: { project_id: data.project_id, user_id: user.id },
        include: [{ association: "project", required: true }],
      });

      if (!myMembership)
        return {
          success: false,
          status: 404,
          message: "You are not a member of this project",
        };

      if (myMembership.project_role === "viewer")
        return {
          success: false,
          status: 403,
          message: "Viewers cannot create tasks",
        };

      const isLead = myMembership.project_role === "lead";

      const orgMembership = req.user.organizations?.memberships?.find(
        (m) => m.organization?.id === req.organization_id,
      );
      const orgRole = orgMembership?.role?.name?.toLowerCase();
      const isOrgApprover = ["owner", "admin"].includes(orgRole);

      const canAutoApprove = isLead || isOrgApprover;
      const taskStatus = canAutoApprove ? "approved" : "approve_pending";

      const finalData = {
        title: data.title,
        description: data.description || null,
        priority: data.priority || "medium",
        due_date: data.due_date,
        project_id: data.project_id,
        department_id: myMembership.department_id,
        assignee: myMembership.id,
        assigned_to: myMembership.id,
        status: taskStatus,
        ...(canAutoApprove && { approved_by: myMembership.id }),
      };

      const result = await queryWithLogAudit({
        action: "create",
        req,
        queryCallBack: async (t) => {
          const task = await Task.create(finalData, {
            ...withContext(req),
            transaction: t,
          });

          const project = myMembership.project;
          const projectUpdates = {};
          if (project.is_completed) projectUpdates.is_completed = false;
          if (!project.start_date) projectUpdates.start_date = new Date();
          if (Object.keys(projectUpdates).length > 0) {
            await project.update(projectUpdates, {
              ...withContext(req),
              transaction: t,
            });
          }

          await createNotification(req, {
            scope: "individual",
            title: canAutoApprove ? "Task created" : "Task pending approval",
            message: canAutoApprove
              ? `Your task "${task.title}" is ready to start.`
              : `Your task "${task.title}" has been submitted for approval.`,
            triggeredById: user.id,
            entityType: "task",
            entityId: task.id,
            userId: user.id,
          });

          return task;
        },
        updated_columns: Object.keys(finalData),
      });

      return { success: true, status: 201, data: result };
    } catch (err) {
      if (err instanceof Sequelize.ValidationError) {
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
   * Approve an approve_pending task. Only project leads can approve.
   */
  async approveTask(req, taskId) {
    const { Task, ProjectMember } = req.db;
    const user = req.user;

    try {
      const task = await Task.findByPk(taskId);
      if (!task)
        return { success: false, status: 404, message: "Task not found" };
      if (task.status !== "approve_pending")
        return {
          success: false,
          status: 409,
          message: `Task cannot be approved — current status: ${task.status}`,
        };

      const approverMembership = await ProjectMember.findOne({
        where: { project_id: task.project_id, user_id: user.id },
      });

      const orgMembership = req.user.organizations?.memberships?.find(
        (m) => m.organization?.id === req.organization_id,
      );
      const orgRole = orgMembership?.role?.name?.toLowerCase();
      const isOrgApprover = ["owner", "admin"].includes(orgRole);
      const isProjectLead = approverMembership?.project_role === "lead";

      if (!isProjectLead && !isOrgApprover)
        return {
          success: false,
          status: 403,
          message:
            "Only project leads or organization admins can approve tasks",
        };

      const updateData = {
        status: "approved",
        ...(approverMembership && { approved_by: approverMembership.id }),
      };
      await auditLogUpdateHelperFunction({
        model: task,
        data: updateData,
        req,
      });

      // Notify the assignee
      const assignedMembership = await ProjectMember.findByPk(task.assigned_to);
      if (assignedMembership) {
        await createNotification(req, {
          scope: "individual",
          title: "Task Approved",
          message: `Your task "${task.title}" has been approved. You can now start working on it.`,
          triggeredById: user.id,
          entityType: "task",
          entityId: task.id,
          userId: assignedMembership.user_id,
        });
      }

      return {
        success: true,
        status: 200,
        data: task,
        message: "Task approved successfully",
      };
    } catch (err) {
      if (err instanceof Sequelize.ValidationError) {
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

  async helperAcceptOrReject(req, { status, taskId }) {
    const { Task } = req.db;

    const task = await Task.findByPk(taskId, {
      where: { task_for: "help", status: "accept_pending" },
      include: [
        {
          association: "assigned",
          where: { user_id: req.user.id },
          required: true,
        },
      ],
    });

    if (!task)
      return { message: "Task not found!...", status: 404, success: false };
    const updateStatus = status === "accept" ? "in_progress" : "reject";

    await auditLogUpdateHelperFunction({
      model: task,
      data: { status: updateStatus },
      req,
    });

    return {
      success: true,
      data: task,
      status: 200,
      message: "Task " + status + "ed successfully!..",
    };
  }
}

module.exports = new TaskService();
