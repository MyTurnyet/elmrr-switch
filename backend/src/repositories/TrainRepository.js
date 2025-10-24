/**
 * Train Repository - Handles train data access and enrichment
 */

import { BaseRepository } from './BaseRepository.js';
import { dbHelpers } from '../database/index.js';
import { 
  validateTrain,
  validateTrainNameUniqueness,
  validateLocomotiveAssignments
} from '../models/train.js';
import { ApiError } from '../middleware/errorHandler.js';

export class TrainRepository extends BaseRepository {
  constructor() {
    super('trains');
  }

  /**
   * Enrich train document with related data
   * @param {Object} train - Train document to enrich
   * @returns {Promise<Object>} Enriched train document
   */
  async enrich(train) {
    if (!train) return null;

    try {
      // Fetch related data in parallel for better performance
      const [route, locomotives] = await Promise.all([
        // Get route information
        train.routeId ? dbHelpers.findById('routes', train.routeId) : null,
        // Get locomotive information
        train.locomotiveIds && train.locomotiveIds.length > 0
          ? Promise.all(train.locomotiveIds.map(id => dbHelpers.findById('locomotives', id)))
          : []
      ]);

      // Filter out any null locomotives (in case some IDs don't exist)
      const validLocomotives = locomotives.filter(Boolean);

      return {
        ...train,
        // Add route summary
        route: route ? {
          _id: route._id,
          name: route.name,
          description: route.description,
          originStationId: route.originStationId,
          terminationStationId: route.terminationStationId
        } : null,
        // Add locomotive summaries
        locomotives: validLocomotives.map(loco => ({
          _id: loco._id,
          roadNumber: loco.roadNumber,
          model: loco.model,
          status: loco.status
        })),
        // Add computed fields
        locomotiveCount: validLocomotives.length,
        hasValidRoute: route !== null,
        capacityUsage: train.assignedCarIds ? train.assignedCarIds.length : 0
      };
    } catch (error) {
      // If enrichment fails, log the error but return the original document
      console.error(`Failed to enrich train ${train._id}:`, error);
      return train;
    }
  }

  /**
   * Validate train data
   * @param {Object} data - Train data to validate
   * @param {string} operation - Operation type ('create', 'update')
   * @returns {Promise<Object>} Validated data
   */
  async validate(data, operation = 'create') {
    const { error, value } = validateTrain(data);
    
    if (error) {
      throw new ApiError(`Validation failed: ${error.details.map(d => d.message).join(', ')}`, 400);
    }

    // Additional business logic validation
    if (operation === 'create' || data.routeId) {
      // Verify route exists
      if (data.routeId) {
        const route = await dbHelpers.findById('routes', data.routeId);
        if (!route) {
          throw new ApiError(`Route with ID ${data.routeId} not found`, 404);
        }
      }
    }

    // Verify locomotives exist and are in service
    if (data.locomotiveIds && data.locomotiveIds.length > 0) {
      const locomotives = [];
      for (const locoId of data.locomotiveIds) {
        const locomotive = await dbHelpers.findById('locomotives', locoId);
        if (!locomotive) {
          throw new ApiError(`Locomotive with ID '${locoId}' does not exist`, 404);
        }
        if (!locomotive.isInService) {
          throw new ApiError(`Locomotive '${locomotive.reportingMarks}' is not in service`, 400);
        }
        locomotives.push(locomotive);
      }
    }

    // Check train name uniqueness within session (for create operations)
    if (operation === 'create' && data.name && data.sessionNumber) {
      const allTrains = await this.findAll();
      const nameValidation = validateTrainNameUniqueness(allTrains, data.name, data.sessionNumber);
      if (!nameValidation.valid) {
        throw new ApiError(`A train named '${data.name}' already exists in session ${data.sessionNumber}`, 409);
      }
    }

    // Check locomotive assignment conflicts
    if (data.locomotiveIds && data.locomotiveIds.length > 0) {
      const allTrains = await this.findAll();
      const locoValidation = validateLocomotiveAssignments(allTrains, data.locomotiveIds);
      if (!locoValidation.valid) {
        const conflicts = locoValidation.conflicts.map(c => 
          `Locomotive ${c.locomotiveId} is assigned to train '${c.conflictingTrains[0].name}'`
        ).join(', ');
        throw new ApiError('Locomotive assignment conflict', 409, [conflicts]);
      }
    }

    return value;
  }

  /**
   * Find trains by session number
   * @param {number} sessionNumber - Session number
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of trains
   */
  async findBySession(sessionNumber, options = {}) {
    return await this.findBy({ sessionNumber }, options);
  }

  /**
   * Find trains by status
   * @param {string} status - Train status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of trains
   */
  async findByStatus(status, options = {}) {
    return await this.findBy({ status }, options);
  }

  /**
   * Find trains by route
   * @param {string} routeId - Route ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of trains
   */
  async findByRoute(routeId, options = {}) {
    return await this.findBy({ routeId }, options);
  }

  /**
   * Find trains with filters and search
   * @param {Object} filters - Filter criteria
   * @param {string} filters.sessionNumber - Session number
   * @param {string} filters.status - Train status
   * @param {string} filters.routeId - Route ID
   * @param {string} filters.search - Search term for name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of filtered trains
   */
  async findWithFilters(filters = {}, options = {}) {
    let trains = await this.findAll();

    // Apply filters
    if (filters.sessionNumber !== undefined) {
      trains = trains.filter(train => train.sessionNumber === parseInt(filters.sessionNumber));
    }

    if (filters.status) {
      trains = trains.filter(train => train.status === filters.status);
    }

    if (filters.routeId) {
      trains = trains.filter(train => train.routeId === filters.routeId);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      trains = trains.filter(train => 
        train.name.toLowerCase().includes(searchTerm)
      );
    }

    // Enrich if requested
    if (options.enrich) {
      trains = await Promise.all(trains.map(train => this.enrich(train)));
    }

    return trains;
  }

  /**
   * Get trains statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    const baseStats = await super.getStats();
    
    const trains = await this.findAll();
    const statusCounts = trains.reduce((acc, train) => {
      acc[train.status] = (acc[train.status] || 0) + 1;
      return acc;
    }, {});

    return {
      ...baseStats,
      statusBreakdown: statusCounts,
      totalCapacity: trains.reduce((sum, train) => sum + (train.maxCapacity || 0), 0),
      averageCapacity: trains.length > 0 
        ? trains.reduce((sum, train) => sum + (train.maxCapacity || 0), 0) / trains.length 
        : 0
    };
  }

  /**
   * Create train with validation and enrichment
   * @param {Object} trainData - Train data
   * @returns {Promise<Object>} Created and enriched train
   */
  async createTrain(trainData) {
    const validatedData = await this.validate(trainData, 'create');
    const train = await this.create(validatedData);
    return await this.enrich(train);
  }

  /**
   * Update train with validation and enrichment
   * @param {string} id - Train ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated and enriched train
   */
  async updateTrain(id, updateData) {
    const validatedData = await this.validate(updateData, 'update');
    const train = await this.update(id, validatedData);
    
    if (!train) {
      return null;
    }
    
    return await this.enrich(train);
  }
}
