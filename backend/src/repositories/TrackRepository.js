import { BaseRepository } from './BaseRepository.js';
import { NULL_TRACK } from '../patterns/nullObjects/NullTrack.js';

/**
 * Repository for Track entities
 */
export class TrackRepository extends BaseRepository {
  constructor() {
    super('tracks');
  }

  /**
   * Returns the null object for this repository
   * @returns {NullTrack} The null track object
   */
  getNullObject() {
    return NULL_TRACK;
  }

  /**
   * Find track by name
   * @param {string} name - Track name
   * @param {Object} options - Query options
   * @returns {Promise<Object|NullTrack>} Track or null object
   */
  async findByName(name, options = {}) {
    const tracks = await this.findBy({ name }, options);
    if (tracks.length === 0) {
      return options.useNullObject ? this.getNullObject() : null;
    }
    return tracks[0];
  }
}
