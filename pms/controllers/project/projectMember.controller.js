// Author: Gururaj 
// Created: 14th oct 2025
// Description: Controller for project-members related routes.
// Version: 1.0.0

const ProjectMemberService = require("../../services/project/projectMember.serice");
const ResponseService = require("../../services/Response");
const { fieldPicker, sendErrorResponse } = require("../../util/helper");

// add members to the project 
exports.addMembers = async (req, res) => {
  const thisAction = { usedFor: "Project Members", action: "Add" };
  try {
    const allowedFileds = [
        { field: "departmentId", as: "department_id", source: "params" },
        { field: "projectId", as: "project_id", source: "params"  },
        "users"
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await ProjectMemberService.addMembers(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// get members of the project based on department
exports.getMembers = async (req, res) => {
  const thisAction = { usedFor: "Project Members", action: "Get" };
  try {
    const allowedFileds = [
        { field: "departmentId", as: "department_id", source: "params" },
        { field: "projectId", as: "project_id", source: "params" },
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await ProjectMemberService.getProjectWtihMembers(req, data, req.query);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// get members of the project of all department
exports.getMembersOfAllDepartment = async (req, res) => {
  const thisAction = { usedFor: "Project Members", action: "Get" };
  try {
    const allowedFileds = [
        { field: "projectId", as: "project_id", source: "params"  },
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await ProjectMemberService.getProjectWtihMembers(req, data, req.query);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// remove member from the project
exports.removeMemberFromProject = async (req, res) => {
  const thisAction = { usedFor: "Project Member", action: "Remove" };
  try {
    const projectMember = req.params.projectMemberId;
    const result = await ProjectMemberService.removeMember(req, projectMember);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// edit project member role .. 
exports.editProjectMemberRole = async (req, res) => {
  const thisAction = { usedFor: "Project Member", action: "Edit Role" };
  try {
    const allowedFileds = [
        { field: "memberId", as: "member_id", source: "params" },
        "project_role"
    ];
    const data = fieldPicker(req, allowedFileds);
    const result = await ProjectMemberService.editMemberRole(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};


// get members while searching of same project and department  .. 
exports.getMembersSearching = async (req, res) => {
  const thisAction = { usedFor: "Project Member", action: "Get" };
  try {
    const result = await ProjectMemberService.getMembersInSearch(req, {searchText : req.query.searchText, projectMemberId: req.params.projectMemberId });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    
    return sendErrorResponse(thisAction, err, res);
  }
};

