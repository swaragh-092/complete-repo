// Author: Gururaj
// Created: 14th oct 2025
// Description: issue related service.
// Version: 1.0.0
// Modified:

const {
  withContext,
  paginateHelperFunction,
  auditLogCreateHelperFunction,
  giveValicationErrorFormal,
} = require("../../util/helper");
const { createTask } = require("../task/task.service");
const { createNotification } = require("../notification/notification.service");
const { queryMultipleWithAuditLog } = require("../auditLog.service");

class IssueService {
  // Create issue
  static async createIssue(req, data) {
    const { Issue, IssueHistory, Project} = req.db;

    const project = await Project.findByPk(data.project_id, {
      include: [
        {
          association: "members",
          where: { user_id: req.user.id }, // check if this user is part of project
          required: false,
        },
      ],
    });

    if (!project) {
      return { status: 404, message: "Project not found!", success: false };
    }

    if (!project.members || project.members.length === 0) {
      return {
        status: 403,
        message: "You are not a member of this project",
        success: false,
      };
    }

    const multiOperations = [];
    let issue;

    multiOperations.push({
      queryCallBack: async (t) => {
        issue = await Issue.create(data, {
          ...withContext(req),
          transaction: t,
        });
        return issue;
      },
      updated_columns: Object.keys(data), // You can specify explicitly if needed
      action: "create",
      model: Issue,
      remarks: "Creating new issue record",
    });

    //  Create IssueHistory
    multiOperations.push({
      queryCallBack: async (t) => {
        const issueHistory = await IssueHistory.create(
          {
            issue_id: issue.id,
            user_id: req.user.id,
            action_type: "created",
            comment: "Issue created",
          },
          {
            ...withContext(req),
            transaction: t,
          }
        );

        const notificationData = {
          scope: "project_department",
          title: `issue on ${project.name} project`,
          message: `New issue is created on the project ${project.name}`,
          triggeredById: req?.user?.id,
          projectId: project.id,
          departmentId: data.to_department_id,
          entityType: "issue",
          entityId: issue.id,
        };

        await createNotification(req, notificationData);

        return issueHistory;
      },
      updated_columns: ["issue_id", "user_id", "action_type", "comment"],
      action: "create",
      model: IssueHistory,
      remarks: "Recording issue creation history",
    });

    //  Execute all with unified transaction + audit logging
    await queryMultipleWithAuditLog({
      operations: multiOperations,
      req,
    });

    // Return final result
    return {
      success: true,
      status: 201,
      message: "Issue created successfully",
      data: issue,
    };
  }

  // Accept or reject issue 
  static async acceptOrRejectIssue(req, issueId, action = "accept", reason = "") {
    const { Issue, IssueHistory, IssueStats, ProjectMember} = req.db;

    const userId = req.user.id;
    const issue = await Issue.findByPk(issueId);
    if (!issue)
      return { status: 404, success: false, message: "Issue not found" };
    if (issue.status !== "open" && issue.status !== "re_open")
      return {
        status: 400,
        success: false,
        message: "This issue already been accepted.",
      };

    const projectMember = ProjectMember.findOne({
      where: { user_id: userId, project_id: issue.project_id, department_id : issue.to_department_id },
    });

    if (!projectMember)
      return {
        status: 403,
        success: false,
      };

    const multiOperations = [];

    const updateData = { status: action === "accept" ? "in_progress" : "reject"}
    
    // Update Issue status
    multiOperations.push({
      queryCallBack: async (t) => {
        await issue.update(
          updateData,
          { ...withContext(req), transaction: t }
        );
        return issue;
      },
      updated_columns: Object.keys(updateData),
      action: "update",
      model: Issue,
      remarks: "Marking issue as in_progress",
    });

    // Create IssueHistory
    multiOperations.push({
      queryCallBack: async (t) => {
        const issueHistory = await IssueHistory.create(
          {
            issue_id: issueId,
            user_id: userId,
            action_type: action === "accept" ? "accepted" : "rejected",
            comment: reason || `Issue ${action}`,
          },
          { ...withContext(req), transaction: t }
        );
        return issueHistory;
      },
      updated_columns: ["issue_id", "user_id", "action_type", "comment"],
      action: "create",
      model: IssueHistory,
      remarks: "Recording issue acceptance",
    });
    if (action === "accept") {
      // Update or Create IssueStats
      multiOperations.push({
        queryCallBack: async (t) => {
          const [stat, created] = await IssueStats.findOrCreate({
            where: {
              user_id: userId,
              issue_type_id: issue.issue_type_id,
            },
            defaults: { count: 0 },
            transaction: t,
            ...withContext(req),
          });

          if (!created) {
            await stat.increment("count", { by: 1, transaction: t });
            await stat.reload({ transaction: t });
          } else {
            await stat.update(
              { count: 1 },
              { ...withContext(req), transaction: t }
            );
          }

          return stat;
        },
        updated_columns: ["user_id", "issue_type_id", "count"],
        action: "create",
        model: IssueStats,
        remarks: "Updating user issue count stats",
      });
    }
    

    // Execute all with unified transaction + audit logging
    const results = await queryMultipleWithAuditLog({
      operations: multiOperations,
      req,
    });

    // Extract final data
    const updatedIssue = results[0]; // from issue.update
    const userIssueCount = results[2]; // from IssueStats operation

    // Final response
    return {
      status: 200,
      success: true,
      message: "Issue accepted successfully",
      data: { issue: updatedIssue, userIssueCount },
    };
  }

