/**
 * Type definitions for session validation schemas
 */

import Joi from 'joi';

export declare const updateSessionSchema: Joi.ObjectSchema;
export declare const advanceSessionSchema: Joi.ObjectSchema;
export declare const rollbackSessionSchema: Joi.ObjectSchema;

export declare const sessionSchemas: {
  update: Joi.ObjectSchema;
  advance: Joi.ObjectSchema;
  rollback: Joi.ObjectSchema;
};
