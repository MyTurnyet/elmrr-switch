/**
 * Type definitions for validation middleware
 */

import Joi from 'joi';
import { RequestHandler } from 'express';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface MultiValidationError extends ValidationError {
  source: string;
}

export interface ValidationSchemas {
  body?: Joi.Schema;
  query?: Joi.Schema;
  params?: Joi.Schema;
}

/**
 * Generic validation middleware factory
 */
export declare function validate(
  schema: Joi.Schema,
  source?: 'body' | 'query' | 'params',
  options?: Joi.ValidationOptions
): RequestHandler;

/**
 * Validate request body
 */
export declare function validateBody(
  schema: Joi.Schema,
  options?: Joi.ValidationOptions
): RequestHandler;

/**
 * Validate query parameters
 */
export declare function validateQuery(
  schema: Joi.Schema,
  options?: Joi.ValidationOptions
): RequestHandler;

/**
 * Validate URL parameters
 */
export declare function validateParams(
  schema: Joi.Schema,
  options?: Joi.ValidationOptions
): RequestHandler;

/**
 * Validate multiple request sources
 */
export declare function validateMultiple(
  schemas: ValidationSchemas
): RequestHandler;

/**
 * Create validation middleware for optional fields
 */
export declare function validateOptional(
  schema: Joi.Schema,
  source?: 'body' | 'query' | 'params'
): RequestHandler;

/**
 * Validation middleware for pagination parameters
 */
export declare const validatePagination: RequestHandler;

/**
 * Validation middleware for common ID parameters
 */
export declare const validateId: RequestHandler;
