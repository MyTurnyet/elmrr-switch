/**
 * Type definitions for null object helpers
 */

import { NullObject } from '../patterns/NullObject.js';

/**
 * Throws an error if the object is a null object
 */
export declare function throwIfNull<T>(
  obj: T | (T & NullObject),
  errorMessage: string,
  statusCode?: number
): asserts obj is T;

/**
 * Returns the object if present, otherwise returns default value
 */
export declare function getOrDefault<T>(
  obj: T | (T & NullObject),
  defaultValue: T
): T;

/**
 * Filters out null objects from an array
 */
export declare function filterNullObjects<T>(
  array: (T | (T & NullObject))[]
): T[];

/**
 * Checks if all objects in an array are present (not null objects)
 */
export declare function allPresent<T>(
  array: (T | (T & NullObject))[]
): boolean;

/**
 * Checks if any objects in an array are null objects
 */
export declare function anyNull<T>(
  array: (T | (T & NullObject))[]
): boolean;

// Re-exports
export { isNullObject, isPresent } from '../patterns/NullObject.js';
