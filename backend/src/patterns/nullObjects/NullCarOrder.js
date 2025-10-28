/**
 * Null Object implementation for CarOrder
 * Represents a missing or non-existent car order with safe default values
 */

import { BaseNullObject } from '../NullObject.js';

export class NullCarOrder extends BaseNullObject {
  constructor() {
    super();
    
    // CarOrder interface with safe defaults
    this._id = '';
    this.industryId = '';
    this.aarTypeId = '';
    this.sessionNumber = 0;
    this.status = 'pending';
    this.assignedCarId = null;
    this.assignedTrainId = null;
    this.createdAt = new Date(0);
  }

  toString() {
    return 'NullCarOrder';
  }

  toJSON() {
    return {
      _id: this._id,
      industryId: this.industryId,
      aarTypeId: this.aarTypeId,
      sessionNumber: this.sessionNumber,
      status: this.status,
      isNull: true
    };
  }
}

// Singleton instance
export const NULL_CAR_ORDER = new NullCarOrder();
