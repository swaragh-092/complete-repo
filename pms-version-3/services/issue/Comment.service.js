// Author: Copilot
// Created: 17th Mar 2026
// Description: Issue Comment Service
// Version: 1.0.0

const NotificationService = require("../notification/notification.service");
const { withContext } = require("../../util/helper");
const { authClient } = require("../serviceClients");

class CommentService {
  /**
   * Add a comment to an issue
   * @param {Object} req - Express request
   * @param {Object} data - { issue_id, content }
   */
  static async addComment(req, data) {
    const { Issue, IssueComment, IssueHistory } = req.db;
    const { issue_id, content } = data;
    const user_id = req.user.id;

    // 1. Validate Issue
    const issue = await Issue.findByPk(issue_id);
    if (!issue) {
      return { success: false, status: 404, message: "Issue not found" };
    }

    // 2. Create Comment
    const comment = await IssueComment.create(
      {
        issue_id,
        user_id,
        content,
      },
      withContext(req),
    );

    // 3. Log History
    await IssueHistory.create(
      {
        issue_id,
        user_id,
        action_type: "commented",
        comment: "Added a comment",
      },
      withContext(req),
    );

    // Notify
    await NotificationService.notifyCommentAdded(req, issue_id, content);

    return { success: true, status: 201, data: comment };
  }

  /**
   * Update a comment
   * @param {Object} req - Express request
   * @param {String} commentId - Comment ID
   * @param {Object} data - { content }
   */
  static async updateComment(req, commentId, data) {
    const { IssueComment } = req.db;
    const { content } = data;
    const user_id = req.user.id;

    // 1. Find Comment
    const comment = await IssueComment.findByPk(commentId);
    if (!comment) {
      return { success: false, status: 404, message: "Comment not found" };
    }

    // 2. Authorization (Only author can edit)
    // Note: Admin might be able to edit too, but for now stick to author.
    if (comment.user_id !== user_id) {
      // Check if user is super admin? For now simple check.
      // If `req.user.role` exists and is 'admin', maybe allow.
      // Sticking to author for simplicity as per common requirement.
      return {
        success: false,
        status: 403,
        message: "Unauthorized to edit this comment",
      };
    }

    // 3. Update
    comment.content = content;
    await comment.save(withContext(req));

    return { success: true, data: comment };
  }

  /**
   * Delete a comment
   * @param {Object} req - Express request
   * @param {String} commentId - Comment ID
   */
  static async deleteComment(req, commentId) {
    const { IssueComment } = req.db;
    const user_id = req.user.id;

    // 1. Find Comment
    const comment = await IssueComment.findByPk(commentId);
    if (!comment) {
      return { success: false, status: 404, message: "Comment not found" };
    }

    // 2. Authorization (Only author or admin can delete)
    // Assuming req.user.roles or similar.
    // Simplifying to author only for now unless specific instructions.
    if (comment.user_id !== user_id) {
      return {
        success: false,
        status: 403,
        message: "Unauthorized to delete this comment",
      };
    }

    // 3. Delete (Soft delete due to paranoid: true)
    await comment.destroy(withContext(req));

    return { success: true, message: "Comment deleted successfully" };
  }

  /**
   * Get comments for an issue
   * @param {Object} req - Express request
   * @param {String} issueId - Issue ID
   */
  static async getCommentsByIssue(req, issueId) {
    const { IssueComment, Issue } = req.db;

    // 1. Validate Issue existence
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return { success: false, status: 404, message: "Issue not found" };
    }

    // 2. Fetch Comments
    const comments = await IssueComment.findAll({
      where: { issue_id: issueId },
      order: [["created_at", "ASC"]],
    });

    if (comments.length === 0) {
      return { success: true, data: [] };
    }

    // 3. Enrich with user details from auth service
    const userIds = [
      ...new Set(comments.map((c) => c.user_id).filter(Boolean)),
    ];
    let userMap = {};
    try {
      const client = authClient();
      const res = await client.post("/auth/internal/users/lookup", {
        user_ids: userIds,
      });
      if (res.data?.data?.users) {
        userMap = res.data.data.users.reduce((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {});
      }
    } catch (e) {
      console.error("[Comment] Failed to fetch user details:", e.message);
    }

    const enriched = comments.map((c) => ({
      ...(c.toJSON ? c.toJSON() : { ...c }),
      user_details: userMap[c.user_id] || null,
    }));

    return { success: true, data: enriched };
  }
}

module.exports = CommentService;
