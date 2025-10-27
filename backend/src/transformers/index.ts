/**
 * Transformer Factory
 * 
 * Centralized management of all entity transformers.
 * Provides a consistent interface for accessing transformers.
 */

import { BaseTransformer } from './BaseTransformer.js';
import { CarTransformer } from './CarTransformer.js';
import { TrainTransformer } from './TrainTransformer.js';
import { LocomotiveTransformer } from './LocomotiveTransformer.js';
import { IndustryTransformer } from './IndustryTransformer.js';
import { 
  StationTransformer,
  GoodTransformer,
  AarTypeTransformer,
  BlockTransformer,
  TrackTransformer,
  RouteTransformer
} from './SimpleTransformer.js';
import type { 
  BaseEntity, 
  TransformOptions, 
  PaginationParams,
  QueryParams,
  SortConfig,
  PaginatedResponse
} from '../types/index.js';

// Transformer registry
const transformers = {
  car: new CarTransformer(),
  cars: new CarTransformer(),
  train: new TrainTransformer(),
  trains: new TrainTransformer(),
  locomotive: new LocomotiveTransformer(),
  locomotives: new LocomotiveTransformer(),
  industry: new IndustryTransformer(),
  industries: new IndustryTransformer(),
  station: new StationTransformer(),
  stations: new StationTransformer(),
  good: new GoodTransformer(),
  goods: new GoodTransformer(),
  aartype: new AarTypeTransformer(),
  aartypes: new AarTypeTransformer(),
  'aar-type': new AarTypeTransformer(),
  'aar-types': new AarTypeTransformer(),
  block: new BlockTransformer(),
  blocks: new BlockTransformer(),
  track: new TrackTransformer(),
  tracks: new TrackTransformer(),
  route: new RouteTransformer(),
  routes: new RouteTransformer()
};

/**
 * Get transformer for a specific entity type
 */
export function getTransformer<T extends BaseEntity = BaseEntity>(
  entityType: string
): BaseTransformer<T, any> {
  const transformer = transformers[entityType.toLowerCase() as keyof typeof transformers];
  
  if (!transformer) {
    // Return base transformer as fallback
    return new BaseTransformer<T, any>();
  }
  
  return transformer as BaseTransformer<T, any>;
}

/**
 * Transform a single entity
 */
export function transform<T extends BaseEntity = BaseEntity>(
  entityType: string,
  entity: T | null,
  options: TransformOptions = {}
): any {
  const transformer = getTransformer<T>(entityType);
  return transformer.transform(entity, options);
}

/**
 * Transform a collection of entities
 */
export function transformCollection<T extends BaseEntity = BaseEntity>(
  entityType: string,
  entities: T[],
  options: TransformOptions = {}
): any[] {
  const transformer = getTransformer<T>(entityType);
  return transformer.transformCollection(entities, options);
}

/**
 * Transform with pagination
 */
export function transformPaginated<T extends BaseEntity = BaseEntity>(
  entityType: string,
  entities: T[],
  pagination: { page: number; limit: number; total?: number },
  options: TransformOptions = {}
): PaginatedResponse<any> {
  const transformer = getTransformer<T>(entityType);
  return transformer.transformPaginated(entities, pagination, options);
}

/**
 * Build filter query for entity type
 */
export function buildFilterQuery(
  entityType: string,
  queryParams: QueryParams
): Record<string, any> {
  const transformer = getTransformer(entityType);
  
  if ((transformer.constructor as any).buildFilterQuery) {
    return (transformer.constructor as any).buildFilterQuery(queryParams);
  }
  
  return {};
}

/**
 * Parse pagination from query parameters
 */
export function parsePagination(query: QueryParams): PaginationParams {
  return BaseTransformer.parsePagination(query);
}

/**
 * Parse field selection from query
 */
export function parseFields(fieldsQuery?: string): string[] | null {
  return BaseTransformer.parseFields(fieldsQuery);
}

/**
 * Parse sorting from query
 */
export function parseSort(sortQuery?: string): SortConfig | null {
  return BaseTransformer.parseSort(sortQuery);
}

// Export transformer classes for direct use
export { BaseTransformer } from './BaseTransformer.js';
export { CarTransformer } from './CarTransformer.js';
export { TrainTransformer } from './TrainTransformer.js';
export { LocomotiveTransformer } from './LocomotiveTransformer.js';
export { IndustryTransformer } from './IndustryTransformer.js';
export { 
  SimpleTransformer,
  StationTransformer,
  GoodTransformer,
  AarTypeTransformer,
  BlockTransformer,
  TrackTransformer,
  RouteTransformer
} from './SimpleTransformer.js';
