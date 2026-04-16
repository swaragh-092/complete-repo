// Author: Gururaj
// Created: 14th oct 2025
// Description: Notification related service
// Version: 1.0.0
// Modified:

const { withContext, paginateHelperFunction } = require("../../util/helper");
const { Op, Sequelize } = require("sequelize");

class NotificationService {
  /**
   * Create a notification
   * @param {Object} params
   * @param {"individual"|"project"|"department"|"project_department"} params.scope
   * @param {string} params.title
   * @param {string} params.message
   * @param {string} [params.triggeredById] - sender (null for system)
   * @param {string} [params.userId] - required if scope = individual
   * @param {string} [params.projectId] - required if scope = project or department
   * @param {string} [params.departmentId] - required if scope = department or project_department
   * @param {Object} req - request context
   */
  static async createNotification(req, data) {
    const { Notification } = req.db;

    const {
      scope,
      title,
      message,
      triggeredById,
      userId,
      projectId,
      departmentId,
      entityType,
      entityId,
    } = data;

    // validation
    if (scope === "individual" && !userId) {
      throw new Error("userId is required for individual notifications");
    }
    if (
      ["project", "department", "project_department"].includes(scope) &&
      !projectId
    ) {
      throw new Error(
        "projectId is required for project/department notifications",
      );
    }
    if (["department", "project_department"].includes(scope) && !departmentId) {
      throw new Error("departmentId is required for department notifications");
    }

    let notifications;

    // if multiple users
    if (Array.isArray(userId) && userId.length > 0) {
      const rows = userId.map((uid) => ({
        scope,
        title,
        message,
        triggered_by_id: triggeredById || null,
        user_id: uid,
        project_id: projectId || null,
        department_id: departmentId || null,
        entity_id: entityId || null,
        entity_type: entityType || null,
      }));

      notifications = await Notification.bulkCreate(rows, {
        ...withContext(req),
        returning: true, // ensures created rows are returned
      });
    } else {
      // single user (or non-user scope)
      const notification = await Notification.create(
        {
          scope,
          title,
          message,
          triggered_by_id: triggeredById || null,
          user_id: userId || null,
          project_id: projectId || null,
          department_id: departmentId || null,
          entity_id: entityId || null,
          entity_type: entityType || null,
        },
        { ...withContext(req) },
      );
      notifications = [notification];
    }

    return { data: notifications, success: true, status: 201 };
  }

