/**
 * Common Joi validation patterns
 * Reusable across all validators
 */
const Joi = require('joi');

// ===== Primitive Patterns =====

const email = Joi.string().email().lowercase().trim();

const uuid = Joi.string().uuid();

const password = Joi.string().min(6).max(100);

const name = Joi.string().min(2).max(100).trim();

const shortName = Joi.string().min(1).max(50).trim();

const description = Joi.string().max(500).trim();

const username = Joi.string().alphanum().min(3).max(50);

// ===== Pagination Schema =====

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('').optional(),
});

// ===== ID Params Schema =====

const idParamSchema = Joi.object({
    id: uuid.required(),
});

const realmParamSchema = Joi.object({
    realm: Joi.string().required(),
});

// ===== Custom Validation Helpers =====

/**
 * Creates a required version of any schema
 */
const required = (schema) => schema.required();

/**
 * Creates an optional version of any schema
 */
const optional = (schema) => schema.optional();

// ===== Error Messages =====

const messages = {
    'string.empty': '{{#label}} cannot be empty',
    'string.min': '{{#label}} must be at least {{#limit}} characters',
    'string.max': '{{#label}} must be at most {{#limit}} characters',
    'string.email': '{{#label}} must be a valid email',
    'string.uuid': '{{#label}} must be a valid UUID',
    'any.required': '{{#label}} is required',
};

module.exports = {
    // Primitives
    email,
    uuid,
    password,
    name,
    shortName,
    description,
    username,

    // Schemas
    paginationSchema,
    idParamSchema,
    realmParamSchema,

    // Helpers
    required,
    optional,
    messages,

    // Re-export Joi for convenience
    Joi,
};
