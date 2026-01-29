/**
 * @fileoverview User Validation Schemas
 * @description Yup validation schemas for user-related forms
 */

import * as yup from 'yup';

/**
 * Schema for creating a new user
 */
export const createUserSchema = yup.object({
  username: yup.string()
    .required('Username is required')
    .matches(/^[a-zA-Z0-9_.-]+$/, 'Only alphanumeric characters, dots, underscores, and hyphens allowed')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters'),
  email: yup.string()
    .required('Email is required')
    .email('Must be a valid email address')
    .max(100, 'Email must be at most 100 characters'),
  firstName: yup.string()
    .max(50, 'First name must be at most 50 characters')
    .optional(),
  lastName: yup.string()
    .max(50, 'Last name must be at most 50 characters')
    .optional(),
  enabled: yup.boolean().default(true),
  emailVerified: yup.boolean().default(false),
  credentials: yup.array().of(
    yup.object({
      type: yup.string().default('password'),
      value: yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters'),
      temporary: yup.boolean().default(false)
    })
  ).optional()
});

/**
 * Schema for updating user data
 */
export const updateUserSchema = yup.object({
  email: yup.string()
    .email('Must be a valid email address')
    .max(100, 'Email must be at most 100 characters')
    .optional(),
  firstName: yup.string()
    .max(50, 'First name must be at most 50 characters')
    .optional(),
  lastName: yup.string()
    .max(50, 'Last name must be at most 50 characters')
    .optional(),
  enabled: yup.boolean().optional(),
  emailVerified: yup.boolean().optional()
});

/**
 * Schema for password reset
 */
export const resetPasswordSchema = yup.object({
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  temporary: yup.boolean().default(false)
});

/**
 * Schema for assigning roles
 */
export const assignRolesSchema = yup.object({
  roles: yup.array()
    .of(yup.string())
    .min(1, 'At least one role must be selected')
    .required('Roles are required')
});

export default {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  assignRolesSchema
};
