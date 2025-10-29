/**
 * Locomotive Repository
 * Handles database operations for locomotives with validation, enrichment, and business logic
 */

import { BaseRepository } from './BaseRepository.js';
import { NULL_LOCOMOTIVE } from '../patterns/nullObjects/NullLocomotive.js';
import { dbHelpers } from '../database/index.js';
import { 
  validateLocomotive,
  validateLocomotiveUniqueness,
  validateDccAddressUniqueness,
  formatLocomotiveSummary,
  formatDccAddress,
  getValidManufacturers
} from '../models/locomotive.js';
import { ApiError } from '../middleware/errorHandler.js';

export class LocomotiveRepository extends BaseRepository {
  constructor() {
    super('locomotives');
  }

  /**
   * Get the null object for locomotives
   * @returns {NullLocomotive} Null locomotive instance
   */
  getNullObject() {
    return NULL_LOCOMOTIVE;
  }

  /**
   * Enrich locomotive document with related data
   * @param {Object} locomotive - Locomotive document to enrich
   * @returns {Promise<Object>} Enriched locomotive document
   */
  async enrich(locomotive) {
    if (!locomotive) return null;

    try {
      // Fetch home yard information
      const homeYard = locomotive.homeYard 
        ? await dbHelpers.findById('industries', locomotive.homeYard)
        : null;

      return {
        ...locomotive,
        // Add home yard details
        homeYardDetails: homeYard ? {
          _id: homeYard._id,
          name: homeYard.name,
          stationId: homeYard.stationId,
          isYard: homeYard.isYard,
          isOnLayout: homeYard.isOnLayout
        } : null,
        // Add formatted display fields
        displayName: `${locomotive.reportingMarks} ${locomotive.reportingNumber}`,
        dccAddressFormatted: locomotive.isDCC ? formatDccAddress(locomotive.dccAddress) : null,
        // Add computed status
        statusText: locomotive.isInService ? 'In Service' : 'Out of Service',
        dccStatusText: locomotive.isDCC 
          ? `DCC (${formatDccAddress(locomotive.dccAddress)})`
          : 'DC'
      };
    } catch (error) {
      // If enrichment fails, log the error but return the original document
      console.error(`Failed to enrich locomotive ${locomotive._id}:`, error);
      return locomotive;
    }
  }

  /**
   * Validate locomotive data
   * @param {Object} data - Locomotive data to validate
   * @param {string} operation - Operation type ('create', 'update')
   * @param {string} excludeId - ID to exclude from uniqueness checks (for updates)
   * @returns {Promise<Object>} Validated data
   */
  async validate(data, operation = 'create', excludeId = null) {
    // Schema validation
    const { error, value } = validateLocomotive(data, operation === 'update');
    
    if (error) {
      throw new ApiError(`Validation failed: ${error.details.map(d => d.message).join(', ')}`, 400);
    }

    // Business logic validation for create and update operations
    if (operation === 'create' || operation === 'update') {
      const allLocomotives = await this.findAll();

      // Check reporting marks + number uniqueness
      if (data.reportingMarks && data.reportingNumber) {
        const uniquenessCheck = validateLocomotiveUniqueness(
          allLocomotives,
          data.reportingMarks,
          data.reportingNumber,
          excludeId
        );
        
        if (!uniquenessCheck.valid) {
          const duplicate = uniquenessCheck.duplicateLocomotives[0];
          throw new ApiError(
            `A locomotive with reporting marks '${data.reportingMarks}' and number '${data.reportingNumber}' already exists (ID: ${duplicate._id})`,
            409
          );
        }
      }

      // Check DCC address uniqueness (only if DCC is enabled)
      if (data.isDCC && data.dccAddress) {
        const dccCheck = validateDccAddressUniqueness(
          allLocomotives,
          data.dccAddress,
          excludeId
        );
        
        if (!dccCheck.valid) {
          const conflict = dccCheck.conflictingLocomotives[0];
          throw new ApiError(
            `DCC address ${data.dccAddress} is already assigned to locomotive '${conflict.reportingMarks} ${conflict.reportingNumber}' (ID: ${conflict._id})`,
            409
          );
        }
      }

      // Verify home yard exists and is a yard on the layout
      if (data.homeYard) {
        const homeYard = await dbHelpers.findById('industries', data.homeYard);
        if (!homeYard) {
          throw new ApiError(`Home yard with ID '${data.homeYard}' does not exist`, 404);
        }
        if (!homeYard.isYard) {
          throw new ApiError(`Industry '${homeYard.name}' is not a yard`, 400);
        }
        if (!homeYard.isOnLayout) {
          throw new ApiError(`Yard '${homeYard.name}' is not on the layout`, 400);
        }
      }

      // Validate manufacturer is in approved list
      if (data.manufacturer) {
        const validManufacturers = getValidManufacturers();
        if (!validManufacturers.includes(data.manufacturer)) {
          throw new ApiError(
            `Invalid manufacturer '${data.manufacturer}'. Must be one of: ${validManufacturers.join(', ')}`,
            400
          );
        }
      }
    }

    return value;
  }

  /**
   * Find locomotives by reporting marks
   * @param {string} reportingMarks - Reporting marks
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of locomotives
   */
  async findByReportingMarks(reportingMarks, options = {}) {
    return this.findBy({ reportingMarks }, options);
  }

  /**
   * Find in-service locomotives
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of in-service locomotives
   */
  async findInService(options = {}) {
    return this.findBy({ isInService: true }, options);
  }

  /**
   * Find available locomotives (in service and not assigned to active trains)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of available locomotives
   */
  async findAvailable(options = {}) {
    const inServiceLocomotives = await this.findInService(options);
    
    // Get all active trains (Planned or In Progress)
    const activeTrains = await dbHelpers.find('trains', {
      status: { $in: ['Planned', 'In Progress'] }
    });

    // Get all assigned locomotive IDs
    const assignedLocoIds = new Set();
    activeTrains.forEach(train => {
      if (train.locomotiveIds && Array.isArray(train.locomotiveIds)) {
        train.locomotiveIds.forEach(id => assignedLocoIds.add(id));
      }
    });

    // Filter out assigned locomotives
    return inServiceLocomotives.filter(loco => !assignedLocoIds.has(loco._id));
  }

  /**
   * Find locomotives by manufacturer
   * @param {string} manufacturer - Manufacturer name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of locomotives
   */
  async findByManufacturer(manufacturer, options = {}) {
    return this.findBy({ manufacturer }, options);
  }

  /**
   * Find locomotives by model
   * @param {string} model - Model name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of locomotives
   */
  async findByModel(model, options = {}) {
    return this.findBy({ model }, options);
  }

  /**
   * Check if locomotive is assigned to any active trains
   * @param {string} locomotiveId - Locomotive ID
   * @returns {Promise<Object>} Assignment status and train details
   */
  async checkTrainAssignments(locomotiveId) {
    const activeTrains = await dbHelpers.findByQuery('trains', {
      status: { $in: ['Planned', 'In Progress'] },
      locomotiveIds: locomotiveId
    });

    return {
      isAssigned: activeTrains.length > 0,
      trainCount: activeTrains.length,
      trains: activeTrains.map(train => ({
        _id: train._id,
        name: train.name,
        status: train.status,
        sessionNumber: train.sessionNumber
      }))
    };
  }

  /**
   * Get locomotive statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    const locomotives = await this.findAll();
    
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
