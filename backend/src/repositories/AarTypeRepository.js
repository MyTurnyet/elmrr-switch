/**
 * AAR Type Repository - Handles AAR type data access
 */

import { BaseRepository } from './BaseRepository.js';
import { ApiError } from '../middleware/errorHandler.js';
import { NULL_AAR_TYPE } from '../patterns/nullObjects/NullAarType.js';

export class AarTypeRepository extends BaseRepository {
  constructor() {
    super('aarTypes');
  }

  /**
   * Get the null object for AAR types
   * @returns {NullAarType} Null AAR type instance
   */
  getNullObject() {
    return NULL_AAR_TYPE;
  }

  /**
   * Validate AAR type data
   * @param {Object} data - AAR type data to validate
   * @param {string} operation - Operation type ('create', 'update')
   * @returns {Promise<Object>} Validated data
   */
  async validate(data, operation = 'create') {
    // For now, return data as-is since there's no specific AAR type validation model
    // This can be enhanced later when the validation model is created
    return data;
  }

  /**
   * Find AAR types by category
   * @param {string} category - AAR type category
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of AAR types
   */
  async findByCategory(category, options = {}) {
    return await this.findBy({ category }, options);
  }

  /**
   * Find AAR type by code
   * @param {string} code - AAR type code
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} AAR type or null
   */
  async findByCode(code, options = {}) {
    const aarTypes = await this.findBy({ code }, options);
    return aarTypes.length > 0 ? aarTypes[0] : null;
  }

  /**
   * Get AAR types statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    const baseStats = await super.getStats();
    
    const aarTypes = await this.findAll();
    const categoryCounts = aarTypes.reduce((acc, aarType) => {
      acc[aarType.category] = (acc[aarType.category] || 0) + 1;
      return acc;
    }, {});

    return {
      ...baseStats,
      categoryBreakdown: categoryCounts,
      averageLength: aarTypes.length > 0 
        ? aarTypes.reduce((sum, aarType) => sum + (aarType.length || 0), 0) / aarTypes.length 
        : 0,
      averageCapacity: aarTypes.length > 0 
        ? aarTypes.reduce((sum, aarType) => sum + (aarType.capacity || 0), 0) / aarTypes.length 
        : 0
    };
  }
}
