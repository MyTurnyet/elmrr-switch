/**
 * Type definitions for common validation schemas
 */

import Joi from 'joi';

export declare const idSchema: Joi.StringSchema;
export declare const paginationSchema: Joi.ObjectSchema;
export declare const searchSchema: Joi.ObjectSchema;

export declare const paramSchemas: {
  id: Joi.ObjectSchema;
};

export declare const querySchemas: {
  pagination: Joi.ObjectSchema;
  search: Joi.ObjectSchema;
};

export declare const commonSchemas: {
  id: Joi.StringSchema;
  pagination: Joi.ObjectSchema;
  search: Joi.ObjectSchema;
  params: typeof paramSchemas;
  query: typeof querySchemas;
};
