/**
 * Null Object Pattern Interface
 * 
 * Provides a base interface for null objects that represent missing or non-existent entities.
 * Null objects implement the same interface as real objects but with safe default values.
 * 
 * Benefits:
 * - Eliminates null checks throughout the codebase
 * - Prevents null pointer exceptions
 * - Provides polymorphic behavior
 * - Improves code readability
 */

/**
 * Check if an object is a null object
 * @param {any} obj - Object to check
 * @returns {boolean} - True if the object is a null object
 */
export function isNullObject(obj) {
  return obj !== null && obj !== undefined && obj.isNull === true && obj.isValid === false;
}

/**
 * Type guard to check if object is present (not a null object)
 * @param {any} obj - Object to check
 * @returns {boolean} - True if the object is present (not null)
 */
export function isPresent(obj) {
  return !isNullObject(obj);
}

/**
 * Base class for null objects
 * All null object implementations should extend this class
 */
export class BaseNullObject {
  constructor() {
    // Mark as null object
    this.isNull = true;
    this.isValid = false;
  }

  /**
   * Returns a string representation of the null object
   * @returns {string}
   */
  toString() {
    return `Null${this.constructor.name}`;
  }

  /**
   * Returns a JSON representation with minimal fields
   * @returns {Object}
   */
  toJSON() {
    return {
      _id: '',
      isNull: true
    };
  }
}