  // Reassign issue to another department
  static async reassignIssue(req, data) {
    const { Issue, IssueHistory, Project} = req.db;

    const issue = await Issue.findByPk(data.issueId);
    if (!issue)
      return { status: 404, success: false, message: "Issue not found" };
    if (issue.status !== "open")
      return {
        status: 409,
        success: false,
        message: "Issue already been take can't reassign",
      };

    const project = await Project.findByPk(issue.project_id, {
      include: [
        {
          association: "members",
          where: { user_id: req.user.id }, // check if this user is part of project
          required: false,
        },
      ],
    });

    if (!project.members || project.members.length === 0) {
      return {
        status: 403,
        message: "You are not a member of this project",
        success: false,
      };
    }

    const multiOperations = [];

    //  Update Issue department (reassign)
    multiOperations.push({
      queryCallBack: async (t) => {
        await issue.update(
          { to_department_id: data.to_department_id },
          { transaction: t, ...withContext(req) }
        );
        return issue;
      },
      updated_columns: ["to_department_id"],
      action: "update",
      model: Issue,
      remarks: `Reassigned issue to department ${data.to_department_id}`,
    });

    // Create IssueHistory entry
    multiOperations.push({
      queryCallBack: async (t) => {
        const issueHistory = await IssueHistory.create(
          {
            issue_id: issue.id,
            user_id: req.user.id,
            action_type: "reassigned",
            comment: `Reassigned to department ${data.to_department_id}`,
          },
          { transaction: t, ...withContext(req) }
        );

        //  Send Notification
        const notificationData = {
          scope: "project_department",
          title: "Reassign issue",
          message: `Issue "${issue.title}" has been reassigned.`,
          triggeredById: req?.user?.id,
          projectId: project.id,
          departmentId: data.to_department_id,
          entityType: "issue",
          entityId: issue.id,
        };

        await createNotification(req, notificationData);

        return issueHistory;
      },
      updated_columns: ["issue_id", "user_id", "action_type", "comment"],
      action: "create",
      model: IssueHistory,
      remarks: "Recording issue reassignment history",
    });

    //  Execute all with unified transaction + audit logging
    await queryMultipleWithAuditLog({
      operations: multiOperations,
      req,
    });

    // Return final result
    return {
      success: true,
      status: 200,
      message: "Issue reassigned successfully",
      data: issue,
    };
  }

