// Author: Gururaj
// Description: Workflow service for managing issue statuses and transitions
// Version: 1.0.0

const {
  withContext,
  auditLogCreateHelperFunction,
  auditLogDeleteHelperFunction,
} = require("../../util/helper");
const { Op } = require("sequelize");

class WorkflowService {
  /**
   * Create a new status for a project
   */
  static async createStatus(req, data) {
    const { IssueStatus } = req.db;

    // Check if name exists in project
    const existing = await IssueStatus.findOne({
      where: { project_id: data.project_id, name: data.name },
    });

    if (existing) {
      return {
        success: false,
        status: 400,
        message: "Status name already exists in project",
      };
    }

    return await auditLogCreateHelperFunction({
      req,
      model: IssueStatus,
      data,
      remarks: "Create issue status",
    });
  }

  /**
   * Add a transition (A -> B)
   */
  static async addTransition(req, projectId, fromStatusId, toStatusId) {
    const { IssueTransition, IssueStatus } = req.db;

    // Validate Statuses belong to project
    const fromStatus = await IssueStatus.findOne({
      where: { id: fromStatusId, project_id: projectId },
    });
    const toStatus = await IssueStatus.findOne({
      where: { id: toStatusId, project_id: projectId },
    });

    if (!fromStatus || !toStatus) {
      return {
        success: false,
        status: 400,
        message: "Statuses must belong to the project",
      };
    }

    const existing = await IssueTransition.findOne({
      where: {
        project_id: projectId,
        from_status_id: fromStatusId,
        to_status_id: toStatusId,
      },
    });

    if (existing) {
      return {
        success: false,
        status: 400,
        message: "Transition already exists",
      };
    }

    // Manual audit log create (helper doesn't support multiple args nicely for pure join table sometimes)
    // But here standard create works
    return await auditLogCreateHelperFunction({
      req,
      model: IssueTransition,
      data: {
        project_id: projectId,
        from_status_id: fromStatusId,
        to_status_id: toStatusId,
      },
      remarks: `Allow transition ${fromStatus.name} -> ${toStatus.name}`,
    });
  }

  /**
   * Get Workflow (Statuses + Transitions)
   */
  static async getWorkflow(req, projectId) {
    const { IssueStatus, IssueTransition } = req.db;

    const statuses = await IssueStatus.findAll({
      where: { project_id: projectId },
      order: [["position", "ASC"]],
    });

    const transitions = await IssueTransition.findAll({
      where: { project_id: projectId },
    });

    return {
      success: true,
      data: {
        statuses,
        transitions: transitions.map((t) => ({
          from: t.from_status_id,
          to: t.to_status_id,
        })),
      },
    };
  }

  /**
   * Validate Transition
   * returns true if valid, false if not valid
   */
  static async validateTransition(req, issue, newStatusId) {
    const { IssueTransition } = req.db;

    // If same status, always valid (no-op)
    if (issue.status_id === newStatusId) return true;

    // Check if project has ANY transitions defined
    const transitionCount = await IssueTransition.count({
      where: { project_id: issue.project_id },
    });

    // Flexible mode: If no transitions are defined for this project, allow ALL transitions
    if (transitionCount === 0) return true;

    // Strict mode: Check if specific transition exists
    const allowed = await IssueTransition.findOne({
      where: {
        project_id: issue.project_id,
        from_status_id: issue.status_id,
        to_status_id: newStatusId,
      },
    });

    return !!allowed;
  }
}

module.exports = WorkflowService;
