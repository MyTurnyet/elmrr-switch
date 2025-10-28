import { BaseNullObject } from '../NullObject.js';

/**
 * Null Object for Track entity
 * Represents a non-existent or invalid track
 */
export class NullTrack extends BaseNullObject {
  constructor() {
    super();
    this._id = '';
    this.name = 'Unknown Track';
    this.description = '';
  }

  toString() {
    return 'NullTrack';
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
export const NULL_TRACK = new NullTrack();
