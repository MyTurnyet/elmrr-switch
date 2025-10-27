/**
 * Null Object implementation for OperatingSession
 * Represents a missing or non-existent operating session with safe default values
 */

import { BaseNullObject } from '../NullObject.js';

export class NullOperatingSession extends BaseNullObject {
  constructor() {
    super();
    
    // OperatingSession interface with safe defaults
    this._id = '';
    this.currentSessionNumber = 0;
    this.sessionDate = new Date(0);
    this.description = '';
    this.previousSessionSnapshot = null;
  }

  toString() {
    return 'NullOperatingSession';
  }

  toJSON() {
    return {
      _id: this._id,
      currentSessionNumber: this.currentSessionNumber,
      sessionDate: this.sessionDate,
      description: this.description,
      isNull: true
    };
  }
}

// Singleton instance
export const NULL_OPERATING_SESSION = new NullOperatingSession();
