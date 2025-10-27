/**
 * Simple Transformer
 * 
 * Generic transformer for simple entities (stations, goods, aarTypes, blocks, tracks).
 * These entities have minimal fields and don't require complex transformations.
 */

import { BaseTransformer } from './BaseTransformer.js';
import type { BaseEntity, TransformOptions, QueryParams, Statistics } from '../types/index.js';

export class SimpleTransformer extends BaseTransformer<BaseEntity, any> {
  /**
   * Transform a simple entity
   */
  transform(entity: BaseEntity | null, options: TransformOptions = {}): any {
    if (!entity) return null;
    
    const { view = 'default', fields = [] } = options;
    
    // Sanitize internal fields
    const sanitized = BaseTransformer.sanitize(entity);
    
    // Base transformation - convert _id to id
    const transformed = {
      id: sanitized._id,
      ...sanitized
    };
    
    // Remove _id since we've converted it to id
    delete transformed._id;
    
    // Apply field selection if specified
    if (fields.length > 0) {
      return this.selectFields(transformed, fields);
    }
    
    // View-specific transformations
    switch (view) {
      case 'export':
        return this._transformForExport(transformed);
      default:
        return transformed;
    }
  }

  /**
   * Transform for export (capitalize field names)
   * @private
   */
  _transformForExport(entity: any) {
    const exported: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(entity)) {
      // Capitalize first letter and replace camelCase with spaces
      const friendlyKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      
      exported[friendlyKey] = value;
    }
    
    return exported;
  }

  /**
   * Build filter query from request parameters
   * Generic implementation that handles common patterns
   * 
   * @param {Object} queryParams - Query parameters
   * @param {Array<string>} filterableFields - Fields that can be filtered
   * @returns {Object} - Database query object
   */
  static buildFilterQuery(queryParams: any, filterableFields: string[] = []) {
    const query: any = {};
    
    // Add filters for specified fields
    filterableFields.forEach(field => {
      if (queryParams[field]) {
        query[field] = queryParams[field];
      }
    });
    
    // Handle search if name field exists
    if (queryParams.search) {
      query["$or"] = [
        { name: new RegExp(queryParams.search, 'i') },
        { code: new RegExp(queryParams.search, 'i') }
      ];
    }
    
    return query;
  }

  /**
   * Transform simple statistics
   * 
   * @param {Array} entities - Array of entities
   * @param {string} groupByField - Field to group by (optional)
   * @returns {Object} - Statistics
   */
  static transformStatistics(entities: any[], groupByField: string | null = null) {
    const total = entities.length;
    
    const stats: Record<string, any> = { total };
    
    // Group by field if specified
    if (groupByField) {
      stats[`by${groupByField.charAt(0).toUpperCase() + groupByField.slice(1)}`] = 
        entities.reduce((acc: Record<string, number>, entity: any) => {
          const value = entity[groupByField] || 'unknown';
          acc[value] = (acc[value] || 0) + 1;
          return acc;
        }, {});
    }
    
    return stats;
  }
}

/**
 * Station Transformer
 */
export class StationTransformer extends SimpleTransformer {
  static buildFilterQuery(queryParams: any) {
    return super.buildFilterQuery(queryParams, ['code']);
  }
}

/**
 * Good Transformer
 */
export class GoodTransformer extends SimpleTransformer {
  static buildFilterQuery(queryParams: any) {
    return super.buildFilterQuery(queryParams, ['category']);
  }
  
  static transformStatistics(goods: any[]) {
    return super.transformStatistics(goods, 'category');
  }
}

/**
 * AAR Type Transformer
 */
export class AarTypeTransformer extends SimpleTransformer {
  static buildFilterQuery(queryParams: any) {
    return super.buildFilterQuery(queryParams, ['category', 'code']);
  }
  
  static transformStatistics(aarTypes: any[]) {
    return super.transformStatistics(aarTypes, 'category');
  }
}

/**
 * Block Transformer
 */
export class BlockTransformer extends SimpleTransformer {
  static buildFilterQuery(queryParams: any) {
    return super.buildFilterQuery(queryParams, []);
  }
}

/**
 * Track Transformer
 */
export class TrackTransformer extends SimpleTransformer {
  static buildFilterQuery(queryParams: any) {
    return super.buildFilterQuery(queryParams, ['stationId', 'trackType']);
  }
  
  static transformStatistics(tracks: any[]) {
    return super.transformStatistics(tracks, 'trackType');
  }
}

/**
 * Route Transformer
 */
export class RouteTransformer extends SimpleTransformer {
  transform(route: any, options: any = {}) {
    if (!route) return null;
    
    const transformed = super.transform(route, options);
    
    // Add computed fields for routes
    if (transformed.stations && Array.isArray(transformed.stations)) {
      transformed.stationCount = transformed.stations.length;
    }
    
    return transformed;
  }
  
  static buildFilterQuery(queryParams: any) {
    return super.buildFilterQuery(queryParams, ['origin', 'termination']);
  }
}
