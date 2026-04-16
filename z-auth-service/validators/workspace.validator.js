/**
 * Workspace Validators
 * Joi schemas for workspace-related API endpoints
 */

const { Joi, patterns } = require('./common');
const { WORKSPACE_ROLES } = require('../config/constants');

// List of valid workspace roles from constants
const validRoles = Object.values(WORKSPACE_ROLES);

// Create Workspace Schema
const createWorkspaceSchema = Joi.object({
    org_id: Joi.string().uuid().required().messages({
        'string.guid': 'Organization ID must be a valid UUID'
    }),
    name: Joi.string().min(2).max(100).required().messages({
        'string.min': 'Workspace name must be at least 2 characters',
        'string.max': 'Workspace name cannot exceed 100 characters'
    }),
    slug: Joi.string().pattern(/^[a-z0-9-]+$/).min(2).max(50).required().messages({
        'string.pattern.base': 'Slug must only contain lowercase letters, numbers, and hyphens'
    }),
    description: Joi.string().max(500).allow('', null)
});

// Update Workspace Schema
const updateWorkspaceSchema = Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().max(500).allow('', null)
}).min(1).messages({
    'object.min': 'At least one field is required to update'
});

// Add Member Schema
const addMemberSchema = Joi.object({
    user_id: Joi.string().uuid().required(),
    role: Joi.string().valid(...validRoles).default(WORKSPACE_ROLES.VIEWER)
});

// Update Member Role Schema
const updateMemberRoleSchema = Joi.object({
    role: Joi.string().valid(...validRoles).required()
});

// Workspace Invitation Schema
const workspaceInvitationSchema = Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid(...validRoles).default(WORKSPACE_ROLES.VIEWER),
    message: Joi.string().max(250).allow('', null)
});

module.exports = {
    createWorkspaceSchema,
    updateWorkspaceSchema,
    addMemberSchema,
    updateMemberRoleSchema,
    workspaceInvitationSchema
};
