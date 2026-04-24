// Author: Copilot
// Created: 18th Mar 2026
// Description: Backlog Service (Sprint Backlog & Project Backlog Management)
// Version: 1.0.0

const { Op } = require("sequelize");
const { withContext } = require("../../util/helper");

class BacklogService {
  /**
   * Get Issue Backlog for a Project (Issues not in any sprint OR issues in 'planned' sprints depending on definition)
   * Typically "Backlog" means sprint_id IS NULL.
   * However, sometimes it includes future sprints. The requirement implies "Backlog" as a holding area.
   * We will define Backlog as issues with sprint_id: null.
   */
  static async getBacklog(req, projectId) {
    const { Issue, IssueStatus, IssueType, ProjectMember, Project } = req.db;

    // Fetch issues where sprint_id is null
    const issues = await Issue.findAll({
      where: {
        project_id: projectId,
        sprint_id: null,
      },
      order: [
        ["board_order", "ASC"],
        ["updated_at", "DESC"],
      ],
      include: [
        {
          model: IssueStatus,
          as: "issueStatus",
          attributes: ["id", "name", "category", "color"],
        },
        {
          model: IssueType,
          as: "type",
          attributes: ["id", "name"],
        },
        {
          model: ProjectMember,
          as: "assignee",
          attributes: ["id", "user_id"],
        },
      ],
    });

    return { success: true, data: issues };
  }

  /**
   * Prioritize Issue in Backlog (Reorder)
   * The client should calculate the new board_order (e.g. average of prev and next item)
   */
  static async prioritizeIssue(req, issueId, newOrder) {
    const { Issue, IssueHistory } = req.db;
    const userId = req.user.id; // User ID from auth middleware

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return { success: false, status: 404, message: "Issue not found" };
    }

    const oldOrder = issue.board_order;
    issue.board_order = newOrder;
    await issue.save(withContext(req));

    // Log if significant change? Usually reordering is frequent, maybe skip log unless status changes.
    // Or log 'prioritized'.

    return {
      success: true,
      message: "Backlog prioritized",
      data: { id: issue.id, board_order: issue.board_order },
    };
  }

  /**
   * Move Issue to Sprint
   * Move from Backlog -> Sprint (or Sprint -> Backlog if sprintId is null)
   */
  static async moveIssueToSprint(req, issueId, sprintId) {
    const { Issue, Sprint, IssueHistory } = req.db;
    const userId = req.user.id;

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return { success: false, status: 404, message: "Issue not found" };
    }

    if (sprintId) {
      const sprint = await Sprint.findByPk(sprintId);
      if (!sprint) {
        return {
          success: false,
          status: 404,
          message: "Target sprint not found",
        };
      }
      if (sprint.status === "completed") {
        return {
          success: false,
          status: 400,
          message: "Cannot move issue to a completed sprint",
        };
      }
    }

    const oldSprintId = issue.sprint_id;

    if (oldSprintId !== sprintId) {
      issue.sprint_id = sprintId; // Can be null (backlog) or UUID
      await issue.save(withContext(req));

      // History
      const action = sprintId ? `Moved to sprint` : `Moved to backlog`;
      await IssueHistory.create(
        {
          issue_id: issue.id,
          user_id: userId,
          action_type: "updated",
          comment: action,
        },
        withContext(req),
      );
    }

    return { success: true, data: issue };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Story-Backlog helpers (User Stories as sprint work items)
// ──────────────────────────────────────────────────────────────────────────────

