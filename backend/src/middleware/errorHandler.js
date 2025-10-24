/**
 * Centralized error handling middleware for ELMRR Switch Backend
 */

/**
 * Async handler wrapper to catch async errors and pass them to error middleware
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * Should be the last middleware in the chain
 */
export const globalErrorHandler = (err, req, res, next) => {
  // Log error details
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle different error types
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    // Joi validation errors
    statusCode = 400;
    message = 'Validation failed';
    details = err.details ? err.details.map(d => d.message) : [err.message];
  } else if (err.name === 'CastError') {
    // Database casting errors (invalid IDs, etc.)
    statusCode = 400;
    message = 'Invalid data format';
    details = err.message;
  } else if (err.code === 11000) {
    // Database duplicate key errors
    statusCode = 409;
    message = 'Duplicate entry';
    details = 'A record with this data already exists';
  }

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    success: false,
    error: message,
    statusCode,
    ...(details && { details }),
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString()
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req, res) => {
  const error = new ApiError(`Route ${req.originalUrl} not found`, 404);
  res.status(404).json({
    success: false,
    error: error.message,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString()
  });
};
