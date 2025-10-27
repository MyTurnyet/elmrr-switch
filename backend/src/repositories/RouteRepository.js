/**
 * Route Repository
 * Handles database operations for routes with null object support
 */

import { BaseRepository } from './BaseRepository.js';
import { NULL_ROUTE } from '../patterns/nullObjects/NullRoute.js';

export class RouteRepository extends BaseRepository {
  constructor() {
    super('routes');
  }

  /**
   * Get the null object for routes
   * @returns {NullRoute} Null route instance
   */
  getNullObject() {
    return NULL_ROUTE;
  }

  /**
   * Find routes by origin yard
   * @param {string} yardId - Yard ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of routes
   */
  async findByOriginYard(yardId, options = {}) {
    return this.findBy({ originYard: yardId }, options);
  }

  /**
   * Find routes by termination yard
   * @param {string} yardId - Yard ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of routes
   */
  async findByTerminationYard(yardId, options = {}) {
    return this.findBy({ terminationYard: yardId }, options);
  }

  /**
   * Find routes that include a specific station
   * @param {string} stationId - Station ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of routes
   */
  async findByStation(stationId, options = {}) {
    const allRoutes = await this.findAll(options);
    
    return allRoutes.filter(route => 
      route.stationSequence && route.stationSequence.includes(stationId)
    );
  }
}
