/**
 * Null Object implementation for Train
 * Represents a missing or non-existent train with safe default values
 */

import { BaseNullObject } from '../NullObject.js';

export class NullTrain extends BaseNullObject {
  constructor() {
    super();
    
    // Train interface with safe defaults
    this._id = '';
    this.name = 'Unknown Train';
    this.routeId = '';
    this.sessionNumber = 0;
    this.status = 'Planned';
    this.locomotiveIds = [];
    this.maxCapacity = 0;
    this.switchList = null;
    this.assignedCarIds = [];
    this.createdAt = new Date(0);
    this.updatedAt = new Date(0);
  }

  toString() {
    return 'NullTrain';
  }

  toJSON() {
    return {
      _id: this._id,
      name: this.name,
      routeId: this.routeId,
      sessionNumber: this.sessionNumber,
      status: this.status,
      maxCapacity: this.maxCapacity,
      isNull: true
    };
  }
}

// Singleton instance
export const NULL_TRAIN = new NullTrain();
