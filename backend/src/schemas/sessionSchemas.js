/**
 * Operating Session Validation Schemas
 * Extracted from operatingSession model for reuse in middleware
 */

import Joi from 'joi';

// Session description update schema
export const updateSessionSchema = Joi.object({
  description: Joi.string().required().min(1).max(500).messages({
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 1 character',
    'string.max': 'Description cannot exceed 500 characters',
    'any.required': 'Description is required'
  })
});

// Session advancement schema
export const advanceSessionSchema = Joi.object({
  description: Joi.string().max(500).optional().allow('')
});

// Session rollback schema
export const rollbackSessionSchema = Joi.object({
  description: Joi.string().max(500).optional().allow('')
});

export const sessionSchemas = {
  update: updateSessionSchema,
  advance: advanceSessionSchema,
  rollback: rollbackSessionSchema
};
