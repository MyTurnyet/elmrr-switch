/**
 * Null Object Helper Utilities
 * 
 * Provides utility functions for working with null objects
 */

import { isNullObject, isPresent } from '../patterns/NullObject.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Throws an error if the object is a null object
 * Useful for required resources that must exist
 * 
 * @param {any} obj - Object to check
 * @param {string} errorMessage - Error message to throw
 * @param {number} statusCode - HTTP status code (default: 404)
 * @throws {ApiError} - If the object is a null object
 */
export function throwIfNull(obj, errorMessage, statusCode = 404) {
  if (isNullObject(obj)) {
    throw new ApiError(errorMessage, statusCode);
  }
}

/**
 * Returns the object if present, otherwise returns default value
 * 
 * @param {any} obj - Object to check
 * @param {any} defaultValue - Default value to return if null
 * @returns {any} - The object or default value
 */
export function getOrDefault(obj, defaultValue) {
  return isNullObject(obj) ? defaultValue : obj;
}

/**
 * Filters out null objects from an array
 * 
 * @param {Array} array - Array to filter
 * @returns {Array} - Array without null objects
 */
export function filterNullObjects(array) {
  return array.filter(item => isPresent(item));
}

/**
 * Checks if all objects in an array are present (not null objects)
 * 
 * @param {Array} array - Array to check
 * @returns {boolean} - True if all objects are present
 */
export function allPresent(array) {
  return array.every(item => isPresent(item));
}

/**
 * Checks if any objects in an array are null objects
 * 
 * @param {Array} array - Array to check
 * @returns {boolean} - True if any objects are null
 */
export function anyNull(array) {
  return array.some(item => isNullObject(item));
}

// Re-export for convenience
export { isNullObject, isPresent } from '../patterns/NullObject.js';
