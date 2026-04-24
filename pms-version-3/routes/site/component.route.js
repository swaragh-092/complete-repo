// Created: 20th Apr 2026
// Description: Component routes for Site-type projects.
// Flat architecture: Page → Components/Tasks  (section layer removed from UI)
// Also supports global components (header, footer, navbar) at project level.
// Version: 2.0.0

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const componentController = require('../../controllers/site/component.controller');
const validationMiddleware = require('../../middleware/validation.middleware');
const { requireProjectType } = require('../../middleware/projectTypeGuard.middleware');
const { uuid, description, enumValue } = require('../../services/validation');

router.use(requireProjectType('site'));

// ─── Page-direct routes (primary) ──────────────────────────────────────────

const componentBodyValidators = [
  body('title').trim().notEmpty().withMessage('title is required'),
  description().optional(),
  body('acceptance_criteria').optional().trim(),
  enumValue('priority', ['low', 'medium', 'high', 'critical']).optional(),
  enumValue('type', ['component', 'task']).optional(),
  body('story_points').optional().isInt({ min: 0 }),
  body('due_date').optional().isISO8601(),
  body('assigned_to').optional().isUUID(),
  body('sprint_id').optional().isUUID(),
  uuid('departmentId', 'body'),
  body('projectId').optional().isUUID(),
];

/**
 * POST /{moduleCode}/component/page/:pageId  — create component or task under a page
 */
router.post(
  '/page/:pageId',
  [uuid('pageId'), ...componentBodyValidators],
  validationMiddleware('Component', 'Create'),
  componentController.createComponentForPage
);

/**
 * GET /{moduleCode}/component/page/:pageId  — list components/tasks for a page
 * Query: ?type=component|task  &page=1  &perPage=20
 */
router.get(
  '/page/:pageId',
  [uuid('pageId')],
  validationMiddleware('Component', 'List'),
  componentController.getComponentsByPage
);

// ─── Global components (project-wide) ──────────────────────────────────────

/**
 * POST /{moduleCode}/component/project/:projectId/global  — create global component
 */
router.post(
  '/project/:projectId/global',
  [
    uuid('projectId'),
    body('title').trim().notEmpty().withMessage('title is required'),
    description().optional(),
    enumValue('priority', ['low', 'medium', 'high', 'critical']).optional(),
    body('story_points').optional().isInt({ min: 0 }),
    body('assigned_to').optional().isUUID(),
    uuid('departmentId', 'body'),
  ],
  validationMiddleware('Component', 'Create'),
  componentController.createGlobalComponent
);

/**
 * GET /{moduleCode}/component/project/:projectId/global  — list global components
 */
router.get(
  '/project/:projectId/global',
  [uuid('projectId')],
  validationMiddleware('Component', 'List'),
  componentController.getGlobalComponents
);

// ─── Legacy section-based route (kept for backward compat) ────────────────

/**
 * POST /{moduleCode}/component/section/{sectionId}
 */
router.post(
  '/section/:sectionId',
  [
    uuid('sectionId'),
    body('title').trim().notEmpty().withMessage('title is required'),
    description().optional(),
    body('acceptance_criteria').optional().trim(),
    enumValue('priority', ['low', 'medium', 'high', 'critical']).optional(),
    enumValue('type', ['component', 'task']).optional(),
    body('story_points').optional().isInt({ min: 0 }),
    body('due_date').optional().isISO8601(),
    body('assigned_to').optional().isUUID(),
    body('sprint_id').optional().isUUID(),
    uuid('departmentId', 'body'),
    body('projectId').optional().isUUID(),
    body('parentComponentId').optional().isUUID(),
  ],
  validationMiddleware('Component', 'Create'),
  componentController.createComponent
);

/**
 * @swagger
 * /{moduleCode}/component/section/{sectionId}:
 *   get:
 *     tags: [Component]
 *     summary: Get all top-level components of a section
 */
router.get(
  '/section/:sectionId',
  [uuid('sectionId')],
  validationMiddleware('Component', 'List'),
  componentController.getComponentsBySection
);

/**
 * @swagger
 * /{moduleCode}/component/{componentId}:
 *   get:
 *     tags: [Component]
 *     summary: Get a single component with sub-components, issues, helpers
 */
router.get(
  '/:componentId',
  [uuid('componentId')],
  validationMiddleware('Component', 'Get'),
  componentController.getComponent
);

/**
 * @swagger
 * /{moduleCode}/component/{componentId}:
 *   patch:
 *     tags: [Component]
 *     summary: Update a component
 */
