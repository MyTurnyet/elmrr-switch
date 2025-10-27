/**
 * Locomotive Repository
 * Handles database operations for locomotives with null object support
 */

import { BaseRepository } from './BaseRepository.js';
import { NULL_LOCOMOTIVE } from '../patterns/nullObjects/NullLocomotive.js';

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
}
