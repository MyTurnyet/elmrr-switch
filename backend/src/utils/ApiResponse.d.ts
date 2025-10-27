/**
 * Type definitions for ApiResponse utility class
 */

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  count: number;
  pagination: Record<string, any>;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  stack?: string;
}

export declare class ApiResponse {
  /**
   * Create a successful response
   */
  static success<T = any>(
    data: T,
    message?: string,
    statusCode?: number
  ): SuccessResponse<T>;

  /**
   * Create a paginated success response
   */
  static paginated<T = any>(
    data: T[],
    pagination?: Record<string, any>,
    message?: string
  ): PaginatedResponse<T>;

  /**
   * Create an error response
   */
  static error(
    message: string,
    statusCode?: number,
    details?: any
  ): ErrorResponse;

  /**
   * Create a validation error response
   */
  static validationError(errors: string[] | string): ErrorResponse;

  /**
   * Create a not found response
   */
  static notFound(resource?: string): ErrorResponse;

  /**
   * Create an unauthorized response
   */
  static unauthorized(message?: string): ErrorResponse;

  /**
   * Create a forbidden response
   */
  static forbidden(message?: string): ErrorResponse;

  /**
   * Create a conflict response
   */
  static conflict(message: string, details?: any): ErrorResponse;
}
