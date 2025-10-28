/**
 * Base Repository class providing common database operations
 * Implements the Repository pattern to abstract data access logic
 */

import { dbHelpers } from '../database/index.js';
import { ApiError } from '../middleware/errorHandler.js';

export class BaseRepository {
  /**
   * Create a new repository instance
   * @param {string} collectionName - Name of the database collection
   */
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  /**
   * Find all documents in the collection
   * @param {Object} options - Query options
   * @param {boolean} options.enrich - Whether to enrich the results
   * @returns {Promise<Array>} Array of documents
   */
  async findAll(options = {}) {
    const documents = await dbHelpers.findAll(this.collectionName);
    
    if (options.enrich) {
      return await Promise.all(documents.map(doc => this.enrich(doc)));
    }
    
    return documents;
  }

  /**
   * Find a document by ID
   * @param {string} id - Document ID
   * @param {Object} options - Query options
   * @param {boolean} options.enrich - Whether to enrich the result
   * @param {boolean} options.useNullObject - Return null object instead of null
   * @returns {Promise<Object|null>} Document or null if not found
   */
  async findById(id, options = {}) {
    const document = await dbHelpers.findById(this.collectionName, id);
    
    if (!document) {
      return options.useNullObject ? this.getNullObject() : null;
    }
    
    if (options.enrich) {
      return await this.enrich(document);
    }
    
    return document;
  }

  /**
   * Find a document by ID or return null object
   * Convenience method that always returns a null object instead of null
   * @param {string} id - Document ID
   * @param {Object} options - Query options
   * @param {boolean} options.enrich - Whether to enrich the result
   * @returns {Promise<Object>} Document or null object
   */
  async findByIdOrNull(id, options = {}) {
    return this.findById(id, { ...options, useNullObject: true });
  }

  /**
   * Find documents matching criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @param {boolean} options.enrich - Whether to enrich the results
   * @returns {Promise<Array>} Array of matching documents
   */
  async findBy(criteria, options = {}) {
    const documents = await dbHelpers.findBy(this.collectionName, criteria);
    
    if (options.enrich) {
      return await Promise.all(documents.map(doc => this.enrich(doc)));
    }
    
    return documents;
  }

  /**
   * Create a new document
   * @param {Object} data - Document data
   * @param {Object} options - Creation options
   * @param {boolean} options.enrich - Whether to enrich the result
   * @returns {Promise<Object>} Created document
   */
  async create(data, options = {}) {
    const document = await dbHelpers.create(this.collectionName, data);
    
    if (options.enrich) {
      return await this.enrich(document);
    }
    
    return document;
  }

  /**
   * Update a document by ID
   * @param {string} id - Document ID
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @param {boolean} options.enrich - Whether to enrich the result
   * @returns {Promise<Object|null>} Updated document or null if not found
   */
  async update(id, data, options = {}) {
    const numReplaced = await dbHelpers.update(this.collectionName, id, data);
    
    if (numReplaced === 0) {
      return null;
    }
    
    // Fetch the updated document
    const document = await dbHelpers.findById(this.collectionName, id);
    
    if (options.enrich) {
      return await this.enrich(document);
    }
    
    return document;
  }

  /**
   * Delete a document by ID
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    return await dbHelpers.delete(this.collectionName, id);
  }

  /**
   * Count documents in the collection
   * @param {Object} criteria - Optional search criteria
   * @returns {Promise<number>} Number of documents
   */
  async count(criteria = {}) {
    if (Object.keys(criteria).length === 0) {
      const documents = await dbHelpers.findAll(this.collectionName);
      return documents.length;
    }
    
    const documents = await dbHelpers.findBy(this.collectionName, criteria);
    return documents.length;
  }

  /**
   * Check if a document exists by ID
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} True if exists, false otherwise
   */
  async exists(id) {
    const document = await dbHelpers.findById(this.collectionName, id);
    return document !== null;
  }

  /**
   * Bulk insert documents
   * @param {Array} documents - Array of documents to insert
   * @returns {Promise<Array>} Array of created documents
   */
  async bulkInsert(documents) {
    return await dbHelpers.bulkInsert(this.collectionName, documents);
  }

  /**
   * Bulk update documents
   * @param {Array} updates - Array of {id, data} objects
   * @returns {Promise<Array>} Array of updated documents
   */
  async bulkUpdate(updates) {
    return await dbHelpers.bulkUpdate(this.collectionName, updates);
  }

  /**
   * Enrich a document with related data
   * Override this method in subclasses to provide specific enrichment logic
   * @param {Object} document - Document to enrich
   * @returns {Promise<Object>} Enriched document
   */
  async enrich(document) {
    // Base implementation returns document unchanged
    // Subclasses should override this method
    return document;
  }

  /**
   * Validate document data before operations
   * Override this method in subclasses to provide specific validation
   * @param {Object} data - Data to validate
   * @param {string} operation - Operation type ('create', 'update')
   * @returns {Promise<Object>} Validated data
   * @throws {ApiError} If validation fails
   */
  async validate(data, operation = 'create') {
    // Base implementation returns data unchanged
    // Subclasses should override this method
    return data;
  }

  /**
   * Get repository statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    const total = await this.count();
    return {
      collectionName: this.collectionName,
      totalDocuments: total,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get the null object for this repository
   * Override this method in subclasses to provide specific null objects
   * @returns {Object} Null object instance
   * @throws {Error} If not implemented in subclass
   */
  getNullObject() {
    throw new Error(`getNullObject() must be implemented in ${this.constructor.name}`);
  }
}
