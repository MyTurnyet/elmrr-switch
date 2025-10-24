/**
 * Standardized API response utilities for ELMRR Switch Backend
 */

/**
 * Utility class for creating consistent API responses
 */
export class ApiResponse {
  /**
   * Create a successful response
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   * @returns {Object} Formatted success response
   */
  static success(data, message = 'Success', statusCode = 200) {
    return {
      success: true,
      data,
      message,
      statusCode,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create a paginated success response
   * @param {Array} data - Response data array
   * @param {Object} pagination - Pagination info
   * @param {string} message - Success message
   * @returns {Object} Formatted paginated response
   */
  static paginated(data, pagination = {}, message = 'Success') {
    return {
      success: true,
      data,
      count: data.length,
      pagination,
      message,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create an error response
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {*} details - Additional error details
   * @returns {Object} Formatted error response
   */
  static error(message, statusCode = 500, details = null) {
    return {
      success: false,
      error: message,
      statusCode,
      ...(details && { details }),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create a validation error response
   * @param {Array|string} errors - Validation error messages
   * @returns {Object} Formatted validation error response
   */
  static validationError(errors) {
    const errorArray = Array.isArray(errors) ? errors : [errors];
    return {
      success: false,
      error: 'Validation failed',
      statusCode: 400,
      details: errorArray,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create a not found response
   * @param {string} resource - Name of the resource that wasn't found
   * @returns {Object} Formatted not found response
   */
  static notFound(resource = 'Resource') {
    return {
      success: false,
      error: `${resource} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create an unauthorized response
   * @param {string} message - Custom unauthorized message
   * @returns {Object} Formatted unauthorized response
   */
  static unauthorized(message = 'Unauthorized access') {
    return {
      success: false,
      error: message,
      statusCode: 401,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create a forbidden response
   * @param {string} message - Custom forbidden message
   * @returns {Object} Formatted forbidden response
   */
  static forbidden(message = 'Access forbidden') {
    return {
      success: false,
      error: message,
      statusCode: 403,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create a conflict response
   * @param {string} message - Conflict message
   * @param {*} details - Additional conflict details
   * @returns {Object} Formatted conflict response
   */
  static conflict(message, details = null) {
    return {
      success: false,
      error: message,
      statusCode: 409,
      ...(details && { details }),
      timestamp: new Date().toISOString()
    };
  }
}