  /**
   * Get notifications for a user
   * @param {string} userId
   * @param {Object} memberships - user memberships { projects: [], departments: [] }
   * @param {Object} options - { limit, offset, onlyUnread }
   */
  static async getUserNotifications(req, userId, query = {}) {
    const { Notification, NotificationRead, ProjectMember } = req.db;

    let includeIndivudial =
      query.includeIndivudial === undefined
        ? true
        : query.includeIndivudial === "true";
    let includeProject =
      query.includeProject === undefined
        ? true
        : query.includeProject === "true";
    let includeDepartment =
      query.includeDepartment === undefined
        ? true
        : query.includeDepartment === "true";

    if (!includeIndivudial && !includeProject && !includeDepartment) {
      includeIndivudial = includeProject = includeDepartment = true;
    }

    const whereOr = [];

    if (includeProject) {
      const userProjectDepartments = await ProjectMember.findAll({
        where: { user_id: userId, is_active: true },
        attributes: ["project_id", "department_id"],
        raw: true,
      });

      userProjectDepartments.forEach((p) => {
        whereOr.push({
          scope: "project_department",
          project_id: p.project_id,
          department_id: p.department_id,
        });
      });
    }

    if (includeDepartment && req.user.departmentIds?.length) {
      whereOr.push({
        scope: "department",
        department_id: { [Op.in]: req.user.departmentIds },
      });
    }

    if (includeIndivudial) {
      whereOr.push({ scope: "individual", user_id: userId });
    }

    // Build main where
    const where = whereOr.length ? { [Op.or]: whereOr } : {};

    // Only unread filter
    if (query.onlyUnread === true || query.onlyUnread === "true") {
      where[Op.and] = [
        { scope: "individual", read_at: null },
        Sequelize.literal(`(
        scope != "individual" AND NOT EXISTS (
          SELECT 1
          FROM "pms_notification_reads" AS "nr"
          WHERE "nr"."notification_id" = "Notification"."id"
            AND "nr"."user_id" = "${userId}"
            AND "nr"."read_at" IS NOT NULL
        )
      )`),
      ];
    }
    // Include NotificationRead relation
    const extrasInQuery = {
      include: [
        {
          model: NotificationRead,
          as: "reads",
          required: false,
          where: { user_id: userId },
          attributes: ["read_at"],
        },
      ],
      attributes: {
        include: [
          [
            Sequelize.literal(`
            CASE
              WHEN "Notification"."scope" = 'individual'
                THEN (CASE WHEN "Notification"."read_at" IS NOT NULL THEN TRUE ELSE FALSE END)
              ELSE (CASE WHEN EXISTS (
                SELECT 1
                FROM "pms_notification_reads" AS "nr"
                WHERE "nr"."notification_id" = "Notification"."id"
                  AND "nr"."user_id" = '${userId}'
                  AND "nr"."read_at" IS NOT NULL
              ) THEN TRUE ELSE FALSE END)
            END
          `),
            "is_read",
          ],
        ],
      },
    };

    const result = await paginateHelperFunction({
      model: Notification,
      whereFilters: where,
      query,
      extrasInQuery,
    });

    return { data: result, status: 200, success: true };
  }

  /**
   * Mark notification as read for a user
   * @param {string} notificationId
   * @param {string} userId
   * @param {Object} req - request context
   */
  static async markAsRead(req, notificationId) {
    const { Notification, NotificationRead } = req.db;
    // fetch notification first to check scope
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return {
        status: 404,
        success: false,
        message: "Notification not found!..",
      };
    }
    let readEntry;
    // for individual scope, ensure only that user can mark it as read
    if (notification.scope === "individual") {
      if (notification.user_id !== req.user.id) {
        return { status: 401, success: false };
      }
      await notification.update({ read_at: new Date() });
    } else {
      // check if already exists in NotificationRead
      readEntry = await NotificationRead.findOne({
        where: { notification_id: notificationId, user_id: req.user.id },
      });

      // if no entry, create one with read_at
      if (!readEntry) {
        readEntry = await NotificationRead.create(
          {
            notification_id: notificationId,
            user_id: req.user.id,
            read_at: new Date(),
          },
          { ...withContext(req) },
        );
      }
    }

