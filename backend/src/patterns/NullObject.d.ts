/**
 * Type definitions for Null Object Pattern
 */

/**
 * Null Object interface
 * Implement this interface on classes that represent null/missing objects
 */
export interface NullObject {
  readonly isNull: true;
  readonly isValid: false;
}

/**
 * Type helper to distinguish between real and null objects
 */
export type MaybeNull<T> = T | (T & NullObject);

/**
 * Check if an object is a null object
 */
export declare function isNullObject(obj: any): obj is NullObject;

/**
 * Type guard to check if object is present (not a null object)
 */
export declare function isPresent<T>(obj: T | (T & NullObject)): obj is T;

/**
 * Base class for null objects
 */
export declare class BaseNullObject implements NullObject {
  readonly isNull: true;
  readonly isValid: false;
  
  toString(): string;
  toJSON(): { _id: string; isNull: true };
}
