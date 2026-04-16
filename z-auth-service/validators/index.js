/**
 * Validators Index
 * Central export for all validation schemas and middleware
 */

// Common patterns and Joi instance
const common = require('./common');

// Domain validators
const userValidators = require('./user.validator');
const organizationValidators = require('./organization.validator');
const invitationValidators = require('./invitation.validator');
const roleValidators = require('./role.validator');
const clientValidators = require('./client.validator');
const workspaceValidators = require('./workspace.validator');

// Middleware
const middleware = require('./middleware');

module.exports = {
    // Re-export Joi for convenience
    Joi: common.Joi,

    // Common patterns
    common,

    // Domain-specific schemas
    user: userValidators,
    organization: organizationValidators,
    invitation: invitationValidators,
    role: roleValidators,
    client: clientValidators,
    workspace: workspaceValidators,

    // Middleware
    ...middleware,

    // Individual exports for direct destructuring
    ...userValidators,
    ...organizationValidators,
    ...invitationValidators,
    ...roleValidators,
    ...clientValidators,
    ...workspaceValidators,
    ...common,
};
