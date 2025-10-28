/**
 * Null Object implementation for Route
 * Represents a missing or non-existent route with safe default values
 */

import { BaseNullObject } from '../NullObject.js';

export class NullRoute extends BaseNullObject {
  constructor() {
    super();
    
    // Route interface with safe defaults
    this._id = '';
    this.name = 'Unknown Route';
    this.description = '';
    this.originYard = '';
    this.terminationYard = '';
    this.stationSequence = [];
  }

  toString() {
    return 'NullRoute';
  }

  toJSON() {
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      originYard: this.originYard,
      terminationYard: this.terminationYard,
      isNull: true
    };
  }
}

// Singleton instance
export const NULL_ROUTE = new NullRoute();