    // if already exists (with or without read_at), return as is
    return { success: true, status: 200, data: { notification, readEntry } };
  }

  static async unreadCount(req) {
    const { Notification, ProjectMember } = req.db;
    const sequelize = req.sequelize;

    const userId = req.user.id;

    let visibilityOr = [];

    // Individual
    visibilityOr.push({
      scope: "individual",
      user_id: userId,
      read_at: null,
    });

    // Department
    if (req.user.departmentIds?.length) {
      visibilityOr.push({
        scope: "department",
        department_id: { [Op.in]: req.user.departmentIds },
      });
    }

    // Project + Department
    const projectMemberships = await ProjectMember.findAll({
      where: { user_id: userId, is_active: true },
      attributes: ["project_id", "department_id"],
      raw: true,
    });

    projectMemberships.forEach((pm) => {
      visibilityOr.push({
        scope: "project_department",
        project_id: pm.project_id,
        department_id: pm.department_id,
      });
    });

    if (!visibilityOr.length) {
      return {
        success: true,
        status: 200,
        data: { unread_count: 0 },
      };
    }

    const unreadRows = await Notification.findAll({
      where: {
        [Op.or]: visibilityOr,
      },
      attributes: ["id", "scope", "read_at"],
      include: [
        {
          model: req.db.NotificationRead,
          as: "reads",
          required: false,
          where: { user_id: userId },
        },
      ],
    });

    let count = 0;
    unreadRows.forEach((n) => {
      if (n.scope === "individual") {
        if (!n.read_at) count++;
      } else {
        // For broad scopes, if no read record found, it's unread
        if (!n.reads || n.reads.length === 0) count++;
      }
    });

    return {
      success: true,
      status: 200,
      data: { unread_count: count },
    };
  }

  // --- Triggers ---

  /**
   * Notify when an issue is assigned
   * @param {Object} req
   * @param {string} issueId
   * @param {string} assigneeId - ProjectMember ID
   */
  static async notifyIssueAssigned(req, issueId, assigneeId) {
    try {
      const { Issue, ProjectMember } = req.db;
      const issue = await Issue.findByPk(issueId);
      const member = await ProjectMember.findByPk(assigneeId);

      if (!issue || !member) return;
      if (member.user_id === req.user.id) return; // Don't notify self

      await this.createNotification(req, {
        scope: "individual",
        title: "Issue Assigned",
        message: `You have been assigned to issue #${issue.id.substring(0, 8)}...: ${issue.title}`,
        triggeredById: req.user.id,
        userId: member.user_id,
        entityType: "issue",
        entityId: issue.id,
      });
    } catch (err) {
      console.error("Notification Error (Assign):", err);
    }
  }

  /**
   * Notify when an issue status changes
   * @param {Object} req
   * @param {string} issueId
   * @param {string} newStatusName
   */
  static async notifyStatusChanged(req, issueId, newStatusName) {
    try {
      const { Issue, ProjectMember } = req.db;
      const issue = await Issue.findByPk(issueId);
      if (!issue) return;

      const recipients = new Set();

      // 1. Notify Creator (Reporter)
      if (issue.created_by && issue.created_by !== req.user.id) {
        recipients.add(issue.created_by);
      }

      // 2. Notify Assignee
      if (issue.assignee_id) {
        const member = await ProjectMember.findByPk(issue.assignee_id);
        if (member && member.user_id !== req.user.id) {
          recipients.add(member.user_id);
        }
      }

      for (const userId of recipients) {
        await this.createNotification(req, {
          scope: "individual",
          title: "Status Changed",
          message: `Issue #${issue.id.substring(0, 8)}... status updated to ${newStatusName}`,
          triggeredById: req.user.id,
          userId: userId,
          entityType: "issue",
          entityId: issue.id,
        });
      }
    } catch (err) {
      console.error("Notification Error (Status):", err);
    }
  }

  /**
   * Notify when a comment is added
   * @param {Object} req
   * @param {string} issueId
   * @param {string} content
   */
  static async notifyCommentAdded(req, issueId, content) {
    try {
      const { Issue, ProjectMember } = req.db;
      const issue = await Issue.findByPk(issueId);
      if (!issue) return;

      const recipients = new Set();
      const preview =
        content.length > 50 ? content.substring(0, 50) + "..." : content;

      // 1. Notify Creator
      if (issue.created_by && issue.created_by !== req.user.id) {
        recipients.add(issue.created_by);
      }

      // 2. Notify Assignee
      if (issue.assignee_id) {
        const member = await ProjectMember.findByPk(issue.assignee_id);
        if (member && member.user_id !== req.user.id) {
          recipients.add(member.user_id);
        }
      }

      for (const userId of recipients) {
        await this.createNotification(req, {
          scope: "individual",
          title: "New Comment",
          message: `New comment on issue #${issue.id.substring(0, 8)}...: ${preview}`,
          triggeredById: req.user.id,
          userId: userId,
          entityType: "issue",
          entityId: issue.id,
        });
      }
    } catch (err) {
      console.error("Notification Error (Comment):", err);
    }
  }
}

module.exports = NotificationService;
