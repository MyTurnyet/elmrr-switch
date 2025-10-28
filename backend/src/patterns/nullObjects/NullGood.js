import { BaseNullObject } from '../NullObject.js';

/**
 * Null Object for Good entity
 * Represents a non-existent or invalid good
 */
export class NullGood extends BaseNullObject {
  constructor() {
    super();
    this._id = '';
    this.name = 'Unknown Good';
    this.description = '';
  }

  toString() {
    return 'NullGood';
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
export const NULL_GOOD = new NullGood();
