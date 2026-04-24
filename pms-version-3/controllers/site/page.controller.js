// Created: 20th Apr 2026
// Description: Page controller — HTTP handler for Site-type page endpoints.
// Version: 1.0.0

const PageService = require('../../services/site/page.service');
const ResponseService = require('../../services/Response');
const { fieldPicker, sendErrorResponse } = require('../../util/helper');

exports.createPage = async (req, res) => {
  const thisAction = { usedFor: 'Page', action: 'create' };
  try {
    const data = fieldPicker(req, [
      'name',
      'description',
      'url_slug',
      'priority',
      'assignee_id',
      { field: 'departmentId', as: 'department_id', source: 'params' },
      { field: 'projectId', as: 'project_id', source: 'body' },
      { field: 'parentPageId', as: 'parent_page_id', source: 'body' },
    ]);
    const result = await PageService.createPage(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getPagesByDepartment = async (req, res) => {
  const thisAction = { usedFor: 'Page', action: 'list' };
  try {
    const result = await PageService.getPagesByDepartment(
      req,
      req.params.projectId,
      req.params.departmentId
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getPage = async (req, res) => {
  const thisAction = { usedFor: 'Page', action: 'getOne' };
  try {
    const result = await PageService.getPage(req, req.params.pageId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.updatePage = async (req, res) => {
  const thisAction = { usedFor: 'Page', action: 'update' };
  try {
    const data = fieldPicker(req, [
      'name',
      'description',
      'url_slug',
      'priority',
      'status',
      'assignee_id',
    ]);
    const result = await PageService.updatePage(req, req.params.pageId, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.deletePage = async (req, res) => {
  const thisAction = { usedFor: 'Page', action: 'delete' };
  try {
    const result = await PageService.deletePage(req, req.params.pageId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.approvePage = async (req, res) => {
  const thisAction = { usedFor: 'Page', action: 'approve' };
  try {
    const { status, comments } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'.",
      });
    }
    const result = await PageService.approvePage(req, req.params.pageId, { status, comments });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};
