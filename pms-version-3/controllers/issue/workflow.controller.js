// Author: Gururaj
// Description: Controller for Workflow Management
// Version: 1.0.0

const WorkflowService = require("../../services/issue/workflow.service");
const ResponseService = require("../../services/Response");
const { fieldPicker, sendErrorResponse } = require("../../util/helper");

class WorkflowController {
  // Create Status
  static async createStatus(req, res) {
    const thisAction = { usedFor: "Workflow", action: "Create Status" };
    try {
      const allowedFields = [
        "project_id",
        "name",
        "category",
        "color",
        "position",
      ];
      const data = fieldPicker(req, allowedFields);

      if (req.params.projectId) data.project_id = req.params.projectId;

      const result = await WorkflowService.createStatus(req, data);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Add Transition
  static async addTransition(req, res) {
    const thisAction = { usedFor: "Workflow", action: "Add Transition" };
    try {
      const { from_status_id, to_status_id } = req.body;
      const projectId = req.params.projectId || req.body.project_id;

      if (!projectId || !from_status_id || !to_status_id) {
        throw new Error("Missing required fields");
      }

      const result = await WorkflowService.addTransition(
        req,
        projectId,
        from_status_id,
        to_status_id,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // Get Workflow
  static async getWorkflow(req, res) {
    const thisAction = { usedFor: "Workflow", action: "Get Config" };
    try {
      const result = await WorkflowService.getWorkflow(
        req,
        req.params.projectId,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }
}

module.exports = WorkflowController;
