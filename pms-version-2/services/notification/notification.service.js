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
        "projectId is required for project/department notifications"
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
        { ...withContext(req) }
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

    let includeIndivudial = query.includeIndivudial === undefined ? true : query.includeIndivudial === 'true';
    let includeProject = query.includeProject === undefined ? true : query.includeProject === 'true';
    let includeDepartment = query.includeDepartment === undefined ? true : query.includeDepartment === 'true';


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
    if (query.onlyUnread === true || query.onlyUnread === 'true' ) {
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
      return {status: 404, success : false, message : "Notification not found!.."};
    }
    let readEntry;
    // for individual scope, ensure only that user can mark it as read
    if (notification.scope === "individual") {
      if (notification.user_id !== req.user.id) {
        return {status: 401, success : false, };
      }
      await notification.update({read_at: new Date()});
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
          { ...withContext(req) }
        );
      }
    }

    // if already exists (with or without read_at), return as is
    return {success : true, status : 200, data: {notification, readEntry}};
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

    projectMemberships.forEach(pm => {
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
      attributes: ["id"],
      include: [
        {
          association: "reads",
          required: false,
          attributes: [],
          where: { user_id: userId },
        },
      ],
      group: ["Notification.id"],
      having: sequelize.literal(`COUNT(reads.id) = 0`),
      raw: true,
    });

    return {
      success: true,
      status: 200,
      data: {
        unread_count: unreadRows.length,
      },
    };
  }


}

module.exports = NotificationService;
