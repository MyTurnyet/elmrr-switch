/**
 * Null Object implementation for Industry
 * Represents a missing or non-existent industry with safe default values
 */

import { BaseNullObject } from '../NullObject.js';

export class NullIndustry extends BaseNullObject {
  constructor() {
    super();
    
    // Industry interface with safe defaults
    this._id = '';
    this.name = 'Unknown Industry';
    this.stationId = '';
    this.goodsReceived = [];
    this.goodsToShip = [];
    this.preferredCarTypes = [];
    this.isYard = false;
    this.isOnLayout = false;
    this.carDemandConfig = [];
  }

  toString() {
    return 'NullIndustry';
  }

  toJSON() {
    return {
      _id: this._id,
      name: this.name,
      stationId: this.stationId,
      isYard: this.isYard,
      isOnLayout: this.isOnLayout,
      isNull: true
    };
  }
}

// Singleton instance
export const NULL_INDUSTRY = new NullIndustry();
