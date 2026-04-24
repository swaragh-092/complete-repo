// Created: 20th Apr 2026
// Description: Component controller — HTTP handler for Site-type component endpoints.
// Covers CRUD, timer control, helper creation, and dependency management.
// Version: 1.0.0

const ComponentService = require('../../services/site/component.service');
const SiteItemDependencyService = require('../../services/site/siteItemDependency.service');
const ResponseService = require('../../services/Response');
const { fieldPicker, sendErrorResponse } = require('../../util/helper');

// ─── CRUD ──────────────────────────────────────────────────────────────────

exports.createComponent = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'create' };
  try {
    const data = fieldPicker(req, [
      'title',
      'description',
      'acceptance_criteria',
      'priority',
      'story_points',
      'due_date',
      'assigned_to',
      'type',
      { field: 'sectionId', as: 'section_id', source: 'params' },
      { field: 'departmentId', as: 'department_id', source: 'body' },
      { field: 'projectId', as: 'project_id', source: 'body' },
      { field: 'parentComponentId', as: 'parent_component_id', source: 'body' },
    ]);
    const result = await ComponentService.createComponent(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getComponentsBySection = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'list' };
  try {
    const result = await ComponentService.getComponentsBySection(req, req.params.sectionId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getComponent = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'getOne' };
  try {
    const result = await ComponentService.getComponent(req, req.params.componentId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.updateComponent = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'update' };
  try {
    const data = fieldPicker(req, [
      'title',
      'description',
      'acceptance_criteria',
      'priority',
      'status',
      'story_points',
      'due_date',
      'assigned_to',
      'assignee',
      'approval_status',
      'approved_by',
      'total_work_time',
      'sort_order',
      'sprint_id',
    ]);
    const result = await ComponentService.updateComponent(req, req.params.componentId, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.deleteComponent = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'delete' };
  try {
    const result = await ComponentService.deleteComponent(req, req.params.componentId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// ─── Page-direct endpoints (new flat architecture) ─────────────────────────

exports.createComponentForPage = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'create' };
  try {
    const data = fieldPicker(req, [
      'title',
      'description',
      'acceptance_criteria',
      'priority',
      'story_points',
      'due_date',
      'assigned_to',
      'type',
      { field: 'pageId', as: 'page_id', source: 'params' },
      { field: 'departmentId', as: 'department_id', source: 'body' },
      { field: 'projectId', as: 'project_id', source: 'body' },
    ]);
    const result = await ComponentService.createComponentForPage(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getComponentsByPage = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'list' };
  try {
    const result = await ComponentService.getComponentsByPage(req, req.params.pageId, req.query);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// ─── Global components (project-wide: header, footer, navbar) ──────────────

exports.createGlobalComponent = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'create' };
  try {
    const data = fieldPicker(req, [
      'title',
      'description',
      'acceptance_criteria',
      'priority',
      'story_points',
      'due_date',
      'assigned_to',
      { field: 'projectId', as: 'project_id', source: 'params' },
      { field: 'departmentId', as: 'department_id', source: 'body' },
    ]);
    data.is_global = true;
    data.type = 'component';
    const result = await ComponentService.createComponentForPage(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getGlobalComponents = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'list' };
  try {
    const result = await ComponentService.getGlobalComponents(req, req.params.projectId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// ─── Timer ─────────────────────────────────────────────────────────────────


exports.startTimer = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'startTimer' };
  try {
    const result = await ComponentService.startTimer(req, req.params.componentId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.stopTimer = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'stopTimer' };
  try {
    const result = await ComponentService.stopTimer(req, req.params.componentId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// ─── Helper ─────────────────────────────────────────────────────────────────

exports.createHelperComponent = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'createHelper' };
  try {
    const data = fieldPicker(req, [
      'title',
      'description',
      'priority',
      'story_points',
      'due_date',
      'assigned_to',
      { field: 'departmentId', as: 'department_id', source: 'body' },
    ]);
    const result = await ComponentService.createHelperComponent(req, req.params.componentId, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getHelperComponents = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'listHelpers' };
  try {
    const result = await ComponentService.getHelperComponents(req, req.params.componentId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.acceptOrRejectHelperComponent = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'acceptOrRejectHelper' };
  try {
    const result = await ComponentService.acceptOrRejectHelperComponent(
      req,
      req.params.helperComponentId,
      req.params.action
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

// ─── Dependencies ───────────────────────────────────────────────────────────

exports.addDependency = async (req, res) => {
  const thisAction = { usedFor: 'Component Dependency', action: 'create' };
  try {
    const result = await SiteItemDependencyService.addDependency(req, {
      projectId: req.body.projectId,
      sourceType: 'component',
      sourceId: req.params.componentId,
      targetType: req.body.targetType,
      targetId: req.body.targetId,
    });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getDependencies = async (req, res) => {
  const thisAction = { usedFor: 'Component Dependency', action: 'list' };
  try {
    const result = await SiteItemDependencyService.getDependencies(
      req,
      req.query.projectId,
      'component',
      req.params.componentId
    );
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.removeDependency = async (req, res) => {
  const thisAction = { usedFor: 'Component Dependency', action: 'delete' };
  try {
    const result = await SiteItemDependencyService.removeDependency(req, req.params.dependencyId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.approveComponent = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'approve' };
  try {
    const { status, comments } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'.",
      });
    }
    const result = await ComponentService.approveComponent(req, req.params.componentId, { status, comments });
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getActiveTimer = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'activeTimer' };
  try {
    const result = await ComponentService.getActiveTimer(req);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getPageProgress = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'pageProgress' };
  try {
    const result = await ComponentService.getPageProgress(req, req.params.pageId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getProjectProgress = async (req, res) => {
  const thisAction = { usedFor: 'Component', action: 'projectProgress' };
  try {
    const result = await ComponentService.getProjectProgress(req, req.params.projectId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};
