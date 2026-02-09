'use strict';

/**
 * Standardized API Response Handler
 */
class ResponseHandler {
    static success(res, data = {}, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
        });
    }

    static error(res, message = 'Error', statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
        const response = {
            success: false,
            message,
            error: {
                code,
                ...(details && { details }),
            },
            timestamp: new Date().toISOString(),
        };
        return res.status(statusCode).json(response);
    }
}

module.exports = ResponseHandler;
