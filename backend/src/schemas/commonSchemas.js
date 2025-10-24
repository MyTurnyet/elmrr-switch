/**
 * Common Validation Schemas
 * Reusable schemas for common patterns
 */

import Joi from 'joi';

// Common ID validation
export const idSchema = Joi.string().required().messages({
  'string.empty': 'ID is required',
  'any.required': 'ID is required'
});

// Pagination schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

// Search and filter schema
export const searchSchema = Joi.object({
  search: Joi.string().allow('').optional(),
  ...paginationSchema.describe().keys
});

// URL parameter schemas
export const paramSchemas = {
  id: Joi.object({
    id: idSchema
  })
};

// Common query schemas
export const querySchemas = {
  pagination: paginationSchema,
  search: searchSchema
};

export const commonSchemas = {
  id: idSchema,
  pagination: paginationSchema,
  search: searchSchema,
  params: paramSchemas,
  query: querySchemas
};
