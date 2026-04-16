// middleware/correlation.js - Correlation ID Middleware for Enterprise Request Tracking

const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to generate and attach correlation ID to each request
 * This ID is used to trace requests across the system for audit logging
 * Supports distributed tracing with trace_id and span_id
 */
const correlationMiddleware = (req, res, next) => {
  // Check if correlation ID already exists in headers (for distributed systems)
  const correlationId = req.headers['x-correlation-id'] || 
                       req.headers['x-request-id'] || 
                       uuidv4();
  
  // Generate trace_id and span_id for distributed tracing
  const traceId = req.headers['x-trace-id'] || 
                  req.headers['traceparent']?.split('-')[1] || 
                  uuidv4();
  const spanId = req.headers['x-span-id'] || 
                 req.headers['traceparent']?.split('-')[2] || 
                 uuidv4().substring(0, 16);
  
  // Attach to request object for use in audit logging
  req.correlationId = correlationId;
  req.requestId = correlationId; // Alias for compatibility
  req.traceId = traceId;
  req.spanId = spanId;
  
  // Add to response headers for client tracking
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', correlationId);
  res.setHeader('X-Trace-ID', traceId);
  res.setHeader('X-Span-ID', spanId);
  
  next();
};

module.exports = correlationMiddleware;