  // Mark issue as fixed/resolved
  static async resolveIssue(req, issueId) {
    const { Issue, IssueHistory, Project} = req.db;

    const issue = await Issue.findByPk(issueId, {
      include: [
        {
          association: "tasks",
          required: false,
        },
      ],
    });

    if (!issue)
      return { status: 404, success: false, message: "Issue not found" };

    if (issue.status !== "in_progress" ) return {status : 409, success: false, message : "Issue Cannot be resolved if not in progress!.."} ;

    const project = await Project.findByPk(issue.project_id, {
      include: [
        {
          association: "members",
          where: { user_id: req.user.id }, // check if this user is part of project
          required: false,
        },
      ],
    });

    if (!project) {
      return { status: 404, message: "Project not found!", success: false };
    }

    if (!project.members || project.members.length === 0) {
      return {
        status: 403,
        message: "You are not a member of this project",
        success: false,
      };
    }

    const tasks = issue.tasks;

    if (tasks.length === 0) {
      return {
        status: 400,
        success: false,
        message: "Task required! You cannot resolve an issue without at least one task.",
      };
    }

    const hasIncomplete = tasks.some((t) => t.status !== "completed");

    if (hasIncomplete) {
      return {
        status: 400,
        success: false,
        message: "Cannot resolve without completing all tasks!",
      };
    }

    if (issue.status !== "in_progress")
      return {
        status: 409,
        success: false,
        message:
          "Issue cannot be resolved because issue is not in progress state",
      };

    const multiOperations = [];

    // Update issue status to "resolved"
    multiOperations.push({
      queryCallBack: async (t) => {
        await issue.update(
          { status: "resolved" },
          { transaction: t, ...withContext(req) }
        );
        return issue;
      },
      updated_columns: ["status"],
      action: "update",
      model: Issue,
      remarks: "Marking issue as resolved",
    });

    // Create IssueHistory entry for resolution
    multiOperations.push({
      queryCallBack: async (t) => {
        const issueHistory = await IssueHistory.create(
          {
            issue_id: issue.id,
            user_id: req.user.id,
            action_type: "resolved",
            comment: "Issue resolved",
          },
          { transaction: t, ...withContext(req) }
        );

        // Send Notification
        const notificationData = {
          scope: "project_department",
          title: "Issue Resolved",
          message: `Issue "${issue.title}" has been resolved.`,
          triggeredById: req?.user?.id,
          projectId: project.id,
          departmentId: issue.from_department_id,
          entityType: "issue",
          entityId: issue.id,
        };

        await createNotification(req, notificationData);

        return issueHistory;
      },
      updated_columns: ["issue_id", "user_id", "action_type", "comment"],
      action: "create",
      model: IssueHistory,
      remarks: "Recording issue resolution history",
    });

    // Execute all with unified transaction + audit logging
    await queryMultipleWithAuditLog({
      operations: multiOperations,
      req,
    });

    //  Return final result
    return {
      success: true,
      status: 200,
      message: "Issue resolved successfully",
      data: issue,
    };
  }
  //
  static async closeOrReopenIssue(req, data) {
    const { Issue, IssueHistory, Project} = req.db;

    const issue = await Issue.findByPk(data.issueId);
    if (!issue)
      return { status: 404, success: false, message: "Issue not found" };

    const project = await Project.findByPk(issue.project_id, {
      include: [
        {
          association: "members",
          where: { user_id: req.user.id }, // check if this user is part of project
          required: false,
        },
      ],
    });

    if (!project.members || project.members.length === 0) {
      return {
        status: 403,
        message: "You are not a member of this project",
        success: false,
      };
    }

    if (issue.status !== "resolved" && issue.status !== "reject")
      return {
        status: 409,
        success: false,
        message:
          "Issue cannot be resolved because issue is not in resolved state",
      };

    const updateState = issue.status === "reject" ? "re_open" : ( data.status === "reopen" ? "re_open" : data.status );

    const oldStatusOfIssue = issue.status;

    const multiOperations = [];

    // 1️⃣ Update issue status (closed / reopened)
    multiOperations.push({
      queryCallBack: async (t) => {
        await issue.update(
          { status: updateState },
          { transaction: t, ...withContext(req) }
        );
        return issue;
      },
      updated_columns: ["status"],
      action: "update",
      model: Issue,
      remarks: `Updating issue status to ${updateState}`,
    });

    //  Create IssueHistory entry for closure or reopening
    multiOperations.push({
      queryCallBack: async (t) => {
        const commentText = data.comment || (
            (data.status === "closed" && oldStatusOfIssue !== "reject") 
              ? "Issue closed"
              : "Issue re-opened, not yet fixed"
          );

        const issueHistory = await IssueHistory.create(
          {
            issue_id: issue.id,
            user_id: req.user.id,
            action_type: data.status === "closed" ? "resolved" : "re_opened",
            comment: commentText,
          },
          { transaction: t, ...withContext(req) }
        );

        // 3️⃣ Send Notification
        const notificationData = {
          scope: "project_department",
          title: "Issue Finalized",
          message: `Issue "${issue.title}" is ${data.status === "closed" ? "closed" : "re-opened, not yet fixed"}.`,
          triggeredById: req?.user?.id,
          projectId: project.id,
          departmentId: issue.to_department_id,
          entityType: "issue",
          entityId: issue.id,
        };

        await createNotification(req, notificationData);

        return issueHistory;
      },
      updated_columns: ["issue_id", "user_id", "action_type", "comment"],
      action: "create",
      model: IssueHistory,
      remarks: "Recording issue finalization (closed/reopened)",
    });

    // Execute all with unified transaction + audit logging
    await queryMultipleWithAuditLog({
      operations: multiOperations,
      req,
    });

    // Return final result
    return {
      success: true,
      status: 200,
      message: `Issue ${data.status === "closed" ? "closed" : "re-opened"} successfully`,
      data: issue,
    };
  }

