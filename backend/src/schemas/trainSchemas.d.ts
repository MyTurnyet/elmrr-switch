/**
 * Type definitions for train validation schemas
 */

import Joi from 'joi';

export declare const createTrainSchema: Joi.ObjectSchema;
export declare const updateTrainSchema: Joi.ObjectSchema;
export declare const trainQuerySchema: Joi.ObjectSchema;

export declare const trainParamSchemas: {
  id: Joi.ObjectSchema;
};

export declare const trainSchemas: {
  create: Joi.ObjectSchema;
  update: Joi.ObjectSchema;
  query: Joi.ObjectSchema;
  params: typeof trainParamSchemas;
};
