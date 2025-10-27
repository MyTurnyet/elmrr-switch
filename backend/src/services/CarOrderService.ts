/**
 * Car Order Service - Handles complex car order business operations
 * Extracted from routes to improve testability and maintainability
 */

import { dbHelpers } from '../database/index.js';
import { 
  validateCarOrder, 
  validateOrderGeneration,
  createOrderGenerationSummary,
  validateCarAssignment,
  checkDuplicateOrder,
  validateStatusTransition
} from '../models/carOrder.js';
import { ApiError } from '../middleware/errorHandler.js';
import type { ITrainService, ISessionService, ICarOrderService } from '../types/index.js';

export class CarOrderService {
  constructor() {
    // Service can be extended with repository dependencies if needed
  }

  /**
   * Generate car orders for current session based on industry demand configuration
   * @param {Object} options - Generation options
   * @param {number} options.sessionNumber - Session number (optional, uses current if not provided)
   * @param {Array<string>} options.industryIds - Specific industry IDs to process (optional)
   * @param {boolean} options.force - Force generation even if orders exist (default: false)
   * @returns {Promise<Object>} Generation result with statistics
   */
  async generateOrders(options = {}) {
    const { error, value } = validateOrderGeneration(options);
    if (error) {
      throw new ApiError('Validation failed', 400, error.details.map(d => d.message));
    }

    // Get current session number if not provided
    let sessionNumber = value.sessionNumber;
    if (!sessionNumber) {
      const sessions = await dbHelpers.findAll('operatingSessions');
      const currentSession = sessions[0];
      if (!currentSession) {
        throw new ApiError('Cannot generate orders without an active operating session', 404);
      }
      sessionNumber = currentSession.currentSessionNumber;
    }

    // Get all industries with demand configuration
    const industries = await dbHelpers.findAll('industries');
    let industriesToProcess = industries.filter(industry => 
      industry.carDemandConfig && 
      industry.carDemandConfig.length > 0
    );

    // Filter by specific industries if requested
    if (value.industryIds && value.industryIds.length > 0) {
      industriesToProcess = industriesToProcess.filter(industry =>
        value.industryIds.includes(industry._id)
      );
    }

    const result = await this._processIndustryDemands(industriesToProcess, sessionNumber, value.force);

    return {
      sessionNumber,
      ordersGenerated: result.createdOrders.length,
      industriesProcessed: result.processedIndustries.length,
      summary: createOrderGenerationSummary(result.createdOrders, result.processedIndustries),
      orders: result.createdOrders
    };
  }

  /**
   * Get car orders with filtering and enrichment
   * @param {Object} filters - Filter options
   * @param {string} filters.industryId - Filter by industry ID
   * @param {string} filters.status - Filter by status
   * @param {number} filters.sessionNumber - Filter by session number
   * @param {string} filters.aarTypeId - Filter by AAR type ID
   * @param {string} filters.search - Search term for industry names and AAR types
   * @returns {Promise<Array>} Filtered car orders
   */
  async getOrdersWithFilters(filters: any = {}) {
    const { industryId, status, sessionNumber, aarTypeId, search } = filters;
    let query: any = {};

    if (industryId) query.industryId = industryId;
    if (status) query.status = status;
    if (sessionNumber) query.sessionNumber = parseInt(sessionNumber);
    if (aarTypeId) query.aarTypeId = aarTypeId;

    let carOrders = await dbHelpers.findByQuery('carOrders', query);

    // Apply search filter if provided (search in industry names)
    if (search) {
      const industries = await dbHelpers.findAll('industries');
      const industryMap = industries.reduce((map, industry) => {
        map[industry._id] = industry.name.toLowerCase();
        return map;
      }, {});

      const searchLower = search.toLowerCase();
      carOrders = carOrders.filter(order => {
        const industryName = industryMap[order.industryId] || '';
        return industryName.includes(searchLower) || 
               order.aarTypeId.toLowerCase().includes(searchLower);
      });
    }

    // Sort by creation date (newest first)
    carOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return carOrders;
  }

  /**
   * Get enriched car order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Enriched car order
   */
  async getEnrichedOrder(orderId) {
    const carOrder = await dbHelpers.findById('carOrders', orderId);
    if (!carOrder) {
      throw new ApiError('Car order not found', 404);
    }

    // Enrich with related data
    const [industry, car, train] = await Promise.all([
      dbHelpers.findById('industries', carOrder.industryId),
      carOrder.assignedCarId ? dbHelpers.findById('cars', carOrder.assignedCarId) : null,
      carOrder.assignedTrainId ? dbHelpers.findById('trains', carOrder.assignedTrainId) : null
    ]);

    return {
      ...carOrder,
      industry,
      assignedCar: car,
      assignedTrain: train
    };
  }

