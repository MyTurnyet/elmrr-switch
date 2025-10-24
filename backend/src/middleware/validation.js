/**
 * Input Validation Middleware
 * Provides reusable validation patterns and consistent error responses
 */

import Joi from 'joi';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Generic validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware function
 */
export const validate = (schema, source = 'body', options = {}) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // Show all validation errors
      allowUnknown: false, // Reject unknown properties
      stripUnknown: true, // Remove unknown properties
      ...options
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json(ApiResponse.error(
        'Validation failed',
        400,
        errorMessages
      ));
    }

    // Replace the original data with validated and sanitized data
    req[source] = value;
    next();
  };
};

/**
 * Validate request body
 * @param {Object} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware function
 */
export const validateBody = (schema, options = {}) => {
  return validate(schema, 'body', options);
};

/**
 * Validate query parameters
 * @param {Object} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware function
 */
export const validateQuery = (schema, options = {}) => {
  return validate(schema, 'query', {
    allowUnknown: true, // Query params often have extra fields
    stripUnknown: false, // Don't strip query params
    ...options
  });
};

/**
 * Validate URL parameters
 * @param {Object} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware function
 */
export const validateParams = (schema, options = {}) => {
  return validate(schema, 'params', options);
};

/**
 * Validate multiple request sources
 * @param {Object} schemas - Object with schemas for different sources
 * @param {Object} schemas.body - Body validation schema
 * @param {Object} schemas.query - Query validation schema
 * @param {Object} schemas.params - Params validation schema
 * @returns {Function} Express middleware function
 */
export const validateMultiple = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    // Validate each specified source
    Object.entries(schemas).forEach(([source, schema]) => {
      if (schema && req[source]) {
        const { error, value } = schema.validate(req[source], {
          abortEarly: false,
          allowUnknown: source === 'query', // Allow unknown in query
          stripUnknown: source !== 'query'
        });

        if (error) {
          const sourceErrors = error.details.map(detail => ({
            source,
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          }));
          errors.push(...sourceErrors);
        } else {
          req[source] = value;
        }
      }
    });

    if (errors.length > 0) {
      return res.status(400).json(ApiResponse.error(
        'Validation failed',
        400,
        errors
      ));
    }

    next();
  };
};

/**
 * Create validation middleware for optional fields
 * Useful for PATCH/PUT endpoints where not all fields are required
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Request property to validate
 * @returns {Function} Express middleware function
 */
export const validateOptional = (schema, source = 'body') => {
  return validate(schema, source, {
    allowUnknown: false,
    stripUnknown: true,
    presence: 'optional' // Make all fields optional
  });
};

/**
 * Validation middleware for pagination parameters
 * Standardizes page, limit, sort, and order query parameters
 */
export const validatePagination = (() => {
  const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  });

  return validateQuery(paginationSchema, { allowUnknown: true });
})();

/**
 * Validation middleware for common ID parameters
 * Validates MongoDB ObjectId format in URL parameters
 */
export const validateId = (() => {
  const idSchema = Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'ID parameter is required',
      'any.required': 'ID parameter is required'
    })
  });

  return validateParams(idSchema);
})();
