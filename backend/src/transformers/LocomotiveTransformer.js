/**
 * Locomotive Transformer
 * 
 * Transforms locomotive entities between database representation and API responses.
 * Handles DCC address formatting, field selection, and consistent formatting.
 */

import { BaseTransformer } from './BaseTransformer.js';
import { formatDccAddress } from '../models/locomotive.js';

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
      reportingMarks: sanitized.reportingMarks,
      reportingNumber: sanitized.reportingNumber,
      model: sanitized.model,
      manufacturer: sanitized.manufacturer,
      isDCC: sanitized.isDCC,
      dccAddress: sanitized.dccAddress,
      dccAddressFormatted: sanitized.isDCC ? formatDccAddress(sanitized.dccAddress) : null,
      homeYard: sanitized.homeYard,
      isInService: sanitized.isInService,
      notes: sanitized.notes || ''
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
      reportingMarks: locomotive.reportingMarks,
      reportingNumber: locomotive.reportingNumber,
      model: locomotive.model,
      manufacturer: locomotive.manufacturer,
      isDCC: locomotive.isDCC,
      dccAddressFormatted: locomotive.dccAddressFormatted,
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
      fullDesignation: `${locomotive.reportingMarks} ${locomotive.reportingNumber}`,
      displayName: `${locomotive.reportingMarks} ${locomotive.reportingNumber}`,
      status: locomotive.isInService ? 'In Service' : 'Out of Service',
      dccStatus: locomotive.isDCC ? `DCC (${locomotive.dccAddressFormatted})` : 'DC'
    };
  }

  /**
   * Transform for export (flat structure)
   * @private
   */
  _transformForExport(locomotive) {
    const exported = {
      ID: locomotive.id,
      'Reporting Marks': locomotive.reportingMarks,
      'Reporting Number': locomotive.reportingNumber,
      Model: locomotive.model,
      Manufacturer: locomotive.manufacturer,
      'DCC Enabled': locomotive.isDCC ? 'Yes' : 'No',
      'Home Yard': locomotive.homeYard,
      'In Service': locomotive.isInService ? 'Yes' : 'No'
    };
    
    if (locomotive.isDCC && locomotive.dccAddress) {
      exported['DCC Address'] = locomotive.dccAddressFormatted;
    }
    
    if (locomotive.notes) {
      exported['Notes'] = locomotive.notes;
    }
    
    return exported;
  }

  /**
   * Build filter query from request parameters
   * 
   * @param {Object} queryParams - Query parameters
   * @returns {Object} - Database query object
   */
  static buildFilterQuery(queryParams) {
    const query = {};
    
    if (queryParams.manufacturer) {
      query.manufacturer = queryParams.manufacturer;
    }
    
    if (queryParams.model) {
      query.model = queryParams.model;
    }
    
    if (queryParams.homeYard) {
      query.homeYard = queryParams.homeYard;
    }
    
    if (queryParams.isInService !== undefined) {
      query.isInService = queryParams.isInService === 'true' || queryParams.isInService === true;
    }
    
    if (queryParams.isDCC !== undefined) {
      query.isDCC = queryParams.isDCC === 'true' || queryParams.isDCC === true;
    }
    
    // Search by reporting marks or number
    if (queryParams.search) {
      query.$or = [
        { reportingMarks: new RegExp(queryParams.search, 'i') },
        { reportingNumber: new RegExp(queryParams.search, 'i') },
        { model: new RegExp(queryParams.search, 'i') }
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
    const dccEnabled = locomotives.filter(l => l.isDCC).length;
    const dcOnly = total - dccEnabled;
    
    const byManufacturer = locomotives.reduce((acc, loco) => {
      acc[loco.manufacturer] = (acc[loco.manufacturer] || 0) + 1;
      return acc;
    }, {});
    
    const byModel = locomotives.reduce((acc, loco) => {
      acc[loco.model] = (acc[loco.model] || 0) + 1;
      return acc;
    }, {});
    
    const byHomeYard = locomotives.reduce((acc, loco) => {
      if (loco.homeYard) {
        acc[loco.homeYard] = (acc[loco.homeYard] || 0) + 1;
      }
      return acc;
    }, {});
    
    return {
      total,
      inService,
      outOfService,
      dccEnabled,
      dcOnly,
      byManufacturer,
      byModel,
      byHomeYard,
      availabilityRate: total > 0 ? ((inService / total) * 100).toFixed(1) + '%' : '0%',
      dccRate: total > 0 ? ((dccEnabled / total) * 100).toFixed(1) + '%' : '0%'
    };
  }
}
