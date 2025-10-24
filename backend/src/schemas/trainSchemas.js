/**
 * Train Validation Schemas
 * Extracted from train model for reuse in middleware
 */

import Joi from 'joi';
import { idSchema, paginationSchema } from './commonSchemas.js';

// Train creation schema
export const createTrainSchema = Joi.object({
  name: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Train name is required',
    'string.min': 'Train name must be at least 1 character',
    'string.max': 'Train name cannot exceed 100 characters'
  }),
  routeId: idSchema.messages({
    'any.required': 'Route ID is required'
  }),
  sessionNumber: Joi.number().integer().min(1).optional(),
  locomotiveIds: Joi.array().items(idSchema).min(1).required().messages({
    'array.min': 'At least one locomotive is required',
    'any.required': 'Locomotive IDs are required'
  }),
  maxCapacity: Joi.number().integer().min(1).max(200).default(50).messages({
    'number.min': 'Maximum capacity must be at least 1',
    'number.max': 'Maximum capacity cannot exceed 200'
  }),
  description: Joi.string().max(500).optional().allow('')
});

// Train update schema (partial)
export const updateTrainSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  routeId: idSchema.optional(),
  locomotiveIds: Joi.array().items(idSchema).min(1).optional(),
  maxCapacity: Joi.number().integer().min(1).max(200).optional(),
  description: Joi.string().max(500).optional().allow('')
});

// Train query filters schema
export const trainQuerySchema = Joi.object({
  sessionNumber: Joi.number().integer().min(1).optional(),
  status: Joi.string().valid('Planned', 'In Progress', 'Completed', 'Cancelled').optional(),
  routeId: idSchema.optional(),
  search: Joi.string().allow('').optional(),
  ...paginationSchema.describe().keys
});

// Train parameter schemas
export const trainParamSchemas = {
  id: Joi.object({
    id: idSchema
  })
};

export const trainSchemas = {
  create: createTrainSchema,
  update: updateTrainSchema,
  query: trainQuerySchema,
  params: trainParamSchemas
};
