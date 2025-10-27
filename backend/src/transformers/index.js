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
 * 
 * @param {string} entityType - Entity type (e.g., 'car', 'train')
 * @returns {BaseTransformer} - Transformer instance
 */
export function getTransformer(entityType) {
  const transformer = transformers[entityType.toLowerCase()];
  
  if (!transformer) {
    // Return base transformer as fallback
    return new BaseTransformer();
  }
  
  return transformer;
}

/**
 * Transform a single entity
 * 
 * @param {string} entityType - Entity type
 * @param {Object} entity - Entity to transform
 * @param {Object} options - Transformation options
 * @returns {Object} - Transformed entity
 */
export function transform(entityType, entity, options = {}) {
  const transformer = getTransformer(entityType);
  return transformer.transform(entity, options);
}

/**
 * Transform a collection of entities
 * 
 * @param {string} entityType - Entity type
 * @param {Array} entities - Entities to transform
 * @param {Object} options - Transformation options
 * @returns {Array} - Transformed entities
 */
export function transformCollection(entityType, entities, options = {}) {
  const transformer = getTransformer(entityType);
  return transformer.transformCollection(entities, options);
}

/**
 * Transform with pagination
 * 
 * @param {string} entityType - Entity type
 * @param {Array} entities - Entities to transform
 * @param {Object} pagination - Pagination info
 * @param {Object} options - Transformation options
 * @returns {Object} - Paginated response
 */
export function transformPaginated(entityType, entities, pagination, options = {}) {
  const transformer = getTransformer(entityType);
  return transformer.transformPaginated(entities, pagination, options);
}

/**
 * Build filter query for entity type
 * 
 * @param {string} entityType - Entity type
 * @param {Object} queryParams - Query parameters
 * @returns {Object} - Filter query
 */
export function buildFilterQuery(entityType, queryParams) {
  const transformer = getTransformer(entityType);
  
  if (transformer.constructor.buildFilterQuery) {
    return transformer.constructor.buildFilterQuery(queryParams);
  }
  
  return {};
}

/**
 * Parse pagination from query parameters
 * 
 * @param {Object} query - Query parameters
 * @returns {Object} - Pagination config
 */
export function parsePagination(query) {
  return BaseTransformer.parsePagination(query);
}

/**
 * Parse field selection from query
 * 
 * @param {string} fieldsQuery - Fields query string
 * @returns {Array<string>|null} - Selected fields
 */
export function parseFields(fieldsQuery) {
  return BaseTransformer.parseFields(fieldsQuery);
}

/**
 * Parse sorting from query
 * 
 * @param {string} sortQuery - Sort query string
 * @returns {Object|null} - Sort configuration
 */
export function parseSort(sortQuery) {
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
