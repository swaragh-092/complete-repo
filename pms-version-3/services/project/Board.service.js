// Author: Copilot
// Created: 18th Mar 2026
// Updated: 24th Mar 2026 — User Stories as primary board items
// Description: Board (Agile) Service
// Version: 2.0.0

const { Op } = require("sequelize");
const { withContext } = require("../../util/helper");

class BoardService {
  /**
   * Get or Create Board for Project (User Stories grouped by status column)
   */
  static async getBoard(req, projectId, type = "kanban") {
    const { Board, BoardColumn, IssueStatus, UserStory, Feature } = req.db;

    // 1. Check existing board
    let board = await Board.findOne({
      where: { project_id: projectId },
      include: [{ model: BoardColumn, as: "columns" }],
      order: [[{ model: BoardColumn, as: "columns" }, "position", "ASC"]],
    });

    // 2. If not exists, initialize
    if (!board) {
      board = await this.initializeBoard(req, projectId, type);
    }

    // 3. Fetch User Stories for the project (normal stories only)
    const stories = await UserStory.findAll({
      where: { project_id: projectId, story_for: "normal" },
      order: [
        ["backlog_order", "ASC"],
        ["updated_at", "DESC"],
      ],
      include: [
        {
          model: IssueStatus,
          as: "issueStatus",
          attributes: ["id", "name", "color"],
        },
        {
          model: Feature,
          as: "feature",
          attributes: ["id", "name"],
        },
      ],
    });

    // 4. Map stories to columns by status_id
    const boardData = board.toJSON();
    boardData.columns = boardData.columns.map((col) => {
      const statusIds = col.mapped_status_ids || [];
      return {
        ...col,
        stories: stories.filter((s) => statusIds.includes(s.status_id)),
      };
    });

    // Stories with no status_id or unmapped status go to a virtual "backlog" bucket
    const allMappedStatusIds = boardData.columns.flatMap(
      (c) => c.mapped_status_ids || [],
    );
    boardData.unmapped_stories = stories.filter(
      (s) => !s.status_id || !allMappedStatusIds.includes(s.status_id),
    );

    return { success: true, data: boardData };
  }

  /**
   * Initialize a new board with columns from existing statuses
   */
  static async initializeBoard(req, projectId, type) {
    const { Board, BoardColumn, IssueStatus } = req.db;

    const board = await Board.create({
      project_id: projectId,
      name: "Main Board",
      type,
    });

    const statuses = await IssueStatus.findAll({
      where: { [Op.or]: [{ project_id: projectId }, { project_id: null }] },
      order: [["position", "ASC"]],
    });

    const columnsData = statuses.map((status, index) => ({
      board_id: board.id,
      name: status.name,
      position: index,
      mapped_status_ids: [status.id],
    }));

    if (columnsData.length > 0) await BoardColumn.bulkCreate(columnsData);

    return Board.findByPk(board.id, {
      include: [{ model: BoardColumn, as: "columns" }],
      order: [[{ model: BoardColumn, as: "columns" }, "position", "ASC"]],
    });
  }

  /**
   * Move User Story between columns (change status_id + optional board order)
   */
  static async moveStory(req, data) {
    const { UserStory, IssueStatus, BoardColumn } = req.db;
    const { storyId, toStatusId, toColumnId, newBoardOrder } = data;

    const story = await UserStory.findByPk(storyId);
    if (!story)
      return { success: false, status: 404, message: "Story not found" };

    let targetStatusId = toStatusId;

    if (!targetStatusId && toColumnId) {
      const column = await BoardColumn.findByPk(toColumnId);
      if (!column)
        return { success: false, status: 404, message: "Column not found" };
      if (column.mapped_status_ids?.length > 0) {
        targetStatusId = column.mapped_status_ids[0];
      } else {
        return {
          success: false,
          status: 400,
          message: "Column has no mapped status",
        };
      }
    }

    if (targetStatusId && story.status_id !== targetStatusId) {
      const newStatus = await IssueStatus.findByPk(targetStatusId, {
        attributes: ["name", "category"],
      });

      // Block move to Done if any sub-items are not yet completed
      if (newStatus?.category === "done") {
        const incompleteCount = await UserStory.count({
          where: {
            parent_user_story_id: storyId,
            status: { [Op.notIn]: ["completed"] },
          },
        });
        if (incompleteCount > 0) {
          return {
            success: false,
            status: 400,
            message: `Cannot move to Done: ${incompleteCount} sub-item(s) are not yet completed.`,
          };
        }
      }

      story.status_id = targetStatusId;
      // Sync system status field with board category
      if (newStatus?.category === "done") story.status = "completed";
      else if (newStatus?.category === "in_progress")
        story.status = "in_progress";
    }

    if (newBoardOrder != null) story.backlog_order = newBoardOrder;

    await story.save(withContext(req));
    return { success: true, data: story };
  }

  /**
   * Legacy: Move Issue (kept for backward compatibility with bug-tracker board)
   */
  static async moveIssue(req, data) {
    const { Issue, BoardColumn, IssueStatus, IssueHistory } = req.db;
    const { issueId, toColumnId, newIndex, toStatusId } = data;
    const userId = req.user.id;

    const issue = await Issue.findByPk(issueId);
    if (!issue)
      return { success: false, status: 404, message: "Issue not found" };

    let targetStatusId = toStatusId;

    if (!targetStatusId && toColumnId) {
      const column = await BoardColumn.findByPk(toColumnId);
      if (!column)
        return {
          success: false,
          status: 404,
          message: "Target column not found",
        };
      if (column.mapped_status_ids?.length > 0) {
        targetStatusId = column.mapped_status_ids[0];
      } else {
        return {
          success: false,
          status: 400,
          message: "Target column has no mapped status",
        };
      }
    }

    if (targetStatusId && issue.status_id !== targetStatusId) {
      issue.status_id = targetStatusId;
      const { IssueStatus: IS } = req.db;
      const newStatus = await IS.findByPk(targetStatusId, {
        attributes: ["name"],
      });
      const statusName = newStatus ? newStatus.name : targetStatusId;
      await IssueHistory.create(
        {
          issue_id: issue.id,
          user_id: userId,
          action_type: "status_change",
          comment: `Status changed to ${statusName}`,
        },
        withContext(req),
      );
    }

    if (data.newBoardOrder) issue.board_order = data.newBoardOrder;
    await issue.save();
    return { success: true, data: issue };
  }
}

module.exports = BoardService;
