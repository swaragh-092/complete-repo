// Author: Gururaj
// Created: 14th oct 2025
// Description: issue related service.
// Version: 2.0.0
// Modified: Enhanced for Jira-like features

const {
  withContext,
  paginateHelperFunction,
  auditLogCreateHelperFunction,
  auditLogUpdateHelperFunction,
  auditLogDeleteHelperFunction,
} = require("../../util/helper");
const NotificationService = require("../notification/notification.service");
const { queryMultipleWithAuditLog } = require("../auditLog.service");
const { Op } = require("sequelize");
const WorkflowService = require("./workflow.service");

class IssueService {
  /**
   * Create a new issue
   */
  static async createIssue(req, data) {
    const {
      Issue,
      IssueHistory,
      Project,
      IssueStatus,
      IssueLabel,
      EntityLabel,
      ProjectMember,
    } = req.db;

    // 1. Validate Project
    const project = await Project.findByPk(data.project_id);
    if (!project) {
      return { success: false, status: 404, message: "Project not found" };
    }

    // Check if user is member and has permission to create issues
    const member = await ProjectMember.findOne({
      where: { project_id: data.project_id, user_id: req.user.id },
    });

    // to-do later add correct access validation based on roles and permissions
    // Only testers and team leads can create issues
    // const ISSUE_CREATE_ROLES = ["tester", "lead"];
    // if (!member || !ISSUE_CREATE_ROLES.includes(member.project_role)) {
    //   return {
    //     success: false,
    //     status: 403,
    //     message: "Only testers and team leads can create issues",
    //   };
    // }

    // Auto-fill from_department_id if not provided
    if (!data.from_department_id && member) {
      data.from_department_id = member.department_id;
    }
    // Set to_department_id same as from if missing (internal issue)
    if (!data.to_department_id && data.from_department_id) {
      data.to_department_id = data.from_department_id;
    }

    // 2. Validate Status (Default to first status 'todo')
    if (!data.status_id) {
      const defaultStatus = await IssueStatus.findOne({
        where: {
          [Op.or]: [{ project_id: data.project_id }, { project_id: null }],
          category: "todo",
        },
        order: [["position", "ASC"]],
      });
      if (defaultStatus) data.status_id = defaultStatus.id;
    }

    // 2.5 Validation Hierarchy
    const { IssueType } = req.db;
    const childType = await IssueType.findByPk(data.issue_type_id);
    if (!childType)
      return { success: false, status: 400, message: "Invalid issue type" };

    // Level 1: Epic
    // Level 2: Story
    // Level 3: Subtask

    if (data.parent_id) {
      const parent = await Issue.findByPk(data.parent_id, {
        include: [{ model: IssueType, as: "type" }],
      });
      if (!parent)
        return {
          success: false,
          status: 404,
          message: "Parent issue not found",
        };

      if (parent.project_id !== data.project_id) {
        return {
          success: false,
          status: 400,
          message: "Parent must belong to the same project",
        };
      }

      const parentLevel = parent.type.hierarchy_level;
      const childLevel = childType.hierarchy_level;

      // Enforce: Parent Level < Child Level
      if (childLevel <= parentLevel) {
        return {
          success: false,
          status: 400,
          message: `Invalid hierarchy level: Child cannot exceed or equal Parent level`,
        };
      }
    } else {
      // Enforce Level 3 (Subtask) must have parent
      if (childType.hierarchy_level === 3) {
        return {
          success: false,
          status: 400,
          message: "Subtasks must be linked to a parent story",
        };
      }
    }

    // 3. Create Issue
    const multiOperations = [];
    let issue;

    multiOperations.push({
      queryCallBack: async (t) => {
        issue = await Issue.create(data, {
          ...withContext(req),
          transaction: t,
        });

        // Handle Labels
        if (data.labels && Array.isArray(data.labels)) {
          for (const labelId of data.labels) {
            await EntityLabel.create(
              {
                entity_id: issue.id,
                entity_type: "issue",
                label_id: labelId,
              },
              { ...withContext(req), transaction: t },
            );
          }
        }
        return issue;
      },
      updated_columns: Object.keys(data),
      action: "create",
      model: Issue,
      remarks: "Creating new issue record",
    });

    // 4. History Log
    multiOperations.push({
      queryCallBack: async (t) => {
        await IssueHistory.create(
          {
            issue_id: issue.id,
            user_id: req.user.id,
            action_type: "created",
            comment: "Issue created",
          },
          { transaction: t },
        );

        // Send Notification
        /*
        const notificationData = {
          scope: "project_department",
          title: `New Issue: ${data.title}`,
          message: `Created in ${project.name}`,
          triggeredById: req?.user?.id,
          projectId: project.id,
          departmentId: data.to_department_id, 
          entityType: "issue",
          entityId: issue.id,
        };
        await createNotification(req, notificationData);
        */
      },
      updated_columns: ["issue_id", "user_id", "action_type"],
      action: "create",
      model: IssueHistory,
      remarks: "Recording issue creation history",
    });

    await queryMultipleWithAuditLog({ operations: multiOperations, req });

    return {
      success: true,
      status: 201,
      data: issue,
      message: "Issue created successfully",
    };
  }

