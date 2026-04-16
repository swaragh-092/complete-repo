// Author: Copilot
// Created: 18th Mar 2026
// Description: Project Board Controller
// Version: 1.0.0

const BoardService = require("../../services/project/Board.service");
const ResponseService = require("../../services/Response");
const { sendErrorResponse } = require("../../util/helper");
const { validationResult } = require("express-validator");

class BoardController {
  // Get Board (Columns + Issues)
  static async getBoard(req, res) {
    const thisAction = { usedFor: "Board", action: "Get Board" };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendErrorResponse(
          thisAction,
          { message: errors.array()[0].msg },
          res,
        );
      }

      const projectId = req.params.projectId;
      const type = req.query.type || "kanban";

      const result = await BoardService.getBoard(req, projectId, type);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Move Issue
  static async moveIssue(req, res) {
    const thisAction = { usedFor: "Board", action: "Move Issue" };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendErrorResponse(
          thisAction,
          { message: errors.array()[0].msg },
          res,
        );
      }

      // Allow underscores or camelCase from body
      const issue_id = req.body.issue_id || req.body.issueId;
      const to_column_id = req.body.to_column_id || req.body.toColumnId;
      const to_status_id = req.body.to_status_id || req.body.toStatusId;
      const new_board_order =
        req.body.new_board_order || req.body.newBoardOrder;

      const result = await BoardService.moveIssue(req, {
        issueId: issue_id,
        toColumnId: to_column_id,
        toStatusId: to_status_id,
        newBoardOrder: new_board_order,
      });

      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Move User Story (Column/Status change on board drag)
  static async moveStory(req, res) {
    const thisAction = { usedFor: "Board", action: "Move Story" };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return sendErrorResponse(
          thisAction,
          { message: errors.array()[0].msg },
          res,
        );

      const story_id = req.body.story_id;
      const to_status_id = req.body.to_status_id;
      const to_column_id = req.body.to_column_id;
      const new_board_order = req.body.new_board_order ?? null;

      const result = await BoardService.moveStory(req, {
        storyId: story_id,
        toStatusId: to_status_id,
        toColumnId: to_column_id,
        newBoardOrder: new_board_order,
      });

      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }
}

module.exports = BoardController;
