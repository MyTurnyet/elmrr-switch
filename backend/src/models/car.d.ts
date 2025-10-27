/**
 * Type definitions for car model
 */

import Joi from 'joi';

export interface Car {
  _id?: string;
  reportingMarks: string;
  reportingNumber: string;
  carType: string;
  color: string;
  notes?: string;
  currentLoad?: string;
  homeYard: string;
  currentIndustry: string;
  isInService: boolean;
  lastMoved?: Date;
  sessionsAtCurrentLocation: number;
}

export declare const carSchema: Joi.ObjectSchema<Car>;

export declare function validateCar(
  data: any,
  isUpdate?: boolean
): Joi.ValidationResult<Car>;
