/**
 * Type Definitions for Transformers
 * 
 * Types for the transformation layer including transformer interfaces
 * and transformation-related types.
 */

import {
  BaseEntity,
  TransformOptions,
  PaginationParams,
  PaginationMetadata,
  PaginatedResponse,
  FilterQuery,
  Statistics
} from './models.js';

/**
 * Transformer Interface
 * Base interface that all transformers must implement
 */
export interface ITransformer<T extends BaseEntity, R = any> {
  /**
   * Transform a single entity
   */
  transform(entity: T, options?: TransformOptions): R | null;
  
  /**
   * Transform a collection of entities
   */
  transformCollection(entities: T[], options?: TransformOptions): R[];
  
  /**
   * Transform with pagination
   */
  transformPaginated(
    entities: T[],
    pagination: PaginationInfo,
    options?: TransformOptions
  ): PaginatedResponse<R>;
  
  /**
   * Transform for list view
   */
  transformForList(entity: T): R | null;
  
  /**
   * Transform for detail view
   */
  transformForDetail(entity: T): R | null;
  
  /**
   * Transform for export
   */
  transformForExport(entity: T): R | null;
  
  /**
   * Select specific fields
   */
  selectFields(entity: R, fields: string[]): Partial<R>;
  
  /**
   * Exclude specific fields
   */
  excludeFields(entity: R, fields: string[]): Partial<R>;
}

/**
 * Pagination Info
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total?: number;
}

/**
 * Transformed Entity
 * Base type for transformed entities (with id instead of _id)
 */
export interface TransformedEntity {
  id: string;
  [key: string]: any;
}

/**
 * Transformed Car
 */
export interface TransformedCar extends TransformedEntity {
  reportingMarks: string;
  reportingNumber: string;
  carType: string;
  isInService: boolean;
  currentIndustry: string;
  homeYard: string;
  sessionsAtCurrentLocation: number;
  lastMoved: string;
  fullReportingMarks?: string; // Computed field
  status?: string; // Computed field
}

/**
 * Transformed Train
 */
export interface TransformedTrain extends TransformedEntity {
  name: string;
  status: string;
  sessionNumber: number;
  routeId: string;
  locomotiveIds: string[];
  maxCapacity: number;
  assignedCarIds: string[];
  switchList: any[] | null;
  createdAt: string;
  updatedAt: string;
  capacityUsed?: number; // Computed field
  capacityRemaining?: number; // Computed field
  utilizationRate?: string; // Computed field
}

/**
 * Transformed Locomotive
 */
export interface TransformedLocomotive extends TransformedEntity {
  roadName: string;
  roadNumber: string;
  model: string;
  isInService: boolean;
  fullDesignation?: string; // Computed field
  status?: string; // Computed field
}

/**
 * Transformed Industry
 */
export interface TransformedIndustry extends TransformedEntity {
  name: string;
  stationId: string;
  carDemandConfig: any[];
  hasDemandConfig?: boolean; // Computed field
  totalDemandTypes?: number; // Computed field
}

/**
 * Query Parameters
 * Common query parameters for API requests
 */
export interface QueryParams {
  page?: string;
  limit?: string;
  view?: 'list' | 'detail' | 'export';
  fields?: string;
  sort?: string;
  search?: string;
  [key: string]: string | undefined;
}

/**
 * Transformer Factory Type
 */
export type TransformerFactory = {
  getTransformer<T extends BaseEntity = BaseEntity>(
    entityType: string
  ): ITransformer<T>;
  
  transform<T extends BaseEntity = BaseEntity>(
    entityType: string,
    entity: T,
    options?: TransformOptions
  ): any;
  
  transformCollection<T extends BaseEntity = BaseEntity>(
    entityType: string,
    entities: T[],
    options?: TransformOptions
  ): any[];
  
  transformPaginated<T extends BaseEntity = BaseEntity>(
    entityType: string,
    entities: T[],
    pagination: PaginationInfo,
    options?: TransformOptions
  ): PaginatedResponse<any>;
  
  buildFilterQuery(entityType: string, queryParams: QueryParams): FilterQuery;
  
  parsePagination(query: QueryParams): PaginationParams;
  
  parseFields(fieldsQuery?: string): string[] | null;
  
  parseSort(sortQuery?: string): { field: string; order: 'asc' | 'desc' } | null;
};

/**
 * Statistics Transformer Type
 */
export type StatisticsTransformer<T extends BaseEntity = BaseEntity> = (
  entities: T[]
) => Statistics;
