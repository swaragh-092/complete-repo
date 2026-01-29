/**
 * @fileoverview Realm Validation Schemas
 * @description Yup validation schemas for realm-related forms
 */

import * as yup from 'yup';

/**
 * Schema for creating a new realm
 */
export const createRealmSchema = yup.object({
  realm_name: yup.string()
    .required('Realm name is required')
    .matches(/^[a-z0-9-]+$/, 'Only lowercase alphanumeric characters and hyphens allowed')
    .min(3, 'Realm name must be at least 3 characters')
    .max(50, 'Realm name must be at most 50 characters'),
  display_name: yup.string()
    .required('Display name is required')
    .min(3, 'Display name must be at least 3 characters')
    .max(100, 'Display name must be at most 100 characters')
});

/**
 * Schema for updating realm settings
 */
export const updateRealmSettingsSchema = yup.object({
  displayName: yup.string()
    .min(3, 'Display name must be at least 3 characters')
    .max(100, 'Display name must be at most 100 characters')
    .optional(),
  enabled: yup.boolean().optional(),
  registrationAllowed: yup.boolean().optional(),
  verifyEmail: yup.boolean().optional(),
  resetPasswordAllowed: yup.boolean().optional(),
  editUsernameAllowed: yup.boolean().optional(),
  rememberMe: yup.boolean().optional(),
  loginWithEmailAllowed: yup.boolean().optional(),
  duplicateEmailsAllowed: yup.boolean().optional(),
  bruteForceProtected: yup.boolean().optional(),
  permanentLockout: yup.boolean().optional(),
  maxFailureWaitSeconds: yup.number().min(1).max(86400).optional(),
  minimumQuickLoginWaitSeconds: yup.number().min(1).max(3600).optional(),
  waitIncrementSeconds: yup.number().min(1).max(3600).optional(),
  quickLoginCheckMilliSeconds: yup.number().min(100).max(60000).optional(),
  maxDeltaTimeSeconds: yup.number().min(1).max(86400).optional(),
  failureFactor: yup.number().min(1).max(100).optional(),
  accessTokenLifespan: yup.number().min(60).max(86400).optional(),
  accessCodeLifespan: yup.number().min(60).max(3600).optional(),
  ssoSessionIdleTimeout: yup.number().min(60).max(86400).optional(),
  ssoSessionMaxLifespan: yup.number().min(60).max(604800).optional(),
});

export default {
  createRealmSchema,
  updateRealmSettingsSchema
};