  /**
   * Update Issue (General)
   */
  static async updateIssue(req, issueId, data) {
    const { Issue, IssueHistory } = req.db;

    const issue = await Issue.findByPk(issueId);
    if (!issue)
      return { success: false, status: 404, message: "Issue not found" };

    const multiOperations = [];

    // Check what changed
    const changes = [];
    if (data.priority && data.priority !== issue.priority)
      changes.push(`Priority changed to ${data.priority}`);
    if (data.description && data.description !== issue.description)
      changes.push(`Description updated`);
    if (data.title && data.title !== issue.title) changes.push(`Title updated`);

    multiOperations.push({
      queryCallBack: async (t) => {
        return await issue.update(data, {
          transaction: t,
          ...withContext(req),
        });
      },
      updated_columns: Object.keys(data),
      action: "update",
      model: Issue,
      remarks: "Updating issue details",
    });

    if (changes.length > 0) {
      multiOperations.push({
        queryCallBack: async (t) => {
          await IssueHistory.create(
            {
              issue_id: issue.id,
              user_id: req.user.id,
              action_type: "updated",
              comment: changes.join(", "),
            },
            { transaction: t },
          );
        },
        updated_columns: ["issue_id", "action_type", "comment"],
        action: "create",
        model: IssueHistory,
        remarks: "Recording issue update",
      });
    }

    await queryMultipleWithAuditLog({ operations: multiOperations, req });
    return {
      success: true,
      data: issue,
      message: "Issue updated successfully",
    };
  }

  /**
   * Change Status
   */
  static async changeStatus(req, issueId, statusId) {
    const { Issue, IssueStatus, IssueHistory } = req.db;

    const issue = await Issue.findByPk(issueId);
    if (!issue)
      return { success: false, status: 404, message: "Issue not found" };

    const status = await IssueStatus.findByPk(statusId);
    if (!status)
      return { success: false, status: 404, message: "Status not found" };

    // --- Validation: Check Workflow Transitions ---
    const isValid = await WorkflowService.validateTransition(
      req,
      issue,
      statusId,
    );
    if (!isValid) {
      return {
        success: false,
        status: 400,
        message: "Invalid status transition defined by project workflow",
      };
    }
    // ---------------------------------------------

    const multiOperations = [];

    multiOperations.push({
      queryCallBack: async (t) => {
        issue.status_id = statusId;
        // Sync legacy status field based on category
        if (status.category === "todo") issue.status = "open";
        else if (status.category === "in_progress")
          issue.status = "in_progress";
        else if (status.category === "done") issue.status = "closed";

        return await issue.save({ transaction: t });
      },
      updated_columns: ["status_id", "status"],
      action: "update",
      model: Issue,
      remarks: `Status changed to ${status.name}`,
    });

    multiOperations.push({
      queryCallBack: async (t) => {
        await IssueHistory.create(
          {
            issue_id: issue.id,
            user_id: req.user.id,
            action_type: "status_change",
            comment: `Status changed to ${status.name}`,
          },
          { transaction: t },
        );
      },
      updated_columns: ["issue_id", "action_type"],
      action: "create",
      model: IssueHistory,
      remarks: "Logging status change",
    });

    await queryMultipleWithAuditLog({ operations: multiOperations, req });

    // Notification
    await NotificationService.notifyStatusChanged(req, issueId, status.name);

    return { success: true, data: issue, message: "Status updated" };
  }

  /**
   * Assign Issue
   */
  static async assignIssue(req, issueId, assigneeId) {
    const { Issue, ProjectMember, IssueHistory } = req.db;

    const issue = await Issue.findByPk(issueId);
    if (!issue)
      return { success: false, status: 404, message: "Issue not found" };

    if (assigneeId) {
      const assignee = await ProjectMember.findOne({
        where: { id: assigneeId, project_id: issue.project_id },
      });
      if (!assignee)
        return {
          success: false,
          status: 400,
          message: "Assignee must be a project member",
        };
    }

    // We can use a simpler update helper here or full transaction flow
    // Keeping it simple since it's one field
    issue.assignee_id = assigneeId;
    await issue.save(withContext(req));

    // History
    await IssueHistory.create(
      {
        issue_id: issue.id,
        user_id: req.user.id,
        action_type: "assigned",
        comment: assigneeId ? `Assigned to member ${assigneeId}` : "Unassigned",
      },
      withContext(req),
    );

    if (assigneeId) {
      await NotificationService.notifyIssueAssigned(req, issue.id, assigneeId);
    }

    return { success: true, message: "Issue assigned successfully" };
  }