  // Get issues by project
  static async listIssues(req, projectId, query = {}) {
    const { Issue, IssueType, Project} = req.db;

    const project = await Project.findByPk(projectId, {
      include: [
        {
          association: "members",
          where: { user_id: req.user.id }, // check if this user is part of project
          required: false,
        },
      ],
    });

    if (!project) {
      return {
        status: 404,
        message: "Project not found",
        success: false,
      };
    }


    if (!project.members || project.members.length === 0) {
      return {
        status: 403,
        message: "You are not a member of this project",
        success: false,
      };
    }

    const issueId = req.params.issueId;

    const result = await paginateHelperFunction({
      model: Issue,
      whereFilters: { project_id: projectId, ...(issueId && { id: issueId }) },
      query,
      extrasInQuery: { include: [{ model: IssueType, as: "type" }] },
    });

    return { data: result, status: 200, success: true };
  }

  // get issue in detail
  static async getIssue(req, issueId) {
    const { Issue, IssueHistory, IssueType, Task, Project} = req.db;

    const issue = await Issue.findByPk(issueId, {
      include: [
        { model: IssueType, as: "type" },
        { model: IssueHistory, as: "history" },
        { model: Task, as: "tasks" },
      ],
      order: [["created_at", "DESC"]],
    });

    if (!issue) return { status: 404, success: false };

    const project = await Project.findByPk(issue.project_id, {
      include: [
        {
          association: "members",
          where: { user_id: req.user.id }, // check if this user is part of project
          required: false,
        },
      ],
    });

    if (!project.members || project.members.length === 0) {
      return {
        status: 403,
        message: "You are not a member of this project",
        success: false,
      };
    }

    return { data: issue, status: 200, success: true };
  }

  static async createTaskForIssueSolving(req, data) {
    const { Issue, Project} = req.db;

    const issue = await Issue.findByPk(data.issue_id);
    if (!issue)
      return { status: 404, success: false, message: "Issue not found" };



    // todo: check if user is in to department of issue from auth module 



    const project = await Project.findByPk(issue.project_id, {
      include: [
        {
          association: "members",
          where: { user_id: req.user.id, department_id : issue.to_department_id }, // check if this user is part of project
          required: false,
        },
      ],
    });

    if (!project.members || project.members.length === 0) {
      return {
        status: 403,
        message: "You are not a member of this Project for selected Department",
        success: false,
      };
    }

    if (issue.status !== "in_progress")
      return {
        status: 409,
        success: false,
        message:
          "Task cant create for this issue because is not in progress state",
      };

    data.projectIdForCompare = issue.project_id;
    data.project_member_id = project.members[0].id;

    return await createTask(req, data);
  }

  static async getIssueTypes(req) {
    const { IssueType } = req.db;

    const result = await paginateHelperFunction({
      model: IssueType,
      query: req.query,
    });

    return { success: true, status: 200, data: result };
  }

  static async createIssueType(req, data) {
    const { IssueType, Sequelize} = req.db;

    try {
      const issueType = await auditLogCreateHelperFunction({
        model: IssueType,
        data,
        req,
      });
      return { success: true, data: issueType, status: 201 };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return {
          success: false,
          status: 422,
          message: "Validation Error",
          errors: giveValicationErrorFormal(err),
        };
      }
    }

    return { success: false, status: 500 };
  }

  // get issue history
  static async getIssueHistory (req, issueId) {
    const { Issue } = req.db;

    const issue = await Issue.findByPk(issueId,{
      include : [
        {
          association: "history",
           separate: true,
            order: [['created_at', 'DESC']]
        }
      ],
    });

    if (!issue) return {status : 404, message : "Issue not found!..", success : false};
    return {success : true, data : issue, status : 200};
  }
}

module.exports = IssueService;
