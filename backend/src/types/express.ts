/**
 * Express Type Definitions
 * 
 * Extended types for Express Request and Response objects
 * with application-specific properties.
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Query Parameters
 */
export interface QueryParams {
  [key: string]: any;
}

/**
 * Typed Request with params
 */
export interface TypedRequest<
  TParams = any,
  TBody = any,
  TQuery = any
> extends Request {
  params: TParams;
  body: TBody;
  query: TQuery;
  apiVersion?: string;
}

/**
 * Typed Request with API version
 */
export interface VersionedRequest<
  TParams = any,
  TBody = any,
  TQuery = QueryParams
> extends TypedRequest<TParams, TBody, TQuery> {
  apiVersion?: string;
}

/**
 * Async Route Handler
 */
export type AsyncRouteHandler<
  TParams = any,
  TBody = any,
  TQuery = QueryParams
> = (
  req: TypedRequest<TParams, TBody, TQuery>,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

/**
 * Route Handler with typed params
 */
export type RouteHandler<
  TParams = any,
  TBody = any,
  TQuery = QueryParams
> = (
  req: TypedRequest<TParams, TBody, TQuery>,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;

/**
 * Common route params
 */
export interface IdParam {
  id: string;
}

/**
 * Pagination query params
 */
export interface PaginationQuery {
  page?: string;
  limit?: string;
}

/**
 * Search query params
 */
export interface SearchQuery {
  search?: string;
}

/**
 * View query params
 */
export interface ViewQuery {
  view?: 'list' | 'detail' | 'export';
}

/**
 * Combined query params
 */
export type StandardQuery = PaginationQuery & SearchQuery & ViewQuery & QueryParams;
