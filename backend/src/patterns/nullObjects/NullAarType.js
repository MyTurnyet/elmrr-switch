/**
 * Null Object implementation for AarType
 * Represents a missing or non-existent AAR type with safe default values
 */

import { BaseNullObject } from '../NullObject.js';

export class NullAarType extends BaseNullObject {
  constructor() {
    super();

    // AarType interface with safe defaults
    this._id = '';
    this.code = 'UNKNOWN';
    this.description = 'Unknown AAR Type';
    this.category = '';
  }

  toString() {
    return 'NullAarType';
  }

  toJSON() {
    return {
      _id: this._id,
      code: this.code,
      description: this.description,
      isNull: true
    };
  }
}

// Singleton instance
export const NULL_AAR_TYPE = new NullAarType();
