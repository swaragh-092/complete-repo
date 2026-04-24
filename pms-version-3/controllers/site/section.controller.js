// Created: 20th Apr 2026
// Description: Section controller — HTTP handler for Site-type section endpoints.
// Version: 1.0.0

const SectionService = require('../../services/site/section.service');
const ResponseService = require('../../services/Response');
const { fieldPicker, sendErrorResponse } = require('../../util/helper');

exports.createSection = async (req, res) => {
  const thisAction = { usedFor: 'Section', action: 'create' };
  try {
    const data = fieldPicker(req, [
      'name',
      'description',
      'priority',
      'order_index',
      'sprint_id',
      { field: 'pageId', as: 'page_id', source: 'params' },
      { field: 'departmentId', as: 'department_id', source: 'body' },
      { field: 'projectId', as: 'project_id', source: 'body' },
      { field: 'parentSectionId', as: 'parent_section_id', source: 'body' },
    ]);
    const result = await SectionService.createSection(req, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getSectionsByPage = async (req, res) => {
  const thisAction = { usedFor: 'Section', action: 'list' };
  try {
    const result = await SectionService.getSectionsByPage(req, req.params.pageId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.getSection = async (req, res) => {
  const thisAction = { usedFor: 'Section', action: 'getOne' };
  try {
    const result = await SectionService.getSection(req, req.params.sectionId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.updateSection = async (req, res) => {
  const thisAction = { usedFor: 'Section', action: 'update' };
  try {
    const data = fieldPicker(req, [
      'name',
      'description',
      'priority',
      'status',
      'order_index',
      'sprint_id',
      'assignee_id',
    ]);
    const result = await SectionService.updateSection(req, req.params.sectionId, data);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};

exports.deleteSection = async (req, res) => {
  const thisAction = { usedFor: 'Section', action: 'delete' };
  try {
    const result = await SectionService.deleteSection(req, req.params.sectionId);
    return ResponseService.apiResponse({ res, ...result, ...thisAction });
  } catch (err) {
    return sendErrorResponse(thisAction, err, res);
  }
};
