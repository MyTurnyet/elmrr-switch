/**
 * Industry Repository
 * Handles database operations for industries with null object support
 */

import { BaseRepository } from './BaseRepository.js';
import { NULL_INDUSTRY } from '../patterns/nullObjects/NullIndustry.js';

export class IndustryRepository extends BaseRepository {
  constructor() {
    super('industries');
  }

  /**
   * Get the null object for industries
   * @returns {NullIndustry} Null industry instance
   */
  getNullObject() {
    return NULL_INDUSTRY;
  }

  /**
   * Find industries at a specific station
   * @param {string} stationId - Station ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of industries
   */
  async findByStation(stationId, options = {}) {
    return this.findBy({ stationId }, options);
  }

  /**
   * Find yard industries
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of yard industries
   */
  async findYards(options = {}) {
    return this.findBy({ isYard: true }, options);
  }

  /**
   * Find industries on layout
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of on-layout industries
   */
  async findOnLayout(options = {}) {
    return this.findBy({ isOnLayout: true }, options);
  }

  /**
   * Find industries with car demand for a session
   * @param {number} sessionNumber - Session number
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of industries with active demand
   */
  async findWithDemandForSession(sessionNumber, options = {}) {
    const allIndustries = await this.findAll(options);
    
    return allIndustries.filter(industry => {
      if (!industry.carDemandConfig || industry.carDemandConfig.length === 0) {
        return false;
      }
      
      // Check if any demand config is active for this session
      return industry.carDemandConfig.some(config => 
        (sessionNumber % config.frequency) === 0
      );
    });
  }
}
