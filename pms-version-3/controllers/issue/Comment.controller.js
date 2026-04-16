// Author: Copilot
// Created: 17th Mar 2026
// Description: Issue Comment Controller
// Version: 1.0.0

const CommentService = require("../../services/issue/Comment.service");
const ResponseService = require("../../services/Response");
const { sendErrorResponse } = require("../../util/helper");
const { validationResult } = require("express-validator");

class CommentController {
  // Add Comment
  static async addComment(req, res) {
    const thisAction = { usedFor: "Issue", action: "Add Comment" };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendErrorResponse(
          thisAction,
          { message: errors.array()[0].msg },
          res,
        );
      }

      const issue_id = req.params.id;
      const { content } = req.body;

      const result = await CommentService.addComment(req, {
        issue_id,
        content,
      });
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Update Comment
  static async updateComment(req, res) {
    const thisAction = { usedFor: "Issue", action: "Update Comment" };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendErrorResponse(
          thisAction,
          { message: errors.array()[0].msg },
          res,
        );
      }

      const comment_id = req.params.commentId;
      const { content } = req.body;

      const result = await CommentService.updateComment(req, comment_id, {
        content,
      });
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Delete Comment
  static async deleteComment(req, res) {
    const thisAction = { usedFor: "Issue", action: "Delete Comment" };
    try {
      const comment_id = req.params.commentId;
      const result = await CommentService.deleteComment(req, comment_id);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Get Comments
  static async getComments(req, res) {
    const thisAction = { usedFor: "Issue", action: "Get Comments" };
    try {
      const issue_id = req.params.id;
      const result = await CommentService.getCommentsByIssue(req, issue_id);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }
}

module.exports = CommentController;
