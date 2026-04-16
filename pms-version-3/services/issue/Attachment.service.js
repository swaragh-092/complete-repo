// Author: Copilot
// Created: 18th Mar 2026
// Description: Issue Attachment Service
// Version: 1.0.0

const fs = require("fs");
const path = require("path");
const { withContext } = require("../../util/helper");

class AttachmentService {
  /**
   * Log attachment in DB and history
   * @param {Object} req - Express request
   * @param {Object} data - { issue_id, file }
   */
  static async addAttachment(req, data) {
    const { Issue, IssueAttachment, IssueHistory } = req.db;
    const { issue_id, file } = data;
    const user_id = req.user.id;

    if (!file) {
      return { success: false, status: 400, message: "No file uploaded" };
    }

    // 1. Validate Issue
    const issue = await Issue.findByPk(issue_id);
    if (!issue) {
      // Clean up uploaded file if issue not found
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return { success: false, status: 404, message: "Issue not found" };
    }

    // 2. Create Attachment Record
    const attachment = await IssueAttachment.create(
      {
        issue_id,
        user_id,
        file_name: file.originalname,
        file_path: file.path,
        file_type: file.mimetype,
        file_size: file.size,
      },
      withContext(req),
    );

    // 3. Log History
    await IssueHistory.create(
      {
        issue_id,
        user_id,
        action_type: "updated",
        comment: `Attached file: ${file.originalname}`,
      },
      withContext(req),
    );

    return { success: true, status: 201, data: attachment };
  }

  /**
   * Get attachments for an issue
   * @param {Object} req
   * @param {String} issueId
   */
  static async getAttachments(req, issueId) {
    const { IssueAttachment, Issue } = req.db;

    // 1. Validate Issue
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return { success: false, status: 404, message: "Issue not found" };
    }

    // 2. Fetch Attachments
    const attachments = await IssueAttachment.findAll({
      where: { issue_id: issueId },
      order: [["created_at", "DESC"]],
      attributes: { exclude: ["file_path"] }, // Don't expose internal path
    });

    return { success: true, data: attachments };
  }

  /**
   * Get attachment details for download
   * @param {Object} req
   * @param {String} attachmentId
   */
  static async getAttachmentForDownload(req, attachmentId) {
    const { IssueAttachment } = req.db;

    const attachment = await IssueAttachment.findByPk(attachmentId);
    if (!attachment) {
      return { success: false, status: 404, message: "Attachment not found" };
    }

    // Check if file physically exists
    if (!fs.existsSync(attachment.file_path)) {
      return {
        success: false,
        status: 404,
        message: "File not found on server",
      };
    }

    return { success: true, data: attachment };
  }

  /**
   * Delete attachment
   * @param {Object} req
   * @param {String} attachmentId
   */
  static async deleteAttachment(req, attachmentId) {
    const { IssueAttachment, IssueHistory } = req.db;
    const user_id = req.user.id;

    // 1. Find Attachment
    const attachment = await IssueAttachment.findByPk(attachmentId);
    if (!attachment) {
      return { success: false, status: 404, message: "Attachment not found" };
    }

    // 2. Authorization (Only uploader)
    if (attachment.user_id !== user_id) {
      // Admin check could be here
      return {
        success: false,
        status: 403,
        message: "Unauthorized to delete this attachment",
      };
    }

    const { issue_id, file_name, file_path } = attachment;

    // 3. Delete from DB (Soft Delete)
    await attachment.destroy(withContext(req));

    // 4. Ideally keep file for soft-delete/audit capability, but usually requirement implies removal from storage to save space?
    // Given "paranoid: true" (soft delete), we should probably KEEP the file on disk so it can be restored if the record is restored.
    // If requirement implies permanent delete, we would use force: true and unlink file.
    // Let's stick to soft delete of record, keeping file. A specific cleanup job could expire soft-deleted files.

    // However, usually users expect "Delete" to free up space or remove sensitive data.
    // But since `paranoid: true` is set in model, the intention is archival.
    // If I delete the file from disk, restoring the row would point to a missing file.

    // I will simply Soft Delete the row.

    // 5. Log History
    await IssueHistory.create(
      {
        issue_id,
        user_id,
        action_type: "updated",
        comment: `Deleted attachment: ${file_name}`,
      },
      withContext(req),
    );

    return { success: true, message: "Attachment deleted successfully" };
  }
}

module.exports = AttachmentService;
