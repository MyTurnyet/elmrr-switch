import { BaseNullObject } from '../NullObject.js';

/**
 * Null Object for Block entity
 * Represents a non-existent or invalid block
 */
export class NullBlock extends BaseNullObject {
  constructor() {
    super();
    this._id = '';
    this.name = 'Unknown Block';
    this.description = '';
  }

  toString() {
    return 'NullBlock';
  }

  toJSON() {
    return {
      _id: this._id,
      name: this.name,
      isNull: true
    };
  }
}

// Singleton instance
export const NULL_BLOCK = new NullBlock();
