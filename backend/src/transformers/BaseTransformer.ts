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
  transform(entity: T | null, options: TransformOptions = {}): any {
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
   */
  transformPaginated(
    entities: T[],
    pagination: { page: number; limit: number; total?: number },
    options: TransformOptions = {}
  ): PaginatedResponse<R> {
    const { page = 1, limit = 50, total } = pagination;
    
    const transformedData = this.transformCollection(entities, options);
    
    return {
      data: transformedData,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total || entities.length,
        totalPages: Math.ceil((total || entities.length) / limit),
        hasMore: (page * limit) < (total || entities.length)
      }
    };
  }

  /**
   * Select specific fields from an entity
   */
  selectFields(entity: R, fields: string[]): Partial<R> {
    if (!entity || !Array.isArray(fields) || fields.length === 0) {
      return entity;
    }
    
    const selected: any = {};
    fields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(entity, field)) {
        selected[field] = (entity as any)[field];
      }
    });
    
    return selected as Partial<R>;
  }

  /**
   * Exclude specific fields from an entity
   */
  excludeFields(entity: R, fields: string[]): Partial<R> {
    if (!entity || !Array.isArray(fields) || fields.length === 0) {
      return entity;
    }
    
    const result: any = { ...entity };
    fields.forEach(field => {
      delete result[field];
    });
    
    return result as Partial<R>;
  }

  /**
   * Transform for list view (minimal fields)
   */
  transformForList(entity: T): R | null {
    return this.transform(entity, { view: 'list' });
  }

  /**
   * Transform for detail view (all fields + relations)
   */
  transformForDetail(entity: T): R | null {
    return this.transform(entity, { view: 'detail' });
  }

  /**
   * Transform for export (all fields, flat structure)
   */
  transformForExport(entity: T): R | null {
    return this.transform(entity, { view: 'export' });
  }

  /**
   * Parse and validate pagination parameters
   */
  static parsePagination(query: QueryParams): PaginationParams {
    const page = Math.max(1, parseInt(query.page || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50') || 50));
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
  }

  /**
   * Parse field selection from query
   */
  static parseFields(fieldsQuery?: string): string[] | null {
    if (!fieldsQuery || typeof fieldsQuery !== 'string') {
      return null;
    }
    
    return fieldsQuery.split(',').map(f => f.trim()).filter(Boolean);
  }

  /**
   * Parse sorting parameters
   */
  static parseSort(sortQuery?: string): SortConfig | null {
    if (!sortQuery || typeof sortQuery !== 'string') {
      return null;
    }
    
    const isDescending = sortQuery.startsWith('-');
    const field = isDescending ? sortQuery.substring(1) : sortQuery;
    const order: 'asc' | 'desc' = isDescending ? 'desc' : 'asc';
    
    return { field, order };
  }

  /**
   * Build filter query from request parameters
   * Override in subclasses to define entity-specific filters
   */
  static buildFilterQuery(queryParams: QueryParams): Record<string, any> {
    // Base implementation - subclasses should override
    return {};
  }

  /**
   * Format timestamp for API response
   */
  static formatDate(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    
    if (typeof date === 'string') {
      return new Date(date).toISOString();
    }
    
    return date.toISOString();
  }

  /**
   * Sanitize entity for API response
   * Removes internal fields that shouldn't be exposed
   */
  static sanitize<T extends Record<string, any>>(entity: T | null): T | null {
    if (!entity) return null;
    
    const sanitized: any = { ...entity };
    
    // Remove internal fields
    delete sanitized.$$indexCreated;
    delete sanitized.$$indexRemoved;
    
    return sanitized as T;
  }
}
