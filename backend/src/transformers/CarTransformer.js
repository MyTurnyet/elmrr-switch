/**
 * Car Transformer
 * 
 * Transforms car entities between database representation and API responses.
 * Handles field selection, data enrichment, and consistent formatting.
 */

import { BaseTransformer } from './BaseTransformer.js';

export class CarTransformer extends BaseTransformer {
  /**
   * Transform a single car entity
   * 
   * @param {Object} car - Raw car entity from database
   * @param {Object} options - Transformation options
   * @returns {Object} - Transformed car entity
   */
  transform(car, options = {}) {
    if (!car) return null;
    
    const { view = 'default' } = options;
    
    // Sanitize internal fields
    const sanitized = BaseTransformer.sanitize(car);
    
    // Base transformation
    const transformed = {
      id: sanitized._id,
      reportingMarks: sanitized.reportingMarks,
      reportingNumber: sanitized.reportingNumber,
      carType: sanitized.carType,
      isInService: sanitized.isInService,
      currentIndustry: sanitized.currentIndustry,
      homeYard: sanitized.homeYard,
      sessionsAtCurrentLocation: sanitized.sessionsAtCurrentLocation,
      lastMoved: BaseTransformer.formatDate(sanitized.lastMoved)
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
  _transformForList(car) {
    return {
      id: car.id,
      reportingMarks: car.reportingMarks,
      reportingNumber: car.reportingNumber,
      carType: car.carType,
      currentIndustry: car.currentIndustry,
      isInService: car.isInService
    };
  }

  /**
   * Transform for detail view (all fields + computed)
   * @private
   */
  _transformForDetail(car, raw) {
    return {
      ...car,
      // Add computed fields
      fullReportingMarks: `${car.reportingMarks} ${car.reportingNumber}`,
      status: car.isInService ? 'In Service' : 'Out of Service',
      // Add metadata
      metadata: {
        lastMoved: car.lastMoved,
        sessionsAtLocation: car.sessionsAtCurrentLocation
      }
    };
  }

  /**
   * Transform for export (flat structure)
   * @private
   */
  _transformForExport(car) {
    return {
      ID: car.id,
      'Reporting Marks': car.reportingMarks,
      'Reporting Number': car.reportingNumber,
      'Car Type': car.carType,
      'Current Location': car.currentIndustry,
      'Home Yard': car.homeYard,
      'In Service': car.isInService ? 'Yes' : 'No',
      'Sessions at Location': car.sessionsAtCurrentLocation,
      'Last Moved': car.lastMoved
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
    
    if (queryParams.carType) {
      query.carType = queryParams.carType;
    }
    
    if (queryParams.location) {
      query.currentIndustry = queryParams.location;
    }
    
    if (queryParams.status) {
      query.isInService = queryParams.status === 'true';
    }
    
    if (queryParams.homeYard) {
      query.homeYard = queryParams.homeYard;
    }
    
    if (queryParams.reportingMarks) {
      query.reportingMarks = queryParams.reportingMarks;
    }
    
    return query;
  }

  /**
   * Transform car for movement operation
   * 
   * @param {Object} car - Car entity
   * @param {string} destination - Destination industry ID
   * @returns {Object} - Movement update object
   */
  static transformForMovement(car, destination) {
    return {
      currentIndustry: destination,
      sessionsAtCurrentLocation: 0,
      lastMoved: new Date()
    };
  }

  /**
   * Transform car statistics
   * 
   * @param {Array} cars - Array of cars
   * @returns {Object} - Car statistics
   */
  static transformStatistics(cars) {
    const total = cars.length;
    const inService = cars.filter(c => c.isInService).length;
    const outOfService = total - inService;
    
    const byType = cars.reduce((acc, car) => {
      acc[car.carType] = (acc[car.carType] || 0) + 1;
      return acc;
    }, {});
    
    const byLocation = cars.reduce((acc, car) => {
      if (car.currentIndustry) {
        acc[car.currentIndustry] = (acc[car.currentIndustry] || 0) + 1;
      }
      return acc;
    }, {});
    
    return {
      total,
      inService,
      outOfService,
      byType,
      byLocation,
      utilizationRate: total > 0 ? (inService / total * 100).toFixed(2) + '%' : '0%'
    };
  }
}
