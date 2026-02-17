'use strict';

/**
 * Application Error
 * Structured error with HTTP status, error code, and operational flag.
 * Operational errors are expected (bad input, not found, etc.).
 * Non-operational errors are bugs (null reference, assertion failure).
 */
class AppError extends Error {
    /**
     * @param {string} message    - Human-readable error message
     * @param {number} statusCode - HTTP status code (default 500)
     * @param {string} code       - Machine-readable error code (e.g. 'NOT_FOUND')
     */
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        // Capture stack trace without this constructor in it
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Factory: 400 Bad Request
     */
    static badRequest(message, code = 'BAD_REQUEST') {
        return new AppError(message, 400, code);
    }

    /**
     * Factory: 401 Unauthorized
     */
    static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
        return new AppError(message, 401, code);
    }

    /**
     * Factory: 404 Not Found
     */
    static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
        return new AppError(message, 404, code);
    }

    /**
     * Factory: 409 Conflict
     */
    static conflict(message, code = 'CONFLICT') {
        return new AppError(message, 409, code);
    }

    /**
     * Factory: 503 Service Unavailable
     */
    static serviceUnavailable(message, code = 'SERVICE_UNAVAILABLE') {
        return new AppError(message, 503, code);
    }
}

module.exports = AppError;
