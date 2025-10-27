/**
 * Type definitions for NullCar
 */

import { BaseNullObject, NullObject } from '../NullObject.js';
import { Car } from '../../models/car.js';

export declare class NullCar extends BaseNullObject implements Car, NullObject {
  readonly _id: string;
  readonly reportingMarks: string;
  readonly reportingNumber: string;
  readonly carType: string;
  readonly color: string;
  readonly notes: string;
  readonly currentLoad: string;
  readonly homeYard: string;
  readonly currentIndustry: string;
  readonly isInService: boolean;
  readonly lastMoved: Date;
  readonly sessionsAtCurrentLocation: number;
  
  toString(): string;
  toJSON(): Partial<Car> & { isNull: true };
}

export declare const NULL_CAR: NullCar;
