/**
 * @fileoverview Role Validation Schemas
 * @description Yup validation schemas for role-related forms
 */

import * as yup from 'yup';

/**
 * Schema for creating a new realm role
 */
export const createRealmRoleSchema = yup.object({
  name: yup.string()
    .required('Role name is required')
    .matches(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric characters, underscores, and hyphens allowed')
    .min(2, 'Role name must be at least 2 characters')
    .max(100, 'Role name must be at most 100 characters'),
  description: yup.string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
});

/**
 * Schema for creating a new client role
 */
export const createClientRoleSchema = yup.object({
  name: yup.string()
    .required('Role name is required')
    .matches(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric characters, underscores, and hyphens allowed')
    .min(2, 'Role name must be at least 2 characters')
    .max(100, 'Role name must be at most 100 characters'),
  description: yup.string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  clientId: yup.string()
    .required('Client ID is required')
});

/**
 * Schema for updating a role
 */
export const updateRoleSchema = yup.object({
  description: yup.string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
});

export default {
  createRealmRoleSchema,
  createClientRoleSchema,
  updateRoleSchema
};
