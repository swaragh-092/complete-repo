const httpStatus = require('./httpStatus');
const crypto = require('crypto');

/**
 * Enterprise Level Response Handler
 * Standardizes all API responses with metadata, tracing, and consistent structure.
 */
class ResponseHandler {
    /**
     * Generate a unique request ID if not provided in headers
     */
    static getRequestId(req) {
        return req.headers['x-request-id'] || req.headers['x-trace-id'] || `req_${crypto.randomBytes(4).toString('hex')}_${Date.now()}`;
    }

    /**
     * Send a success response
     * @param {Object} res - Express response object
     * @param {any} data - Payload
     * @param {string} message - Success message
     * @param {number} statusCode - HTTP status code
     * @param {Object} meta - Additional metadata
     */
    static success(res, data, message = 'Operation successful', statusCode = httpStatus.OK, meta = {}) {
        const response = {
            success: true,
            statusCode,
            message,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                requestId: this.getRequestId(res.req),
                path: res.req.originalUrl,
                version: '1.0',
                ...meta
            }
        };
        return res.status(statusCode).json(response);
    }

    /**
     * Send a created response (HTTP 201)
     */
    static created(res, data, message = 'Resource created successfully') {
        return this.success(res, data, message, httpStatus.CREATED);
    }

    /**
     * Send a standard paginated response
     * @param {Object} res 
     * @param {Array} data - List of items
     * @param {Object} pagination - { page, limit, total, totalPages }
     * @param {string} message 
     */
    static paginated(res, data, pagination, message = 'Fetch successful') {
        const response = {
            success: true,
            statusCode: httpStatus.OK,
            message,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                requestId: this.getRequestId(res.req),
                path: res.req.originalUrl,
                version: '1.0'
            },
            pagination: {
                page: parseInt(pagination.page),
                limit: parseInt(pagination.limit),
                total: parseInt(pagination.total),
                totalPages: Math.ceil(pagination.total / pagination.limit)
            }
        };
        return res.status(httpStatus.OK).json(response);
    }

    /**
     * Send a no content response (HTTP 204)
     */
    static noContent(res) {
        return res.status(httpStatus.NO_CONTENT).send();
    }
    /**
     * Send an error response
     * @param {Object} res 
     * @param {string} message 
     * @param {number} statusCode 
     * @param {any} error 
     */
    static error(res, message = 'Operation failed', statusCode = httpStatus.INTERNAL_SERVER_ERROR, error = null) {
        const response = {
            success: false,
            statusCode,
            message,
            ...(error && { error }),
            meta: {
                timestamp: new Date().toISOString(),
                requestId: this.getRequestId(res.req),
                path: res.req.originalUrl,
                version: '1.0'
            }
        };
        return res.status(statusCode).json(response);
    }
}

module.exports = ResponseHandler;
