/**
 * Car Order Validation Schemas
 * Extracted from carOrder model for reuse in middleware
 */

import Joi from 'joi';
import { idSchema, paginationSchema } from './commonSchemas.js';

// Car order creation schema
export const createCarOrderSchema = Joi.object({
  industryId: idSchema.messages({
    'any.required': 'Industry ID is required'
  }),
  aarTypeId: idSchema.messages({
    'any.required': 'AAR Type ID is required'
  }),
  sessionNumber: Joi.number().integer().min(1).required().messages({
    'number.min': 'Session number must be at least 1',
    'any.required': 'Session number is required'
  }),
  status: Joi.string().valid('pending', 'assigned', 'in-transit', 'delivered').default('pending'),
  assignedCarId: idSchema.optional().allow(null),
  assignedTrainId: idSchema.optional().allow(null)
});

// Car order update schema (partial)
export const updateCarOrderSchema = Joi.object({
  status: Joi.string().valid('pending', 'assigned', 'in-transit', 'delivered').optional(),
  assignedCarId: idSchema.optional().allow(null),
  assignedTrainId: idSchema.optional().allow(null)
});

// Order generation schema
export const generateOrdersSchema = Joi.object({
  sessionNumber: Joi.number().integer().min(1).optional(),
  industryIds: Joi.array().items(idSchema).optional(),
  force: Joi.boolean().default(false)
});

// Car order query filters schema
export const carOrderQuerySchema = Joi.object({
  industryId: idSchema.optional(),
  status: Joi.string().valid('pending', 'assigned', 'in-transit', 'delivered').optional(),
  sessionNumber: Joi.number().integer().min(1).optional(),
  aarTypeId: idSchema.optional(),
  search: Joi.string().allow('').optional(),
  ...paginationSchema.describe().keys
});

// Car order parameter schemas
export const carOrderParamSchemas = {
  id: Joi.object({
    id: idSchema
  })
};

export const carOrderSchemas = {
  create: createCarOrderSchema,
  update: updateCarOrderSchema,
  generate: generateOrdersSchema,
  query: carOrderQuerySchema,
  params: carOrderParamSchemas
};
