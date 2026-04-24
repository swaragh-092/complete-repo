// Created: 20th Apr 2026
// Description: Page routes for Site-type projects.
// Mirrors the feature route structure; guarded by requireProjectType('site').
// Version: 1.0.0

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const pageController = require('../../controllers/site/page.controller');
const validationMiddleware = require('../../middleware/validation.middleware');
const { requireProjectType } = require('../../middleware/projectTypeGuard.middleware');
const { uuid, description, enumValue } = require('../../services/validation');

// All page routes are restricted to Site-type projects
router.use(requireProjectType('site'));

/**
 * @swagger
 * /{moduleCode}/page/department/{departmentId}:
 *   post:
 *     tags: [Page]
 *     summary: Create a page under a department (Site-type projects only)
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, projectId]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               urlSlug: { type: string }
 *               priority: { type: string, enum: [low, medium, high, critical] }
 *               parentPageId: { type: string, format: uuid }
 *               projectId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Page created successfully
 */
router.post(
  '/department/:departmentId',
  [
    uuid('departmentId'),
    body('name').trim().notEmpty().withMessage('name is required').isLength({ min: 2, max: 100 }).withMessage('name must be 2-100 characters'),
    description().optional(),
    body('url_slug').optional().trim().isLength({ max: 255 }),
    enumValue('priority', ['low', 'medium', 'high', 'critical']).optional(),
    uuid('projectId', 'body'),
    body('parentPageId').optional().isUUID().withMessage('parentPageId must be a valid UUID'),
    body('assignee_id').optional().isUUID().withMessage('assignee_id must be a valid UUID'),
  ],
  validationMiddleware('Page', 'Create'),
  pageController.createPage
);

/**
 * @swagger
 * /{moduleCode}/page/project/{projectId}/department/{departmentId}:
 *   get:
 *     tags: [Page]
 *     summary: Get all pages of a project/department
 */
router.get(
  '/project/:projectId/department/:departmentId',
  [uuid('projectId'), uuid('departmentId')],
  validationMiddleware('Page', 'List'),
  pageController.getPagesByDepartment
);

/**
 * @swagger
 * /{moduleCode}/page/{pageId}:
 *   get:
 *     tags: [Page]
 *     summary: Get a single page with its sections
 */
router.get(
  '/:pageId',
  [uuid('pageId')],
  validationMiddleware('Page', 'Get'),
  pageController.getPage
);

/**
 * @swagger
 * /{moduleCode}/page/{pageId}:
 *   patch:
 *     tags: [Page]
 *     summary: Update a page
 */
router.patch(
  '/:pageId',
  [
    uuid('pageId'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    description().optional(),
    body('url_slug').optional().trim().isLength({ max: 255 }),
    enumValue('priority', ['low', 'medium', 'high', 'critical']).optional(),
    enumValue('status', ['active', 'inactive']).optional(),
    body('assignee_id').optional().isUUID().withMessage('assignee_id must be a valid UUID'),
  ],
  validationMiddleware('Page', 'Update'),
  pageController.updatePage
);

/**
 * POST /{moduleCode}/page/:pageId/approve — approve or reject a page
 */
router.post(
  '/:pageId/approve',
  [uuid('pageId')],
  validationMiddleware('Page', 'Approve'),
  pageController.approvePage
);

/**
 * @swagger
 * /{moduleCode}/page/{pageId}:
 *   delete:
 *     tags: [Page]
 *     summary: Delete a page (cascades to sections and components)
 */
router.delete(
  '/:pageId',
  [uuid('pageId')],
  validationMiddleware('Page', 'Delete'),
  pageController.deletePage
);

module.exports = router;
