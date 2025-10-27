/**
 * Type definitions for car order validation schemas
 */

import Joi from 'joi';

export declare const createCarOrderSchema: Joi.ObjectSchema;
export declare const updateCarOrderSchema: Joi.ObjectSchema;
export declare const generateOrdersSchema: Joi.ObjectSchema;
export declare const carOrderQuerySchema: Joi.ObjectSchema;

export declare const carOrderParamSchemas: {
  id: Joi.ObjectSchema;
};

export declare const carOrderSchemas: {
  create: Joi.ObjectSchema;
  update: Joi.ObjectSchema;
  generate: Joi.ObjectSchema;
  query: Joi.ObjectSchema;
  params: typeof carOrderParamSchemas;
};
