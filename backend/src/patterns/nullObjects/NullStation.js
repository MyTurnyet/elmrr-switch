/**
 * Null Object implementation for Station
 * Represents a missing or non-existent station with safe default values
 */

import { BaseNullObject } from '../NullObject.js';

export class NullStation extends BaseNullObject {
  constructor() {
    super();

    // Station interface with safe defaults
    this._id = '';
    this.name = 'Unknown Station';
    this.description = '';
  }

  toString() {
    return 'NullStation';
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
export const NULL_STATION = new NullStation();