  /**
   * Create a new car order with validation
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    const { error, value } = validateCarOrder(orderData);
    if (error) {
      throw new ApiError('Validation failed', 400, error.details.map(d => d.message));
    }

    // Verify industry exists
    const industry = await dbHelpers.findById('industries', value.industryId);
    if (!industry) {
      throw new ApiError(`Industry with ID '${value.industryId}' does not exist`, 404);
    }

    // Verify AAR type exists
    const aarType = await dbHelpers.findById('aarTypes', value.aarTypeId);
    if (!aarType) {
      throw new ApiError(`AAR type with ID '${value.aarTypeId}' does not exist`, 404);
    }

    // Check for duplicate orders
    const duplicateCheck = await checkDuplicateOrder(value);
    if (duplicateCheck.isDuplicate) {
      throw new ApiError('Duplicate order detected', 400, duplicateCheck.message);
    }

    // Add timestamps
    const orderWithTimestamps = {
      ...value,
      createdAt: new Date().toISOString()
    };

    const newOrder = await dbHelpers.create('carOrders', orderWithTimestamps);
    return newOrder;
  }

  /**
   * Update a car order with validation
   * @param {string} orderId - Order ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated order
   */
  async updateOrder(orderId, updateData) {
    const existingOrder = await dbHelpers.findById('carOrders', orderId);
    if (!existingOrder) {
      throw new ApiError('Car order not found', 404);
    }

    // Validate status transition if status is being updated
    if (updateData.status && updateData.status !== existingOrder.status) {
      const transitionValidation = validateStatusTransition(existingOrder.status, updateData.status);
      if (!transitionValidation.valid) {
        throw new ApiError('Invalid status transition', 400, transitionValidation.error);
      }
    }

    // Validate car assignment if being updated
    if (updateData.assignedCarId) {
      const car = await dbHelpers.findById('cars', updateData.assignedCarId);
      const assignmentValidation = validateCarAssignment(existingOrder, car);
      if (!assignmentValidation.valid) {
        throw new ApiError('Invalid car assignment', 400, assignmentValidation.errors.join(', '));
      }
    }

    // Add update timestamp
    const updateWithTimestamp = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await dbHelpers.update('carOrders', orderId, updateWithTimestamp);
    const updatedOrder = await dbHelpers.findById('carOrders', orderId);
    return updatedOrder;
  }

  /**
   * Delete a car order with business rule validation
   * @param {string} orderId - Order ID
   * @returns {Promise<void>}
   */
  async deleteOrder(orderId) {
    const existingOrder = await dbHelpers.findById('carOrders', orderId);
    if (!existingOrder) {
      throw new ApiError('Car order not found', 404);
    }

    // Prevent deletion of assigned orders
    if (existingOrder.status === 'assigned' || existingOrder.status === 'in-transit') {
      throw new ApiError(
        `Cannot delete car order with status '${existingOrder.status}'. Only pending orders can be deleted.`, 
        400
      );
    }

    const deleted = await dbHelpers.delete('carOrders', orderId);
    if (deleted === 0) {
      throw new ApiError('Car order not found', 404);
    }
  }

  /**
   * Get order statistics and summaries
   * @param {number} sessionNumber - Session number (optional, uses current if not provided)
   * @returns {Promise<Object>} Order statistics
   */
  async getOrderStats(sessionNumber = null) {
    // Get session number if not provided
    if (!sessionNumber) {
      const sessions = await dbHelpers.findAll('operatingSessions');
      const currentSession = sessions[0];
      if (currentSession) {
        sessionNumber = currentSession.currentSessionNumber;
      }
    }

    const orders = sessionNumber 
      ? await dbHelpers.findByQuery('carOrders', { sessionNumber })
      : await dbHelpers.findAll('carOrders');

    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const ordersByAarType = orders.reduce((acc, order) => {
      acc[order.aarTypeId] = (acc[order.aarTypeId] || 0) + 1;
      return acc;
    }, {});

    return {
      totalOrders: orders.length,
      sessionNumber,
      ordersByStatus,
      ordersByAarType,
      pendingOrders: ordersByStatus.pending || 0,
      assignedOrders: ordersByStatus.assigned || 0,
      deliveredOrders: ordersByStatus.delivered || 0
    };
  }

  /**
   * Private method to process industry demands and create orders
   * @param {Array} industries - Industries to process
   * @param {number} sessionNumber - Session number
   * @param {boolean} force - Force generation even if orders exist
   * @returns {Promise<Object>} Processing result
   */
  async _processIndustryDemands(industries, sessionNumber, force = false) {
    const ordersToCreate = [];
    const processedIndustries = [];

    // Process each industry's demand configuration
    for (const industry of industries) {
      for (const demandConfig of industry.carDemandConfig) {
        // Check if demand should be generated this session
        const shouldGenerate = (sessionNumber % demandConfig.frequency) === 0;
        
        if (shouldGenerate) {
          // Check for existing pending orders unless force is true
          if (!force) {
            const existingOrders = await dbHelpers.findByQuery('carOrders', {
              industryId: industry._id,
              aarTypeId: demandConfig.aarTypeId,
              sessionNumber: sessionNumber,
              status: 'pending'
            });

            if (existingOrders.length > 0) {
              continue; // Skip if orders already exist
            }
          }

          // Create orders based on carsPerSession
          for (let i = 0; i < demandConfig.carsPerSession; i++) {
            ordersToCreate.push({
              industryId: industry._id,
              aarTypeId: demandConfig.aarTypeId,
              sessionNumber: sessionNumber,
              status: 'pending',
              assignedCarId: null,
              assignedTrainId: null,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      if (industry.carDemandConfig.length > 0) {
        processedIndustries.push({
          industryId: industry._id,
          industryName: industry.name,
          demandConfigs: industry.carDemandConfig.length
        });
      }
    }

    // Create all orders
    const createdOrders = [];
    for (const orderData of ordersToCreate) {
      try {
        const newOrder = await dbHelpers.create('carOrders', orderData);
        createdOrders.push(newOrder);
      } catch (createError) {
        console.error('Failed to create order:', createError);
        // Continue with other orders
      }
    }

    return {
      createdOrders,
      processedIndustries
    };
  }
}
