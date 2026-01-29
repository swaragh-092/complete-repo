/*   
Author: Homshree 
Created: 29th May 2025
Description: all routes related to Projects
Version: 1.0.0
*/

const express = require("express");

const projectController = require("../../controllers/project/project.controller");
const validate = require("../../services/validation");
const validationMiddleware = require('../../middleware/validation.middleware');
const ENTITY = 'Project';
const ACTIONS = {
  CREATE: 'Add',
  READ: 'Read',
  UPDATE: 'Update',
  DELETE: 'Delete',
};

const router = express.Router();


router.get('/overview', projectController.getOverviewData);
router.get('/health/:status',  
  [
    validate.enumValue('status', ['ongoing', 'on_track', 'at_risk', 'critical', 'near_deadline', 'no_update', 'overdue'], 'params').optional()
  ],
  validationMiddleware(ENTITY, ACTIONS.READ),
  projectController.getAllProjects);
router.get('/', projectController.getAllProjects);

router.get('/usersongoing', projectController.getAllUsersOngoingProjects);
router.get('/usersongoing/department/:departmentId',
  [
    validate.uuid('departmentId')
  ],
  validationMiddleware(ENTITY, ACTIONS.READ),
  projectController.getAllUsersOngoingProjects);

router.post('/register', [
  validate.name('name'),
  validate.description('description'),
  validate.dateFuture('estimatedStartDate'),
  validate.dateGreaterThan('estimatedEndDate', 'estimatedStartDate'),
  validate.permissionCode(),
], validationMiddleware(ENTITY, ACTIONS.CREATE), projectController.postCreateProject);

router.get('/:id', [
  validate.uuid('id', 'params')
], validationMiddleware(ENTITY, ACTIONS.READ), projectController.getProject);

router.get('/:id/features', [
  validate.uuid('id', 'params')
], validationMiddleware(ENTITY, ACTIONS.READ), projectController.getProjectWithFeatures);

router.put('/:id', [
  validate.uuid('id', 'params').optional(),
  validate.name('name').optional(),
  validate.description('description').optional(),
  validate.dateFuture('estimatedStartDate').optional(),
  validate.dateGreaterThan('estimatedEndDate', 'estimatedStartDate').optional(),

], validationMiddleware(ENTITY, ACTIONS.UPDATE), projectController.updateProject);

router.delete('/:id', [
  validate.uuid('id', 'params')
], validationMiddleware(ENTITY, ACTIONS.DELETE), projectController.deleteProject);







module.exports = router;

