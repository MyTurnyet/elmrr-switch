/**
 * Station Repository
 * Handles database operations for stations with null object support
 */

import { BaseRepository } from './BaseRepository.js';
import { NULL_STATION } from '../patterns/nullObjects/NullStation.js';

export class StationRepository extends BaseRepository {
  constructor() {
    super('stations');
  }

  /**
   * Get the null object for stations
   * @returns {NullStation} Null station instance
   */
  getNullObject() {
    return NULL_STATION;
  }

  /**
   * Find station by name
   * @param {string} name - Station name
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Station or null
   */
  async findByName(name, options = {}) {
    const stations = await this.findBy({ name }, options);
    
    if (stations.length === 0) {
      return options.useNullObject ? this.getNullObject() : null;
    }
    
    return stations[0];
  }
}
