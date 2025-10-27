/**
 * Car Transformer
 * 
 * Transforms car entities between database representation and API responses.
 * Handles field selection, data enrichment, and consistent formatting.
 */

import { BaseTransformer } from './BaseTransformer.js';
import type { Car, TransformedCar, TransformOptions, QueryParams, Statistics } from '../types/index.js';

export class CarTransformer extends BaseTransformer<Car, TransformedCar> {
  /**
   * Transform a single car entity
   */
  transform(car: Car | null, options: TransformOptions = {}): any {
    if (!car) return null;
    
    const { view = 'default' } = options;
    
    // Sanitize internal fields
    const sanitized = BaseTransformer.sanitize(car);
    if (!sanitized) return null;
    
    // Base transformation
    const transformed: TransformedCar = {
      id: sanitized._id,
      reportingMarks: sanitized.reportingMarks,
      reportingNumber: sanitized.reportingNumber,
      carType: sanitized.carType,
      isInService: sanitized.isInService,
      currentIndustry: sanitized.currentIndustry,
      homeYard: sanitized.homeYard,
      sessionsAtCurrentLocation: sanitized.sessionsAtCurrentLocation,
      lastMoved: BaseTransformer.formatDate(sanitized.lastMoved) || ''
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
  private _transformForList(car: TransformedCar): any {
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
  private _transformForDetail(car: TransformedCar, raw: Car): TransformedCar {
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
  private _transformForExport(car: TransformedCar): any {
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
   */
  static buildFilterQuery(queryParams: QueryParams): Record<string, any> {
    const query: any = {};
    
    if (queryParams.carType) {
      query.carType = queryParams.carType;
    }
    
    if (queryParams.location) {
      query.currentIndustry = queryParams.location;
    }
    
    if (queryParams.isInService !== undefined) {
      query.isInService = queryParams.isInService === 'true';
    }
    
    if (queryParams.reportingMarks) {
      query.reportingMarks = queryParams.reportingMarks;
    }
    
    return query;
  }

  /**
   * Transform car for movement operation
   */
  static transformForMovement(car: Car, destination: string): Partial<Car> {
    return {
      currentIndustry: destination,
      sessionsAtCurrentLocation: 0,
      lastMoved: new Date()
    };
  }

  /**
   * Transform car statistics
   */
  static transformStatistics(cars: Car[]): Statistics {
    const total = cars.length;
    const inService = cars.filter(c => c.isInService).length;
    const outOfService = total - inService;
    
    const byType = cars.reduce((acc: Record<string, number>, car) => {
      acc[car.carType] = (acc[car.carType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byLocation = cars.reduce((acc: Record<string, number>, car) => {
      if (car.currentIndustry) {
        acc[car.currentIndustry] = (acc[car.currentIndustry] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
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
