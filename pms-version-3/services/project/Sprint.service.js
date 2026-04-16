// Author: Copilot
// Created: 18th Mar 2026
// Description: Sprint Service
// Version: 1.0.0

const { Op } = require("sequelize");
const { withContext } = require("../../util/helper");

class SprintService {
  /**
   * Create Sprint
   */
  static async createSprint(req, data) {
    const { Sprint, Project } = req.db;
    const { project_id, name, start_date, end_date, goal } = data;

    // Validate Project
    const project = await Project.findByPk(project_id);
    if (!project)
      return { success: false, status: 404, message: "Project not found" };

    const sprint = await Sprint.create(
      {
        project_id,
        name,
        start_date,
        end_date,
        goal,
        status: "planned",
      },
      withContext(req),
    );

    return { success: true, status: 201, data: sprint };
  }

  /**
   * Start Sprint
   */
  static async startSprint(req, sprintId) {
    const { Sprint } = req.db;

    const sprint = await Sprint.findByPk(sprintId);
    if (!sprint)
      return { success: false, status: 404, message: "Sprint not found" };

    if (sprint.status !== "planned") {
      return {
        success: false,
        status: 400,
        message: "Only planned sprints can be started",
      };
    }

    // Check if another sprint is active for this project
    const activeSprint = await Sprint.findOne({
      where: {
        project_id: sprint.project_id,
        status: "active",
      },
    });

    if (activeSprint) {
      return {
        success: false,
        status: 400,
        message: "Another sprint is already active for this project",
      };
    }

    sprint.status = "active";
    // If start_date wasn't set, set it now
    if (!sprint.start_date) sprint.start_date = new Date();

    await sprint.save();

    return { success: true, data: sprint };
  }

  /**
   * End Sprint
   */
  static async endSprint(req, sprintId) {
    const { Sprint, Issue } = req.db;

    const sprint = await Sprint.findByPk(sprintId);
    if (!sprint)
      return { success: false, status: 404, message: "Sprint not found" };

    if (sprint.status !== "active") {
      return {
        success: false,
        status: 400,
        message: "Only active sprints can be ended",
      };
    }

    sprint.status = "completed";
    await sprint.save();

    // All stories stay linked to the sprint (sprint_id = sprintId) so that the
    // completed sprint view always shows its full contents as a historical record.
    // The backlog query is updated to also surface stories from completed sprints
    // so incomplete work remains visible for replanning.

    return { success: true, data: sprint };
  }

  /**
   * Add Issues to Sprint
   */
  static async addIssues(req, data) {
    const { Sprint, Issue } = req.db;
    const { sprint_id, issue_ids } = data; // Array of issue IDs

    const sprint = await Sprint.findByPk(sprint_id);
    if (!sprint)
      return { success: false, status: 404, message: "Sprint not found" };

    if (sprint.status === "completed") {
      return {
        success: false,
        status: 400,
        message: "Cannot add issues to a completed sprint",
      };
    }

    // Update issues
    await Issue.update(
      { sprint_id: sprint_id },
      {
        where: {
          id: { [Op.in]: issue_ids },
          project_id: sprint.project_id, // Ensure issues belong to same project
        },
        ...withContext(req),
      },
    );

    return { success: true, message: "Issues added to sprint" };
  }

  /**
   * Add User Stories to Sprint
   */
  static async addStories(req, data) {
    const { Sprint, UserStory } = req.db;
    const { sprint_id, story_ids } = data;

    const sprint = await Sprint.findByPk(sprint_id);
    if (!sprint)
      return { success: false, status: 404, message: "Sprint not found" };

    if (sprint.status === "completed") {
      return {
        success: false,
        status: 400,
        message: "Cannot add stories to a completed sprint",
      };
    }

    // Reject if any of the requested stories are already completed
    const completedCount = await UserStory.count({
      where: {
        id: { [Op.in]: story_ids },
        project_id: sprint.project_id,
        status: "completed",
      },
    });
    if (completedCount > 0) {
      return {
        success: false,
        status: 400,
        message: `Cannot add ${completedCount} already-completed story(s) to a sprint.`,
      };
    }

    await UserStory.update(
      { sprint_id },
      {
        where: {
          id: { [Op.in]: story_ids },
          project_id: sprint.project_id,
        },
        ...withContext(req),
      },
    );

    return { success: true, message: "User stories added to sprint" };
  }

  /**
   * Get User Stories in a Sprint (Kanban board data)
   */
  static async getSprintStories(req, sprintId) {
    const { Sprint, UserStory, IssueStatus, Feature } = req.db;

    const sprint = await Sprint.findByPk(sprintId);
    if (!sprint)
      return { success: false, status: 404, message: "Sprint not found" };

    const stories = await UserStory.findAll({
      where: {
        sprint_id: sprintId,
        story_for: "normal",
        parent_user_story_id: null,
      },
      order: [
        ["backlog_order", "ASC"],
        ["updated_at", "DESC"],
      ],
      include: [
        {
          model: IssueStatus,
          as: "issueStatus",
          attributes: ["id", "name", "category", "color"],
        },
        {
          model: Feature,
          as: "feature",
          attributes: ["id", "name"],
        },
      ],
    });

    return { success: true, data: { sprint, stories } };
  }

  /**
   * Get Sprint Backlog (Issues in Sprint)
   */
  static async getSprintBacklog(req, sprintId) {
    const { Sprint, Issue, IssueStatus, IssueType, ProjectMember } = req.db;

    const sprint = await Sprint.findByPk(sprintId, {
      include: [
        {
          model: Issue,
          as: "issues",
          include: [
            {
              model: IssueStatus,
              as: "issueStatus",
              attributes: ["id", "name", "category", "color"],
            },
            {
              model: IssueType,
              as: "type",
              attributes: ["id", "name", "icon"],
            },
            {
              model: ProjectMember,
              as: "assignee",
              attributes: ["id", "user_id"],
            },
          ],
        },
      ],
    });

    if (!sprint)
      return { success: false, status: 404, message: "Sprint not found" };

    return { success: true, data: sprint };
  }

  /**
   * List Sprints by Project
   */
  static async listSprints(req, projectId, status) {
    const { Sprint } = req.db;

    const where = { project_id: projectId };
    if (status) where.status = status;

    const sprints = await Sprint.findAll({
      where,
      order: [["created_at", "DESC"]],
    });

    return { success: true, data: sprints };
  }
}

module.exports = SprintService;
