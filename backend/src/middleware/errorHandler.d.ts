/**
 * Type definitions for error handling middleware
 */

import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';

/**
 * Async handler wrapper to catch async errors
 */
export declare function asyncHandler<T = any>(
  fn: (req: any, res: Response, next?: NextFunction) => Promise<T>
): RequestHandler;

/**
 * Custom error class for API errors
 */
export declare class ApiError extends Error {
  statusCode: number;
  details: any;
  isOperational: boolean;

  constructor(message: string, statusCode?: number, details?: any);
}

/**
 * Global error handling middleware
 */
export declare const globalErrorHandler: ErrorRequestHandler;

/**
 * 404 handler for unmatched routes
 */
export declare function notFoundHandler(req: Request, res: Response): void;
