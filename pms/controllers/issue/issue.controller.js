// Author: Gururaj
// Created: 14th oct 2025
// Description: all issue related functionality controller.
// Version: 1.0.0
// Modified:


const IssueService = require("../../services/issue/issue.service");
const ResponseService = require("../../services/Response");
const { fieldPicker, sendErrorResponse } = require("../../util/helper");

class IssueController {
  // create new issue
  static async create(req, res) {
    const thisAction = { usedFor: "Issue", action: "create" };
    try {
      const allowedFields = [
        { field: "projectId", as: "project_id", source: "params" },
        "from_department_id",
        "to_department_id",
        "issue_type_id",
        "title",
        "description",
      ];
      const data = fieldPicker(req, allowedFields);
      const result = await IssueService.createIssue( req, data );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  } 

  // accept issue from developer or any of the dept
  static async accept(req, res) {
    const thisAction = { usedFor: "Issue", action: "Accept" };
    try {
      const result = await IssueService.acceptOrRejectIssue(req, req.params.id);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      
       return sendErrorResponse(thisAction, err, res);
    }
  }
  // reject issue from developer or any of the dept
  static async reject(req, res) {
    const thisAction = { usedFor: "Issue", action: "Reject" };
    try {
      const result = await IssueService.acceptOrRejectIssue(req, req.params.id, "reject", req.body.reject_reason);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      
       return sendErrorResponse(thisAction, err, res);
    }
  }

  // reassing issue to seperate department.
  static async reassign(req, res) {
    const thisAction = { usedFor: "Issue", action: "Reassign Department" };
    try {
      const data = {issueId : req.params.id, to_department_id : req.params.toDepartmentid};
      const result = await IssueService.reassignIssue(
        req,
        data,
      );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {

      return sendErrorResponse(thisAction, err, res);
    }
  }

  // resolve the issue next tester should check is issue cleared or not
  static async resolve(req, res) {
    const thisAction = { usedFor: "Issue", action: "Resolve" };
    try {
      const result = await IssueService.resolveIssue(req, req.params.id);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }
  
  // when tester check the issue then he concluding is celared or reopen the same issue
  static async closeOrReOpen(req, res) {
    const thisAction = { usedFor: "Issue", action: "Finilize" };
    try {
      const allowedFields = [
        { field: "id", as: "issueId", source: "params" },
        "status",
        "comment"
      ];
      const data = fieldPicker(req, allowedFields);
      const result = await IssueService.closeOrReopenIssue(req, data);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // list issues based on project
  static async listByProject(req, res) {
    const thisAction = { usedFor: "Issues", action: "Get" };
    try {
      console.log("hai here i am " + req.params.issueId);
      const result = await IssueService.listIssues(req, req.params.projectId, req.query);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // get issue by id
  static async getIssue(req, res) {
    const thisAction = { usedFor: "Issue", action: "Get" };
    try {
      const result = await IssueService.getIssue(req, req.params.issueId);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // get issue history
  static async getIssueHistory(req, res) {
    const thisAction = { usedFor: "Issue History", action: "Get" };
    try {
      const result = await IssueService.getIssueHistory(req, req.params.issueId);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // create task for issue from the department who accepts that issue
  static async createTaskForIssue(req, res) {
    const thisAction = { usedFor: "Issue Task", action: "Create" };
    try {
      const allowedFileds = [
        { field: "id", as: "issue_id", source: "params" },
          "title",
          "description",
          "priority",
          "due_date"
      ];
      const data = fieldPicker(req, allowedFileds);
      const result = await IssueService.createTaskForIssueSolving(req, data);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  };

  // get all issue types
  static async getIssueTypes(req, res) {
    const thisAction = { usedFor: "Issue Type", action: "Get" };
    try {
      const result = await IssueService.getIssueTypes( req );
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  };

  // create new issue type 
  static async createIssueType(req, res) {
    const thisAction = { usedFor: "Issue Type", action: "Create" };
    try {
      const allowedFields = [
        "name",
        "description",
      ];
      const data = fieldPicker(req, allowedFields);
      const result = await IssueService.createIssueType(req, data);
      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      
      return sendErrorResponse(thisAction, err, res);
    }
  };
}

module.exports = IssueController;
