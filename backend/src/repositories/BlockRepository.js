import { BaseRepository } from './BaseRepository.js';
import { NULL_BLOCK } from '../patterns/nullObjects/NullBlock.js';

/**
 * Repository for Block entities
 */
export class BlockRepository extends BaseRepository {
  constructor() {
    super('blocks');
  }

  /**
   * Returns the null object for this repository
   * @returns {NullBlock} The null block object
   */
  getNullObject() {
    return NULL_BLOCK;
  }

  /**
   * Find block by name
   * @param {string} name - Block name
   * @param {Object} options - Query options
   * @returns {Promise<Object|NullBlock>} Block or null object
   */
  async findByName(name, options = {}) {
    const blocks = await this.findBy({ name }, options);
    if (blocks.length === 0) {
      return options.useNullObject ? this.getNullObject() : null;
    }
    return blocks[0];
  }
}
