/**
 * Role and Permission Validation Schemas
 * Extracted from routes/permissions and routes/admin/roles
 */
const { Joi, name, description, uuid } = require('./common');

// Create Role
const createRoleSchema = Joi.object({
    name: name.required(),
    description: description.optional(),
    org_id: uuid.optional(),
    is_system: Joi.boolean().optional().default(false),
});

// Update Role
const updateRoleSchema = Joi.object({
    name: name.optional(),
    description: description.optional(),
}).min(1);

// Create Permission
const createPermissionSchema = Joi.object({
    name: name.required(),
    description: description.optional(),
    resource: Joi.string().required(),
    action: Joi.string().valid('create', 'read', 'update', 'delete', 'manage', '*').required(),
});

// Assign Roles to User
const assignRolesSchema = Joi.object({
    user_id: uuid.required(),
    role_ids: Joi.array().items(uuid).min(1).required(),
});

// Role Permission Assignment
const rolePermissionSchema = Joi.object({
    role_id: uuid.required(),
    permission_ids: Joi.array().items(uuid).min(1).required(),
});

module.exports = {
    createRoleSchema,
    updateRoleSchema,
    createPermissionSchema,
    assignRolesSchema,
    rolePermissionSchema,
};
