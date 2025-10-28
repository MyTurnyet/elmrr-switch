/**
 * OperatingSession Repository
 * Handles database operations for operating sessions with null object support
 */

import { BaseRepository } from './BaseRepository.js';
import { NULL_OPERATING_SESSION } from '../patterns/nullObjects/NullOperatingSession.js';

export class OperatingSessionRepository extends BaseRepository {
  constructor() {
    super('operatingSessions');
  }

  /**
   * Get the null object for operating sessions
   * @returns {NullOperatingSession} Null operating session instance
   */
  getNullObject() {
    return NULL_OPERATING_SESSION;
  }

  /**
   * Get the current session (singleton pattern)
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Current session or null
   */
  async getCurrent(options = {}) {
    const sessions = await this.findAll(options);
    
    if (sessions.length === 0) {
      return options.useNullObject ? this.getNullObject() : null;
    }
    
    // Should only be one session
    return sessions[0];
  }

  /**
   * Get the current session or return null object
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Current session or null object
   */
  async getCurrentOrNull(options = {}) {
    return this.getCurrent({ ...options, useNullObject: true });
  }

  /**
   * Alias for getCurrentOrNull for consistency with service layer
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Current session or null object
   */
  async getCurrentSession(options = {}) {
    return this.getCurrentOrNull(options);
  }
}
