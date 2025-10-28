/**
 * CarOrder Repository
 * Handles database operations for car orders with null object support
 */

import { BaseRepository } from './BaseRepository.js';
import { NULL_CAR_ORDER } from '../patterns/nullObjects/NullCarOrder.js';

export class CarOrderRepository extends BaseRepository {
  constructor() {
    super('carOrders');
  }

  /**
   * Get the null object for car orders
   * @returns {NullCarOrder} Null car order instance
   */
  getNullObject() {
    return NULL_CAR_ORDER;
  }

  /**
   * Find orders by session number
   * @param {number} sessionNumber - Session number
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of orders
   */
  async findBySession(sessionNumber, options = {}) {
    return this.findBy({ sessionNumber }, options);
  }

  /**
   * Find orders by status
   * @param {string} status - Order status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of orders
   */
  async findByStatus(status, options = {}) {
    return this.findBy({ status }, options);
  }

  /**
   * Find orders by industry
   * @param {string} industryId - Industry ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of orders
   */
  async findByIndustry(industryId, options = {}) {
    return this.findBy({ industryId }, options);
  }

  /**
   * Find pending orders for a session
   * @param {number} sessionNumber - Session number
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of pending orders
   */
  async findPendingForSession(sessionNumber, options = {}) {
    return this.findBy({ 
      sessionNumber, 
      status: 'pending' 
    }, options);
  }

  /**
   * Find orders assigned to a train
   * @param {string} trainId - Train ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of orders
   */
  async findByTrain(trainId, options = {}) {
    return this.findBy({ assignedTrainId: trainId }, options);
  }
}
