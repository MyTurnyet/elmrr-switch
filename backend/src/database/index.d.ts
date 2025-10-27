/**
 * Type definitions for database module
 */

import Datastore from 'nedb';

export interface Collections {
  cars: Datastore;
  locomotives: Datastore;
  industries: Datastore;
  stations: Datastore;
  goods: Datastore;
  aarTypes: Datastore;
  blocks: Datastore;
  tracks: Datastore;
  trains: Datastore;
  routes: Datastore;
  operatingSessions: Datastore;
  carOrders: Datastore;
}

export type CollectionName = keyof Collections;

export interface DbHelpers {
  /**
   * Find all documents in a collection
   */
  findAll<T = any>(collection: CollectionName): Promise<T[]>;

  /**
   * Find a document by ID
   */
  findById<T = any>(collection: CollectionName, id: string): Promise<T | null>;

  /**
   * Find documents matching a query
   */
  findByQuery<T = any>(collection: CollectionName, query: Record<string, any>): Promise<T[]>;

  /**
   * Create a new document
   */
  create<T = any>(collection: CollectionName, data: any): Promise<T>;

  /**
   * Update a document by ID
   */
  update(collection: CollectionName, id: string, data: any): Promise<number>;

  /**
   * Delete a document by ID
   */
  delete(collection: CollectionName, id: string): Promise<number>;

  /**
   * Bulk insert documents
   */
  bulkInsert<T = any>(collection: CollectionName, dataArray: any[]): Promise<T[]>;

  /**
   * Clear all documents from a collection
   */
  clearCollection(collection: CollectionName): Promise<number>;
}

export declare const collections: Collections;
export declare const dbHelpers: DbHelpers;

export default collections;
