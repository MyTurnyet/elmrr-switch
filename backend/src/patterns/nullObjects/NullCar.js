/**
 * Null Object implementation for Car
 * Represents a missing or non-existent car with safe default values
 */

import { BaseNullObject } from '../NullObject.js';

export class NullCar extends BaseNullObject {
  constructor() {
    super();
    
    // Car interface with safe defaults
    this._id = '';
    this.reportingMarks = 'UNKNOWN';
    this.reportingNumber = '0000';
    this.carType = '';
    this.color = '';
    this.notes = '';
    this.currentLoad = '';
    this.homeYard = '';
    this.currentIndustry = '';
    this.isInService = false;
    this.lastMoved = new Date(0);
    this.sessionsAtCurrentLocation = 0;
  }

  toString() {
    return 'NullCar';
  }

  toJSON() {
    return {
      _id: this._id,
      reportingMarks: this.reportingMarks,
      reportingNumber: this.reportingNumber,
      carType: this.carType,
      isInService: this.isInService,
      isNull: true
    };
  }
}

// Singleton instance
export const NULL_CAR = new NullCar();
