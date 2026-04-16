/**
 * Validation Middleware
 * Generic middleware to validate request body, query, and params
 */
const { AppError } = require('../middleware/errorHandler');

/**
 * Validate request body against schema
 * @param {Joi.Schema} schema - Joi schema
 * @param {Object} options - Joi validation options
 */
const validateBody = (schema, options = {}) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            ...options,
        });

        if (error) {
            const message = error.details.map((d) => d.message).join(', ');
            return next(new AppError(message, 400, 'VALIDATION_ERROR'));
        }

        req.body = value;
        next();
    };
};

/**
 * Validate request query against schema
 * @param {Joi.Schema} schema - Joi schema
 */
const validateQuery = (schema, options = {}) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            ...options,
        });

        if (error) {
            const message = error.details.map((d) => d.message).join(', ');
            return next(new AppError(message, 400, 'VALIDATION_ERROR'));
        }

        req.query = value;
        next();
    };
};

/**
 * Validate request params against schema
 * @param {Joi.Schema} schema - Joi schema
 */
const validateParams = (schema, options = {}) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            ...options,
        });

        if (error) {
            const message = error.details.map((d) => d.message).join(', ');
            return next(new AppError(message, 400, 'VALIDATION_ERROR'));
        }

        req.params = value;
        next();
    };
};

/**
 * Combined validation for body, query, and params
 * @param {Object} schemas - { body, query, params }
 */
const validate = (schemas) => {
    const middlewares = [];

    if (schemas.body) {
        middlewares.push(validateBody(schemas.body));
    }
    if (schemas.query) {
        middlewares.push(validateQuery(schemas.query));
    }
    if (schemas.params) {
        middlewares.push(validateParams(schemas.params));
    }

    return middlewares;
};

module.exports = {
    validateBody,
    validateQuery,
    validateParams,
    validate,
};