  /**
   * Manage Labels
   */
  static async updateLabels(req, issueId, labelIds) {
    const { EntityLabel, Issue } = req.db;

    const issue = await Issue.findByPk(issueId);
    if (!issue)
      return { success: false, status: 404, message: "Issue not found" };

    // Simplified: Delete all for this issue and re-add
    // In a transaction ideally
    await EntityLabel.destroy({
      where: { entity_id: issueId, entity_type: "issue" },
      ...withContext(req),
    });

    if (labelIds && labelIds.length > 0) {
      const bulkData = labelIds.map((lid) => ({
        entity_id: issueId,
        entity_type: "issue",
        label_id: lid,
      }));
      await EntityLabel.bulkCreate(bulkData, withContext(req));
    }

    return { success: true, message: "Labels updated" };
  }

  /**
   * Delete Issue
   */
  static async deleteIssue(req, issueId) {
    const { Issue } = req.db;
    // Soft delete via helper
    return await auditLogDeleteHelperFunction({
      req,
      model: Issue,
      where: { id: issueId },
      remarks: "Issue deleted",
    });
  }

  /**
   * List Issues
   */
  static async listIssues(req, projectId, query) {
    const {
      Issue,
      IssueType,
      IssueStatus,
      ProjectMember,
      IssueLabel,
      EntityLabel,
    } = req.db;

    const where = { project_id: projectId };
    if (query.status_id) where.status_id = query.status_id;
    if (query.assignee_id) where.assignee_id = query.assignee_id;
    if (query.priority) where.priority = query.priority;
    if (query.issue_type_id) where.issue_type_id = query.issue_type_id;

    const include = [
      { model: IssueType, as: "type" },
      { model: IssueStatus, as: "issueStatus" },
      {
        model: ProjectMember,
        as: "assignee",
        attributes: ["id", "user_id", "project_role"],
      },
    ];

    const result = await paginateHelperFunction({
      model: Issue,
      whereFilters: where,
      query: req.query,
      extrasInQuery: { include },
    });

    return { success: true, status: 200, data: result };
  }

  static async getIssueTypes(req) {
    const { IssueType } = req.db;
    const types = await IssueType.findAll();
    return { success: true, data: types };
  }

  static async createIssueType(req, data) {
    const { IssueType } = req.db;
    const result = await auditLogCreateHelperFunction({
      req,
      model: IssueType,
      data,
      remarks: "Create issue type",
    });
    return { success: true, status: 201, data: result };
  }

  static async getIssue(req, issueId) {
    const { Issue, IssueType, IssueStatus, ProjectMember, UserStory, Project } =
      req.db;
    const issue = await Issue.findByPk(issueId, {
      include: [
        { model: IssueType, as: "type" },
        { model: IssueStatus, as: "issueStatus" },
        { model: Project, as: "project", attributes: ["id", "name"] },
        {
          model: ProjectMember,
          as: "assignee",
          attributes: ["id", "user_id", "project_role"],
        },
        {
          model: UserStory,
          as: "userStory",
          attributes: ["id", "title", "type", "assigned_to", "status"],
        },
      ],
    });
    if (!issue)
      return { success: false, status: 404, message: "Issue not found" };
    return { success: true, data: issue };
  }

  static async getIssueHistory(req, issueId) {
    const { IssueHistory } = req.db;
    const history = await IssueHistory.findAll({
      where: { issue_id: issueId },
      order: [["created_at", "DESC"]],
    });
    return { success: true, data: history };
  }

  // Legacy methods support if needed (accept/reject/resolve) - can be mapped to status changes
  static async acceptOrRejectIssue(req, issueId, type, reason) {
    // Logic to map accept/reject to status change
    return { success: false, message: "Please use changeStatus endpoint" };
  }

  // New Methods for Hierarchy