router.patch(
  '/:componentId',
  [
    uuid('componentId'),
    body('title').optional().trim().notEmpty(),
    description().optional(),
    body('acceptance_criteria').optional().trim(),
    enumValue('priority', ['low', 'medium', 'high', 'critical']).optional(),
    enumValue('status', ['defined', 'in_progress', 'review', 'completed', 'blocked', 'accept_pending', 'reject']).optional(),
    body('story_points').optional().isInt({ min: 0 }),
    body('due_date').optional().isISO8601(),
    body('assigned_to').optional().isUUID(),
    body('sprint_id').optional({ nullable: true }).isUUID(),
    body('sort_order').optional().isInt(),
  ],
  validationMiddleware('Component', 'Update'),
  componentController.updateComponent
);

/**
 * @swagger
 * /{moduleCode}/component/{componentId}:
 *   delete:
 *     tags: [Component]
 *     summary: Delete a component (cascades to sub-components)
 */
router.delete(
  '/:componentId',
  [uuid('componentId')],
  validationMiddleware('Component', 'Delete'),
  componentController.deleteComponent
);

// ─── Timer ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /{moduleCode}/component/{componentId}/timer/start:
 *   post:
 *     tags: [Component]
 *     summary: Start the work timer for a component
 */
router.post(
  '/:componentId/timer/start',
  [uuid('componentId')],
  validationMiddleware('Component', 'Timer Start'),
  componentController.startTimer
);

/**
 * @swagger
 * /{moduleCode}/component/{componentId}/timer/stop:
 *   post:
 *     tags: [Component]
 *     summary: Stop the work timer for a component (accumulates total_work_time)
 */
router.post(
  '/:componentId/timer/stop',
  [uuid('componentId')],
  validationMiddleware('Component', 'Timer Stop'),
  componentController.stopTimer
);

router.get('/user/active-timer', componentController.getActiveTimer);
router.get('/page/:pageId/progress', [uuid('pageId')], componentController.getPageProgress);
router.get('/project/:projectId/progress', [uuid('projectId')], componentController.getProjectProgress);

// ─── Helper ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /{moduleCode}/component/{componentId}/helper:
 *   post:
 *     tags: [Component]
 *     summary: Create a helper component for the target component
 */
router.post(
  '/:componentId/helper',
  [
    uuid('componentId'),
    body('title').trim().notEmpty().withMessage('title is required'),
    description().optional(),
    enumValue('priority', ['low', 'medium', 'high', 'critical']).optional(),
    uuid('departmentId', 'body'),
    body('assigned_to').optional().isUUID(),
  ],
  validationMiddleware('Component', 'Create Helper'),
  componentController.createHelperComponent
);

/**
 * GET /{moduleCode}/component/:componentId/helper — list helper tasks for a component
 */
router.get(
  '/:componentId/helper',
  [uuid('componentId')],
  validationMiddleware('Component', 'List Helpers'),
  componentController.getHelperComponents
);

/**
 * POST /{moduleCode}/component/:helperComponentId/helper/:action — accept or reject a help request
 * action: accept | reject
 */
router.post(
  '/:helperComponentId/helper/:action',
  [uuid('helperComponentId'), enumValue('action', ['accept', 'reject'])],
  validationMiddleware('Component', 'Accept/Reject Helper'),
  componentController.acceptOrRejectHelperComponent
);

// ─── Dependencies ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /{moduleCode}/component/{componentId}/dependency:
 *   post:
 *     tags: [Component]
 *     summary: Add a dependency for a component (component blocked by target)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, targetType, targetId]
 *             properties:
 *               projectId: { type: string, format: uuid }
 *               targetType: { type: string, enum: [page, section, component] }
 *               targetId: { type: string, format: uuid }
 */
router.post(
  '/:componentId/dependency',
  [
    uuid('componentId'),
    uuid('projectId', 'body'),
    body('targetType').isIn(['page', 'section', 'component']).withMessage('targetType must be page, section, or component'),
    body('targetId').isUUID().withMessage('targetId must be a valid UUID'),
  ],
  validationMiddleware('Component Dependency', 'Add'),
  componentController.addDependency
);

/**
 * @swagger
 * /{moduleCode}/component/{componentId}/dependency:
 *   get:
 *     tags: [Component]
 *     summary: Get all dependencies of a component (blocks and blocked-by)
 */
router.get(
  '/:componentId/dependency',
  [uuid('componentId')],
  validationMiddleware('Component Dependency', 'List'),
  componentController.getDependencies
);

/**
 * @swagger
 * /{moduleCode}/component/{componentId}/dependency/{dependencyId}:
 *   delete:
 *     tags: [Component]
 *     summary: Remove a dependency from a component
 */
router.delete(
  '/:componentId/dependency/:dependencyId',
  [uuid('componentId'), uuid('dependencyId')],
  validationMiddleware('Component Dependency', 'Remove'),
  componentController.removeDependency
);

/**
 * POST /{moduleCode}/component/:componentId/approve — approve or reject a component/task
 */
router.post(
  '/:componentId/approve',
  [uuid('componentId')],
  validationMiddleware('Component', 'Approve'),
  componentController.approveComponent
);

module.exports = router;
