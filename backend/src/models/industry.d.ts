/**
 * Type definitions for industry model
 */

import Joi from 'joi';

export interface CarDemandConfig {
  aarTypeId: string;
  carsPerSession: number;
  frequency: number;
}

export interface Industry {
  _id?: string;
  name: string;
  stationId: string;
  goodsReceived: string[];
  goodsToShip: string[];
  preferredCarTypes: string[];
  isYard: boolean;
  isOnLayout: boolean;
  carDemandConfig: CarDemandConfig[];
}

export declare const carDemandConfigSchema: Joi.ObjectSchema<CarDemandConfig>;
export declare const industrySchema: Joi.ObjectSchema<Industry>;

export declare function validateIndustry(
  data: any,
  isUpdate?: boolean
): Joi.ValidationResult<Industry>;

export declare function validateCarDemandConfig(
  demandConfig: any
): { valid: boolean; errors: string[] };

export declare function calculateTotalDemand(
  demandConfig: CarDemandConfig[],
  sessionNumber: number
): number;

export declare function getActiveDemandForSession(
  demandConfig: CarDemandConfig[],
  sessionNumber: number
): CarDemandConfig[];

export declare function formatDemandConfig(
  demandConfig: CarDemandConfig[]
): string;
