// Author: Copilot
// Created: 18th Mar 2026
// Description: Issue Attachment Controller
// Version: 1.0.0

const AttachmentService = require("../../services/issue/Attachment.service");
const ResponseService = require("../../services/Response");
const { sendErrorResponse } = require("../../util/helper");
const { validationResult } = require("express-validator");

class AttachmentController {
  // Add Attachment
  static async addAttachment(req, res) {
    const thisAction = { usedFor: "Issue", action: "Add Attachment" };
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
      const file = req.file;

      const result = await AttachmentService.addAttachment(req, {
        issue_id: issue_id,
        file: file,
      });
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // List Attachments
  static async listAttachments(req, res) {
    const thisAction = { usedFor: "Issue", action: "List Attachments" };
    try {
      const issue_id = req.params.id;
      const result = await AttachmentService.getAttachments(req, issue_id);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Download Attachment
  static async downloadAttachment(req, res) {
    const thisAction = { usedFor: "Issue", action: "Download Attachment" };
    try {
      const attachment_id = req.params.attachmentId;
      const result = await AttachmentService.getAttachmentForDownload(
        req,
        attachment_id,
      );

      if (!result.success) {
        return sendErrorResponse(
          thisAction,
          { message: result.message },
          res,
          result.status || 404,
        );
      }

      const attachment = result.data;
      // Serve file
      res.download(attachment.file_path, attachment.file_name);
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Delete Attachment
  static async deleteAttachment(req, res) {
    const thisAction = { usedFor: "Issue", action: "Delete Attachment" };
    try {
      const attachment_id = req.params.attachmentId;
      const result = await AttachmentService.deleteAttachment(
        req,
        attachment_id,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }
}

module.exports = AttachmentController;
