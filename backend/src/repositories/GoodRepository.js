import { BaseRepository } from './BaseRepository.js';
import { NULL_GOOD } from '../patterns/nullObjects/NullGood.js';

/**
 * Repository for Good entities
 */
export class GoodRepository extends BaseRepository {
  constructor() {
    super('goods');
  }

  /**
   * Returns the null object for this repository
   * @returns {NullGood} The null good object
   */
  getNullObject() {
    return NULL_GOOD;
  }

  /**
   * Find good by name
   * @param {string} name - Good name
   * @param {Object} options - Query options
   * @returns {Promise<Object|NullGood>} Good or null object
   */
  async findByName(name, options = {}) {
    const goods = await this.findBy({ name }, options);
    if (goods.length === 0) {
      return options.useNullObject ? this.getNullObject() : null;
    }
    return goods[0];
  }
}
