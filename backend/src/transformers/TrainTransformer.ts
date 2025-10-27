/**
 * Train Transformer
 * 
 * Transforms train entities between database representation and API responses.
 * Handles complex switch lists, route information, and locomotive data.
 */

import { BaseTransformer } from './BaseTransformer.js';
import type { Train, TransformedTrain, TransformOptions, QueryParams, Statistics, Route, Locomotive } from '../types/index.js';

export class TrainTransformer extends BaseTransformer<Train, TransformedTrain> {
  /**
   * Transform a single train entity
   */
  transform(train: Train | null, options: TransformOptions = {}): TransformedTrain | null {
    if (!train) return null;
    
    const { view = 'default' } = options;
    
    // Sanitize internal fields
    const sanitized = BaseTransformer.sanitize(train);
    
    // Base transformation
    const transformed = {
      id: sanitized._id,
      name: sanitized.name,
      routeId: sanitized.routeId,
      sessionNumber: sanitized.sessionNumber,
      status: sanitized.status,
      locomotiveIds: sanitized.locomotiveIds || [],
      maxCapacity: sanitized.maxCapacity,
      assignedCarIds: sanitized.assignedCarIds || [],
      switchList: sanitized.switchList || null,
      createdAt: BaseTransformer.formatDate(sanitized.createdAt),
      updatedAt: BaseTransformer.formatDate(sanitized.updatedAt)
    };
    
    // Add enriched data if available
    if (sanitized.route) {
      transformed.route = this._transformRoute(sanitized.route);
    }
    
    if (sanitized.locomotives) {
      transformed.locomotives = sanitized.locomotives.map(l => this._transformLocomotive(l));
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
  _transformForList(train: TransformedTrain): TransformedTrain {
    return {
      id: train.id,
      name: train.name,
      status: train.status,
      sessionNumber: train.sessionNumber,
      routeId: train.routeId,
      locomotiveCount: train.locomotiveIds.length,
      carCount: train.assignedCarIds.length,
      capacity: train.maxCapacity
    };
  }

  /**
   * Transform for detail view (all fields + computed)
   * @private
   */
  _transformForDetail(train: TransformedTrain, raw: Train): TransformedTrain {
    return {
      ...train,
      // Add computed fields
      capacityUsed: train.assignedCarIds.length,
      capacityRemaining: train.maxCapacity - train.assignedCarIds.length,
      utilizationRate: train.maxCapacity > 0 
        ? ((train.assignedCarIds.length / train.maxCapacity) * 100).toFixed(1) + '%'
        : '0%',
      hasSwitchList: !!train.switchList,
      switchListStations: train.switchList ? train.switchList.length : 0,
      // Add metadata
      metadata: {
        createdAt: train.createdAt,
        updatedAt: train.updatedAt,
        sessionNumber: train.sessionNumber
      }
    };
  }

  /**
   * Transform for export (flat structure)
   * @private
   */
  _transformForExport(train: TransformedTrain): Record<string, any> {
    return {
      ID: train.id,
      Name: train.name,
      Status: train.status,
      'Session Number': train.sessionNumber,
      'Route ID': train.routeId,
      'Locomotives': train.locomotiveIds.join(', '),
      'Max Capacity': train.maxCapacity,
      'Assigned Cars': train.assignedCarIds.length,
      'Has Switch List': train.switchList ? 'Yes' : 'No',
      'Created': train.createdAt,
      'Updated': train.updatedAt
    };
  }

  /**
   * Transform route information
   * @private
   */
  _transformRoute(route: Route | undefined): any {
    if (!route) return null;
    
    return {
      id: route._id,
      name: route.name,
      origin: route.origin,
      termination: route.termination
    };
  }

  /**
   * Transform locomotive information
   * @private
   */
  _transformLocomotive(locomotive: Locomotive | undefined): any {
    if (!locomotive) return null;
    
    return {
      id: locomotive._id,
      roadName: locomotive.roadName,
      roadNumber: locomotive.roadNumber,
      model: locomotive.model
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
    
    if (queryParams.sessionNumber) {
      query.sessionNumber = parseInt(queryParams.sessionNumber);
    }
    
    if (queryParams.status) {
      query.status = queryParams.status;
    }
    
    if (queryParams.routeId) {
      query.routeId = queryParams.routeId;
    }
    
    // Search by name
    if (queryParams.search) {
      query.name = new RegExp(queryParams.search, 'i');
    }
    
    return query;
  }

  /**
   * Transform train statistics
   * 
   * @param {Array} trains - Array of trains
   * @returns {Object} - Train statistics
   */
  static transformStatistics(trains: Train[]): Statistics {
    const total = trains.length;
    
    const byStatus = trains.reduce((acc, train) => {
      acc[train.status] = (acc[train.status] || 0) + 1;
      return acc;
    }, {});
    
    const bySession = trains.reduce((acc, train) => {
      const session = train.sessionNumber || 'unknown';
      acc[session] = (acc[session] || 0) + 1;
      return acc;
    }, {});
    
    const totalCapacity = trains.reduce((sum, train) => sum + (train.maxCapacity || 0), 0);
    const totalCars = trains.reduce((sum, train) => sum + (train.assignedCarIds?.length || 0), 0);
    
    return {
      total,
      byStatus,
      bySession,
      totalCapacity,
      totalCars,
      averageCapacity: total > 0 ? (totalCapacity / total).toFixed(1) : 0,
      utilizationRate: totalCapacity > 0 ? ((totalCars / totalCapacity) * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * Transform switch list for display
   * 
   * @param {Array} switchList - Switch list array
   * @returns {Array} - Transformed switch list
   */
  static transformSwitchList(switchList: any[]): any[] {
    if (!Array.isArray(switchList)) return [];
    
    return switchList.map((station, index) => ({
      sequence: index + 1,
      stationId: station.stationId,
      stationName: station.stationName,
      pickups: station.pickups?.length || 0,
      setouts: station.setouts?.length || 0,
      actions: [
        ...(station.pickups || []).map(p => ({
          type: 'pickup',
          carId: p.carId,
          industryId: p.fromIndustry,
          destination: p.toIndustry
        })),
        ...(station.setouts || []).map(s => ({
          type: 'setout',
          carId: s.carId,
          industryId: s.toIndustry
        }))
      ]
    }));
  }
}
