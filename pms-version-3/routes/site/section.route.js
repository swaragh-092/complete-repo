// Created: 20th Apr 2026
// Description: Section routes for Site-type projects.
// Guarded by requireProjectType('site').
// Version: 1.0.0

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const sectionController = require('../../controllers/site/section.controller');
const validationMiddleware = require('../../middleware/validation.middleware');
const { requireProjectType } = require('../../middleware/projectTypeGuard.middleware');
const { uuid, description, enumValue } = require('../../services/validation');

router.use(requireProjectType('site'));

/**
 * @swagger
 * /{moduleCode}/section/page/{pageId}:
 *   post:
 *     tags: [Section]
 *     summary: Create a section under a page (Site-type projects only)
 */
router.post(
  '/page/:pageId',
  [
    uuid('pageId'),
    body('name').trim().notEmpty().withMessage('name is required').isLength({ min: 2, max: 100 }),
    description().optional(),
    enumValue('priority', ['low', 'medium', 'high', 'critical']).optional(),
    body('order_index').optional().isInt({ min: 0 }),
    body('sprint_id').optional().isUUID(),
    uuid('departmentId', 'body'),
    body('projectId').optional().isUUID(),
    body('parentSectionId').optional().isUUID(),
  ],
  validationMiddleware('Section', 'Create'),
  sectionController.createSection
);

/**
 * @swagger
 * /{moduleCode}/section/page/{pageId}:
 *   get:
 *     tags: [Section]
 *     summary: Get all sections of a page (ordered by order_index)
 */
router.get(
  '/page/:pageId',
  [uuid('pageId')],
  validationMiddleware('Section', 'List'),
  sectionController.getSectionsByPage
);

/**
 * @swagger
 * /{moduleCode}/section/{sectionId}:
 *   get:
 *     tags: [Section]
 *     summary: Get a single section with its components
 */
router.get(
  '/:sectionId',
  [uuid('sectionId')],
  validationMiddleware('Section', 'Get'),
  sectionController.getSection
);

/**
 * @swagger
 * /{moduleCode}/section/{sectionId}:
 *   patch:
 *     tags: [Section]
 *     summary: Update a section
 */
router.patch(
  '/:sectionId',
  [
    uuid('sectionId'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    description().optional(),
    enumValue('priority', ['low', 'medium', 'high', 'critical']).optional(),
    enumValue('status', ['defined', 'in_progress', 'review', 'completed', 'blocked']).optional(),
    body('order_index').optional().isInt({ min: 0 }),
    body('sprint_id').optional().isUUID(),
  ],
  validationMiddleware('Section', 'Update'),
  sectionController.updateSection
);

/**
 * @swagger
 * /{moduleCode}/section/{sectionId}:
 *   delete:
 *     tags: [Section]
 *     summary: Delete a section (cascades to components)
 */
router.delete(
  '/:sectionId',
  [uuid('sectionId')],
  validationMiddleware('Section', 'Delete'),
  sectionController.deleteSection
);

module.exports = router;
