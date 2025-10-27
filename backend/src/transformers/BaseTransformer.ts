/**
 * Base Transformer Class
 * 
 * Provides a consistent interface for transforming data between
 * database representation and API responses.
 * 
 * Features:
 * - Data serialization/deserialization
 * - Field filtering and selection
 * - Pagination support
 * - Collection transformation
 * - Consistent response formatting
 */

import type {
  BaseEntity,
  TransformOptions,
  PaginationParams,
  PaginationMetadata,
  PaginatedResponse,
  QueryParams,
  SortConfig
} from '../types/index.js';

export class BaseTransformer<T extends BaseEntity = BaseEntity, R = any> {
  /**
   * Transform a single entity
   * Override this method in subclasses to define entity-specific transformations
   */
  transform(entity: T | null, options: TransformOptions = {}): R | null {
    if (!entity) return null;
    
    // Default: return entity as-is
    // Subclasses should override this method
    return entity as unknown as R;
  }

  /**
   * Transform a collection of entities
   */
  transformCollection(entities: T[], options: TransformOptions = {}): R[] {
    if (!Array.isArray(entities)) {
      return [];
    }
    
    return entities.map(entity => this.transform(entity, options)).filter((e): e is R => e !== null);
  }

  /**
   * Transform with pagination metadata
   * 
   * @param {Array} entities - Array of entities
   * @param {Object} pagination - Pagination info { page, limit, total }
   * @param {Object} options - Transformation options
   * @returns {Object} - Paginated response with metadata
   */
  transformPaginated(entities, pagination, options = {}) {
    const { page = 1, limit = 50, total } = pagination;
    
    const transformedData = this.transformCollection(entities, options);
    
    return {
      data: transformedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total || entities.length,
        totalPages: Math.ceil((total || entities.length) / limit),
        hasMore: (page * limit) < (total || entities.length)
      }
    };
  }

  /**
   * Select specific fields from an entity
   * 
   * @param {Object} entity - Entity object
   * @param {Array<string>} fields - Array of field names to include
   * @returns {Object} - Entity with only selected fields
   */
  selectFields(entity, fields) {
    if (!entity || !Array.isArray(fields) || fields.length === 0) {
      return entity;
    }
    
    const selected = {};
    fields.forEach(field => {
      if (entity.hasOwnProperty(field)) {
        selected[field] = entity[field];
      }
    });
    
    return selected;
  }

  /**
   * Exclude specific fields from an entity
   * 
   * @param {Object} entity - Entity object
   * @param {Array<string>} fields - Array of field names to exclude
   * @returns {Object} - Entity without excluded fields
   */
  excludeFields(entity, fields) {
    if (!entity || !Array.isArray(fields) || fields.length === 0) {
      return entity;
    }
    
    const result = { ...entity };
    fields.forEach(field => {
      delete result[field];
    });
    
    return result;
  }

  /**
   * Transform for list view (minimal fields)
   * Override in subclasses to define list-specific transformations
   * 
   * @param {Object} entity - Raw entity
   * @returns {Object} - Transformed entity with minimal fields
   */
  transformForList(entity) {
    return this.transform(entity, { view: 'list' });
  }

  /**
   * Transform for detail view (all fields + relations)
   * Override in subclasses to define detail-specific transformations
   * 
   * @param {Object} entity - Raw entity
   * @returns {Object} - Transformed entity with all fields
   */
  transformForDetail(entity) {
    return this.transform(entity, { view: 'detail' });
  }

  /**
   * Transform for export (all fields, flat structure)
   * 
   * @param {Object} entity - Raw entity
   * @returns {Object} - Transformed entity for export
   */
  transformForExport(entity) {
    return this.transform(entity, { view: 'export' });
  }

  /**
   * Parse and validate pagination parameters
   * 
   * @param {Object} query - Query parameters from request
   * @returns {Object} - Validated pagination parameters
   */
  static parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50));
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
  }

  /**
   * Parse field selection from query
   * 
   * @param {string} fieldsQuery - Comma-separated field names
   * @returns {Array<string>|null} - Array of field names or null
   */
  static parseFields(fieldsQuery) {
    if (!fieldsQuery || typeof fieldsQuery !== 'string') {
      return null;
    }
    
    return fieldsQuery.split(',').map(f => f.trim()).filter(Boolean);
  }

  /**
   * Parse sorting parameters
   * 
   * @param {string} sortQuery - Sort parameter (e.g., "name", "-createdAt")
   * @returns {Object} - Sort configuration { field, order }
   */
  static parseSort(sortQuery) {
    if (!sortQuery || typeof sortQuery !== 'string') {
      return null;
    }
    
    const isDescending = sortQuery.startsWith('-');
    const field = isDescending ? sortQuery.substring(1) : sortQuery;
    const order = isDescending ? 'desc' : 'asc';
    
    return { field, order };
  }

  /**
   * Build filter query from request parameters
   * Override in subclasses to define entity-specific filters
   * 
   * @param {Object} queryParams - Query parameters from request
   * @returns {Object} - Database query object
   */
  static buildFilterQuery(queryParams) {
    // Base implementation - subclasses should override
    return {};
  }

  /**
   * Format timestamp for API response
   * 
   * @param {Date|string} date - Date to format
   * @returns {string} - ISO formatted date string
   */
  static formatDate(date) {
    if (!date) return null;
    
    if (typeof date === 'string') {
      return new Date(date).toISOString();
    }
    
    return date.toISOString();
  }

  /**
   * Sanitize entity for API response
   * Removes internal fields that shouldn't be exposed
   * 
   * @param {Object} entity - Entity to sanitize
   * @returns {Object} - Sanitized entity
   */
  static sanitize(entity) {
    if (!entity) return null;
    
    const sanitized = { ...entity };
    
    // Remove internal fields
    delete sanitized.$$indexCreated;
    delete sanitized.$$indexRemoved;
    
    return sanitized;
  }
}
