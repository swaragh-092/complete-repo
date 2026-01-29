// Author: Gururaj
// Created: 14th oct 2025
// Description: prject members related routs
// Version: 1.0.0
// Modified:

const express = require("express");

const projectMemberController = require("../../controllers/project/projectMember.controller");
const validationMiddleware = require('../../middleware/validation.middleware');
const { uuid, enumValue } = require("../../services/validation");

const router = express.Router();

// get project members in search
router.get('/search/:projectMemberId', [
    uuid('projectMemberId'),
], validationMiddleware("Project members", "Get"), projectMemberController.getMembersSearching);

router.post('/:projectId/department/:departmentId', [
    uuid('projectId'),
    uuid('departmentId'), 
], validationMiddleware("Project members", "Add"), projectMemberController.addMembers);


router.delete('/:projectMemberId', [
    uuid('projectMemberId'),
], validationMiddleware("Project member", 'Remove'), projectMemberController.removeMemberFromProject);

router.put('/:memberId', [
    uuid('memberId'),
    enumValue("project_role", ["member", "lead", "viewer"]),
], validationMiddleware("Project member", 'Edit'), projectMemberController.editProjectMemberRole);

router.get('/:projectId/department/:departmentId', [
    uuid('projectId'),
    uuid('departmentId'), 
], validationMiddleware("Project members", "Get"), projectMemberController.getMembers);

router.get('/:projectId', [
    uuid('projectId'),
], validationMiddleware("Project members", "Get"), projectMemberController.getMembersOfAllDepartment);

module.exports = router;

