/**
 * Car Repository
 * Handles database operations for cars with null object support
 */

import { BaseRepository } from './BaseRepository.js';
import { NULL_CAR } from '../patterns/nullObjects/NullCar.js';

export class CarRepository extends BaseRepository {
  constructor() {
    super('cars');
  }

  /**
   * Get the null object for cars
   * @returns {NullCar} Null car instance
   */
  getNullObject() {
    return NULL_CAR;
  }

  /**
   * Find cars by reporting marks and number
   * @param {string} reportingMarks - Reporting marks
   * @param {string} reportingNumber - Reporting number
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Car or null
   */
  async findByReportingMarks(reportingMarks, reportingNumber, options = {}) {
    const cars = await this.findBy({ 
      reportingMarks, 
      reportingNumber 
    }, options);
    
    if (cars.length === 0) {
      return options.useNullObject ? this.getNullObject() : null;
    }
    
    return cars[0];
  }

  /**
   * Find cars by type
   * @param {string} carType - AAR type ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of cars
   */
  async findByType(carType, options = {}) {
    return this.findBy({ carType }, options);
  }

  /**
   * Find cars at a specific industry
   * @param {string} industryId - Industry ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of cars
   */
  async findByIndustry(industryId, options = {}) {
    return this.findBy({ currentIndustry: industryId }, options);
  }

  /**
   * Find cars in service
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of in-service cars
   */
  async findInService(options = {}) {
    return this.findBy({ isInService: true }, options);
  }

  /**
   * Find available cars by type (in service and not assigned)
   * @param {string} carType - AAR type ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of available cars
   */
  async findAvailableByType(carType, options = {}) {
    const allCars = await this.findAll();
    const availableCars = allCars.filter(car => 
      car.carType === carType && 
      car.isInService === true
    );
    
    if (options.enrich) {
      return await Promise.all(availableCars.map(car => this.enrich(car)));
    }
    
    return availableCars;
  }
}
