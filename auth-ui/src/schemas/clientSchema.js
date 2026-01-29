/**
 * @fileoverview Client Validation Schemas
 * @description Yup validation schemas for client-related forms
 */

import * as yup from 'yup';

/**
 * Schema for creating a new client
 */
export const createClientSchema = yup.object({
  client_key: yup.string()
    .required('Client key is required')
    .matches(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric characters, underscores, and hyphens allowed')
    .min(3, 'Client key must be at least 3 characters')
    .max(100, 'Client key must be at most 100 characters'),
  client_id: yup.string()
    .required('Client ID is required')
    .matches(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric characters, underscores, and hyphens allowed')
    .min(3, 'Client ID must be at least 3 characters')
    .max(100, 'Client ID must be at most 100 characters'),
  client_secret: yup.string()
    .required('Client secret is required')
    .min(8, 'Client secret must be at least 8 characters')
    .max(256, 'Client secret must be at most 256 characters'),
  callback_url: yup.string()
    .required('Callback URL is required')
    .url('Must be a valid URL')
    .max(500, 'Callback URL must be at most 500 characters'),
  realm: yup.string()
    .required('Realm is required'),
  requires_tenant: yup.boolean().optional(),
  tenant_id: yup.string()
    .when('requires_tenant', {
      is: true,
      then: (schema) => schema.required('Tenant ID is required when tenant is required'),
      otherwise: (schema) => schema.optional()
    })
});

/**
 * Schema for updating client settings
 */
export const updateClientSchema = yup.object({
  name: yup.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be at most 100 characters')
    .optional(),
  description: yup.string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  enabled: yup.boolean().optional(),
  publicClient: yup.boolean().optional(),
  directAccessGrantsEnabled: yup.boolean().optional(),
  standardFlowEnabled: yup.boolean().optional(),
  implicitFlowEnabled: yup.boolean().optional(),
  serviceAccountsEnabled: yup.boolean().optional(),
  authorizationServicesEnabled: yup.boolean().optional(),
  redirectUris: yup.array().of(
    yup.string().url('Must be a valid URL')
  ).optional(),
  webOrigins: yup.array().of(
    yup.string()
  ).optional(),
  rootUrl: yup.string().url('Must be a valid URL').optional().nullable(),
  baseUrl: yup.string().url('Must be a valid URL').optional().nullable(),
  adminUrl: yup.string().url('Must be a valid URL').optional().nullable()
});

export default {
  createClientSchema,
  updateClientSchema
};