  /**
   * Link a child issue to a parent
   */
  static async linkParent(req, childId, parentId) {
    const { Issue, IssueType } = req.db;
    const child = await Issue.findByPk(childId, {
      include: [{ model: IssueType, as: "type" }],
    });
    if (!child)
      return { success: false, status: 404, message: "Child issue not found" };

    if (!parentId) {
      // Unlink
      if (child.type.hierarchy_level === 3) {
        // Subtask cannot be orphaned
        return {
          success: false,
          status: 400,
          message: "Subtask must belong to a parent story",
        };
      }
      child.parent_id = null;
      await child.save(withContext(req));
      return { success: true, message: "Parent unlinked" };
    }

    const parent = await Issue.findByPk(parentId, {
      include: [{ model: IssueType, as: "type" }],
    });
    if (!parent)
      return { success: false, status: 404, message: "Parent issue not found" };

    if (child.project_id !== parent.project_id) {
      return {
        success: false,
        status: 400,
        message: "Issues must belong to the same project",
      };
    }

    // Circular Check
    if (child.id === parent.id)
      return {
        success: false,
        status: 400,
        message: "Cannot link issue to itself",
      };

    // Check if parent is actually a descendant of child (Cycle A->B->A)
    // Simple check: crawl up parent's parents
    let current = parent;
    while (current.parent_id) {
      if (current.parent_id === child.id) {
        return {
          success: false,
          status: 400,
          message: "Circular dependency detected",
        };
      }
      current = await Issue.findByPk(current.parent_id);
    }

    // Level Validation
    const parentLevel = parent.type.hierarchy_level;
    const childLevel = child.type.hierarchy_level;

    if (childLevel <= parentLevel) {
      return {
        success: false,
        status: 400,
        message: "Child issue level must be greater than parent",
      };
    }

    child.parent_id = parentId;
    await child.save(withContext(req));

    return { success: true, message: "Linked successfully" };
  }

  /**
   * Get Issue Hierarchy Tree
   * Assuming small trees (thousands of issues per project), we can fetch all and build tree in-memory or recursively.
   * For this implementation, let's fetch immediate children or full tree for a root.
   */
  static async getIssueTree(req, issueId) {
    const { Issue, IssueType, IssueStatus, ProjectMember } = req.db;

    // Sequelize self-referential nested includes cause wrong JOIN ORDER in PostgreSQL —
    // the "children->assignee" JOIN is emitted before the "children" JOIN, so PostgreSQL
    // throws "missing FROM-clause entry for table children".
    // Fix: fetch root, children, and grandchildren in completely separate queries with no
    // self-referential includes at all.

    const detailIncludes = [
      { model: IssueType, as: "type" },
      { model: IssueStatus, as: "issueStatus" },
      {
        model: ProjectMember,
        as: "assignee",
        attributes: ["id", "user_id", "project_role"],
      },
    ];

    // 1. Fetch root issue (no children include)
    const issue = await Issue.findByPk(issueId, { include: detailIncludes });
    if (!issue)
      return { success: false, status: 404, message: "Issue not found" };

    // 2. Fetch direct children
    const children = await Issue.findAll({
      where: { parent_id: issueId },
      include: detailIncludes,
    });

    // 3. Fetch grandchildren for each child
    for (const child of children) {
      const grandchildren = await Issue.findAll({
        where: { parent_id: child.id },
        include: detailIncludes,
      });
      child.dataValues.children = grandchildren;
    }

    issue.dataValues.children = children;

    return { success: true, data: issue };
  }

  /**
   * Link (or unlink) an issue to a user story.
   * Only team leads (project_role = 'lead') can perform this action.
   */
  static async linkUserStory(req, issueId, userStoryId) {
    const { Issue, UserStory, ProjectMember, IssueHistory } = req.db;

    const issue = await Issue.findByPk(issueId);
    if (!issue)
      return { success: false, status: 404, message: "Issue not found" };

    // Permission: only 'lead' role can link issues to user stories
    const member = await ProjectMember.findOne({
      where: { project_id: issue.project_id, user_id: req.user.id },
    });
    if (!member || member.project_role !== "lead") {
      return {
        success: false,
        status: 403,
        message: "Only team leads can link issues to user stories",
      };
    }

    if (userStoryId) {
      // Validate the user story exists and belongs to the same project
      const story = await UserStory.findOne({
        where: { id: userStoryId, project_id: issue.project_id },
      });
      if (!story) {
        return {
          success: false,
          status: 400,
          message: "User story not found in this project",
        };
      }
    }

    const previousStoryId = issue.user_story_id;
    await issue.update(
      { user_story_id: userStoryId ?? null },
      withContext(req),
    );

    await IssueHistory.create({
      issue_id: issueId,
      user_id: req.user.id,
      action_type: "updated",
      comment: userStoryId
        ? `Linked to user story ${userStoryId}`
        : `Unlinked from user story ${previousStoryId}`,
    }, withContext(req));

    return {
      success: true,
      status: 200,
      message: userStoryId
        ? "Issue linked to user story"
        : "Issue unlinked from user story",
    };
  }
}

module.exports = IssueService;