class StoryBacklogService {
  /**
   * Get User Story Backlog for a Project (stories with sprint_id IS NULL)
   */
  static async getStoryBacklog(req, projectId) {
    const { UserStory, IssueStatus, Feature, Sprint } = req.db;

    // Find all completed sprint IDs for this project so their stories also
    // show in the backlog for replanning (stories stay in the sprint for history).
    const completedSprints = await Sprint.findAll({
      where: { project_id: projectId, status: "completed" },
      attributes: ["id"],
    });
    const completedSprintIds = completedSprints.map((s) => s.id);

    const whereClause = {
      project_id: projectId,
      story_for: "normal",
      parent_user_story_id: null,
    };

    if (completedSprintIds.length > 0) {
      whereClause[Op.or] = [
        { sprint_id: null },
        { sprint_id: { [Op.in]: completedSprintIds } },
      ];
    } else {
      whereClause.sprint_id = null;
    }

    const stories = await UserStory.findAll({
      where: whereClause,
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

    return { success: true, data: stories };
  }

  /**
   * Reorder a Story in the backlog
   */
  static async prioritizeStory(req, storyId, newOrder) {
    const { UserStory } = req.db;

    const story = await UserStory.findByPk(storyId);
    if (!story)
      return { success: false, status: 404, message: "Story not found" };

    story.backlog_order = newOrder;
    await story.save(withContext(req));

    return {
      success: true,
      message: "Backlog reordered",
      data: { id: story.id, backlog_order: story.backlog_order },
    };
  }

  /**
   * Move a User Story to a Sprint (or back to backlog)
   */
  static async moveStoryToSprint(req, storyId, sprintId) {
    const { UserStory, Sprint } = req.db;

    const story = await UserStory.findByPk(storyId);
    if (!story)
      return { success: false, status: 404, message: "Story not found" };

    if (sprintId) {
      const sprint = await Sprint.findByPk(sprintId);
      if (!sprint)
        return { success: false, status: 404, message: "Sprint not found" };
      if (sprint.status === "completed")
        return {
          success: false,
          status: 400,
          message: "Cannot move story to a completed sprint",
        };
    }

    story.sprint_id = sprintId ?? null;
    await story.save(withContext(req));

    return { success: true, data: story };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Component-Backlog helpers for Site-type projects
// Mirrors StoryBacklogService but operates on pms_components.
// ──────────────────────────────────────────────────────────────────────────────

class ComponentBacklogService {
  /**
   * Get Component Backlog for a Site-type project (components with sprint_id IS NULL,
   * plus components in completed sprints for replanning).
   */
  static async getComponentBacklog(req, projectId) {
    const { Component, Sprint } = req.db;

    const completedSprints = await Sprint.findAll({
      where: { project_id: projectId, status: 'completed' },
      attributes: ['id'],
    });
    const completedSprintIds = completedSprints.map((s) => s.id);

    const whereClause = {
      project_id: projectId,
      component_for: 'normal',
      parent_component_id: null,
    };

    if (completedSprintIds.length > 0) {
      whereClause[Op.or] = [
        { sprint_id: null },
        { sprint_id: { [Op.in]: completedSprintIds } },
      ];
    } else {
      whereClause.sprint_id = null;
    }

    const components = await Component.findAll({
      where: whereClause,
      order: [['board_order', 'ASC'], ['updated_at', 'DESC']],
      include: [
        { association: 'section', attributes: ['id', 'name', 'page_id'] },
        { association: 'sprint', attributes: ['id', 'name', 'status'] },
        { association: 'subComponents', attributes: ['id', 'title', 'status', 'sort_order'] },
      ],
    });

    return { success: true, data: components };
  }

  /**
   * Reorder a Component in the backlog.
   */
  static async prioritizeComponent(req, componentId, newOrder) {
    const { Component } = req.db;

    const component = await Component.findByPk(componentId);
    if (!component) {
      return { success: false, status: 404, message: 'Component not found' };
    }

    component.board_order = newOrder;
    await component.save(withContext(req));

    return { success: true, message: 'Backlog reordered', data: { id: component.id, board_order: component.board_order } };
  }

  /**
   * Move a Component to a Sprint (or back to backlog).
   */
  static async moveComponentToSprint(req, componentId, sprintId) {
    const { Component, Sprint } = req.db;

    const component = await Component.findByPk(componentId);
    if (!component) {
      return { success: false, status: 404, message: 'Component not found' };
    }

    if (sprintId) {
      const sprint = await Sprint.findByPk(sprintId);
      if (!sprint) {
        return { success: false, status: 404, message: 'Sprint not found' };
      }
      if (sprint.status === 'completed') {
        return { success: false, status: 400, message: 'Cannot move component to a completed sprint' };
      }
    }

    component.sprint_id = sprintId ?? null;
    await component.save(withContext(req));

    return { success: true, data: component };
  }
}

module.exports = { BacklogService, StoryBacklogService, ComponentBacklogService };
