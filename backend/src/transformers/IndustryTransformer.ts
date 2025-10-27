/**
 * Industry Transformer
 * 
 * Transforms industry entities between database representation and API responses.
 * Handles car demand configuration and station relationships.
 */

import { BaseTransformer } from './BaseTransformer.js';
import type { Industry, TransformedIndustry, TransformOptions, QueryParams, Statistics } from '../types/index.js';

export class IndustryTransformer extends BaseTransformer<Industry, TransformedIndustry> {
  /**
   * Transform a single industry entity
   * 
   * @param {Object} industry - Raw industry entity from database
   * @param {Object} options - Transformation options
   * @returns {Object} - Transformed industry entity
   */
  transform(industry: Industry | null, options: TransformOptions = {}): TransformedIndustry | null {
    if (!industry) return null;
    
    const { view = 'default' } = options;
    
    // Sanitize internal fields
    const sanitized = BaseTransformer.sanitize(industry);
    
    // Base transformation
    const transformed = {
      id: sanitized._id,
      name: sanitized.name,
      stationId: sanitized.stationId,
      carDemandConfig: sanitized.carDemandConfig || []
    };
    
    // Add enriched data if available
    if (sanitized.station) {
      transformed.station = this._transformStation(sanitized.station);
    }
    
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
  _transformForList(industry: TransformedIndustry): TransformedIndustry {
    return {
      id: industry.id,
      name: industry.name,
      stationId: industry.stationId,
      demandConfigCount: industry.carDemandConfig.length
    };
  }

  /**
   * Transform for detail view (all fields + computed)
   * @private
   */
  _transformForDetail(industry: TransformedIndustry, raw: Industry): TransformedIndustry {
    return {
      ...industry,
      // Add computed fields
      hasDemandConfig: industry.carDemandConfig.length > 0,
      totalDemandTypes: industry.carDemandConfig.length,
      // Transform demand config for better readability
      carDemandConfig: industry.carDemandConfig.map(config => ({
        aarTypeId: config.aarTypeId,
        carsPerSession: config.carsPerSession,
        frequency: config.frequency,
        description: `${config.carsPerSession} car(s) every ${config.frequency} session(s)`
      }))
    };
  }

  /**
   * Transform for export (flat structure)
   * @private
   */
  _transformForExport(industry: TransformedIndustry): Record<string, any> {
    return {
      ID: industry.id,
      Name: industry.name,
      'Station ID': industry.stationId,
      'Demand Configurations': industry.carDemandConfig.length,
      'Demand Details': industry.carDemandConfig
        .map(c => `${c.aarTypeId}: ${c.carsPerSession}/${c.frequency}`)
        .join('; ')
    };
  }

  /**
   * Transform station information
   * @private
   */
  _transformStation(station: any): any {
    if (!station) return null;
    
    return {
      id: station._id,
      name: station.name,
      code: station.code
    };
  }

  /**
   * Build filter query from request parameters
   * 
   * @param {Object} queryParams - Query parameters
   * @returns {Object} - Database query object
   */
  static buildFilterQuery(queryParams: QueryParams): Record<string, any> {
    const query = {};
    
    if (queryParams.stationId) {
      query.stationId = queryParams.stationId;
    }
    
    // Filter by industries with demand config
    if (queryParams.hasDemand === 'true') {
      query['carDemandConfig.0'] = { $exists: true };
    } else if (queryParams.hasDemand === 'false') {
      query.$or = [
        { carDemandConfig: { $exists: false } },
        { carDemandConfig: { $size: 0 } }
      ];
    }
    
    // Search by name
    if (queryParams.search) {
      query.name = new RegExp(queryParams.search, 'i');
    }
    
    return query;
  }

  /**
   * Transform industry statistics
   * 
   * @param {Array} industries - Array of industries
   * @returns {Object} - Industry statistics
   */
  static transformStatistics(industries: Industry[]): Statistics {
    const total = industries.length;
    const withDemand = industries.filter(i => i.carDemandConfig && i.carDemandConfig.length > 0).length;
    const withoutDemand = total - withDemand;
    
    const byStation = industries.reduce((acc, industry) => {
      acc[industry.stationId] = (acc[industry.stationId] || 0) + 1;
      return acc;
    }, {});
    
    const totalDemandConfigs = industries.reduce((sum, industry) => {
      return sum + (industry.carDemandConfig?.length || 0);
    }, 0);
    
    return {
      total,
      withDemand,
      withoutDemand,
      byStation,
      totalDemandConfigs,
      averageDemandPerIndustry: total > 0 ? (totalDemandConfigs / total).toFixed(1) : 0,
      demandCoverageRate: total > 0 ? ((withDemand / total) * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * Calculate total demand for a specific session
   * 
   * @param {Object} industry - Industry with demand config
   * @param {number} sessionNumber - Session number
   * @returns {number} - Total cars demanded
   */
  static calculateSessionDemand(industry: Industry, sessionNumber: number): number {
    if (!industry.carDemandConfig || !Array.isArray(industry.carDemandConfig)) {
      return 0;
    }
    
    return industry.carDemandConfig.reduce((total, config) => {
      // Check if this demand is active for this session
      if (sessionNumber % config.frequency === 0) {
        return total + config.carsPerSession;
      }
      return total;
    }, 0);
  }
}
