/**
 * Null Object implementation for Locomotive
 * Represents a missing or non-existent locomotive with safe default values
 */

import { BaseNullObject } from '../NullObject.js';

export class NullLocomotive extends BaseNullObject {
  constructor() {
    super();

    // Locomotive interface with safe defaults
    this._id = '';
    this.reportingMarks = 'UNKNOWN';
    this.number = '0000';
    this.model = '';
    this.isInService = false;
  }

  toString() {
    return 'NullLocomotive';
  }

  toJSON() {
    return {
      _id: this._id,
      reportingMarks: this.reportingMarks,
      number: this.number,
      isInService: this.isInService,
      isNull: true
    };
  }
}

// Singleton instance
export const NULL_LOCOMOTIVE = new NullLocomotive();
