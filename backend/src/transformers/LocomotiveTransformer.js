/**
 * Locomotive Transformer
 * 
 * Transforms locomotive entities between database representation and API responses.
 */

import { BaseTransformer } from './BaseTransformer.js';

export class LocomotiveTransformer extends BaseTransformer {
  /**
   * Transform a single locomotive entity
   * 
   * @param {Object} locomotive - Raw locomotive entity from database
   * @param {Object} options - Transformation options
   * @returns {Object} - Transformed locomotive entity
   */
  transform(locomotive, options = {}) {
    if (!locomotive) return null;
    
    const { view = 'default' } = options;
    
    // Sanitize internal fields
    const sanitized = BaseTransformer.sanitize(locomotive);
    
    // Base transformation
    const transformed = {
      id: sanitized._id,
      roadName: sanitized.roadName,
      roadNumber: sanitized.roadNumber,
      model: sanitized.model,
      isInService: sanitized.isInService
    };
    
    // View-specific transformations
    switch (view) {
      case 'list':
        return this._transformForList(transformed);
      case 'detail':
        return this._transformForDetail(transformed, sanitized);
      case 'export':
        return this._transformForExport(transformed);
      default:
        return transformed;
    }
  }

  /**
   * Transform for list view (minimal fields)
   * @private
   */
  _transformForList(locomotive) {
    return {
      id: locomotive.id,
      roadName: locomotive.roadName,
      roadNumber: locomotive.roadNumber,
      model: locomotive.model,
      isInService: locomotive.isInService
    };
  }

  /**
   * Transform for detail view (all fields + computed)
   * @private
   */
  _transformForDetail(locomotive, raw) {
    return {
      ...locomotive,
      // Add computed fields
      fullDesignation: `${locomotive.roadName} ${locomotive.roadNumber}`,
      status: locomotive.isInService ? 'In Service' : 'Out of Service'
    };
  }

  /**
   * Transform for export (flat structure)
   * @private
   */
  _transformForExport(locomotive) {
    return {
      ID: locomotive.id,
      'Road Name': locomotive.roadName,
      'Road Number': locomotive.roadNumber,
      Model: locomotive.model,
      'In Service': locomotive.isInService ? 'Yes' : 'No'
    };
  }

  /**
   * Build filter query from request parameters
   * 
   * @param {Object} queryParams - Query parameters
   * @returns {Object} - Database query object
   */
  static buildFilterQuery(queryParams) {
    const query = {};
    
    if (queryParams.roadName) {
      query.roadName = queryParams.roadName;
    }
    
    if (queryParams.model) {
      query.model = queryParams.model;
    }
    
    if (queryParams.status) {
      query.isInService = queryParams.status === 'true';
    }
    
    // Search by road name or number
    if (queryParams.search) {
      query.$or = [
        { roadName: new RegExp(queryParams.search, 'i') },
        { roadNumber: new RegExp(queryParams.search, 'i') }
      ];
    }
    
    return query;
  }

  /**
   * Transform locomotive statistics
   * 
   * @param {Array} locomotives - Array of locomotives
   * @returns {Object} - Locomotive statistics
   */
  static transformStatistics(locomotives) {
    const total = locomotives.length;
    const inService = locomotives.filter(l => l.isInService).length;
    const outOfService = total - inService;
    
    const byRoadName = locomotives.reduce((acc, loco) => {
      acc[loco.roadName] = (acc[loco.roadName] || 0) + 1;
      return acc;
    }, {});
    
    const byModel = locomotives.reduce((acc, loco) => {
      acc[loco.model] = (acc[loco.model] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total,
      inService,
      outOfService,
      byRoadName,
      byModel,
      availabilityRate: total > 0 ? ((inService / total) * 100).toFixed(1) + '%' : '0%'
    };
  }
}
