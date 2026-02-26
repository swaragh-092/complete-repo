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

// {moduleCode}/project/member/...

/**
 * @swagger
 * /{moduleCode}/project/member/search/{projectMemberId}:
 *   get:
 *     tags:
 *       - Project
 *     summary: Search project members
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *         description: Module code from config
 *       - in: path
 *         name: projectMemberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project members matching search retrieved
 */
router.get(
  '/search/:projectMemberId',
  [uuid('projectMemberId')],
  validationMiddleware("Project members", "Get"),
  projectMemberController.getMembersSearching
);


/**
 * @swagger
 * /{moduleCode}/project/member/{projectId}/department/{departmentId}:
 *   post:
 *     tags:
 *       - Project
 *     summary: Add members to a department in a project
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Members added successfully
 */
router.post(
  '/:projectId/department/:departmentId',
  [
    uuid('projectId'),
    uuid('departmentId'),
  ],
  validationMiddleware("Project members", "Add"),
  projectMemberController.addMembers
);


/**
 * @swagger
 * /{moduleCode}/project/member/{projectMemberId}:
 *   delete:
 *     tags:
 *       - Project
 *     summary: Remove a member from a project
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: projectMemberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 */
router.delete(
  '/:projectMemberId',
  [uuid('projectMemberId')],
  validationMiddleware("Project member", 'Remove'),
  projectMemberController.removeMemberFromProject
);


/**
 * @swagger
 * /{moduleCode}/project/member/{memberId}:
 *   put:
 *     tags:
 *       - Project
 *     summary: Update project member role
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: project_role
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["member", "lead", "viewer"]
 *     responses:
 *       200:
 *         description: Project member role updated
 */
router.put(
  '/:memberId',
  [
    uuid('memberId'),
    enumValue("project_role", ["member", "lead", "viewer"]),
  ],
  validationMiddleware("Project member", 'Edit'),
  projectMemberController.editProjectMemberRole
);


/**
 * @swagger
 * /{moduleCode}/project/member/{projectId}/department/{departmentId}:
 *   get:
 *     tags:
 *       - Project
 *     summary: Get members of a specific department in a project
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department members retrieved
 */
router.get(
  '/:projectId/department/:departmentId',
  [
    uuid('projectId'),
    uuid('departmentId'),
  ],
  validationMiddleware("Project members", "Get"),
  projectMemberController.getMembers
);


/**
 * @swagger
 * /{moduleCode}/project/member/{projectId}:
 *   get:
 *     tags:
 *       - Project
 *     summary: Get members of all departments in a project
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *           default: ALREADY_TAKEN
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All department members retrieved
 */
router.get(
  '/:projectId',
  [uuid('projectId')],
  validationMiddleware("Project members", "Get"),
  projectMemberController.getMembersOfAllDepartment
);
module.exports = router;

