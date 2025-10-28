/**
 * Type definitions for NullTrain
 */

import { BaseNullObject, NullObject } from '../NullObject.js';
import { Train } from '../../models/train.js';

export declare class NullTrain extends BaseNullObject implements Train, NullObject {
  readonly _id: string;
  readonly name: string;
  readonly routeId: string;
  readonly sessionNumber: number;
  readonly status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
  readonly locomotiveIds: string[];
  readonly maxCapacity: number;
  readonly switchList: null;
  readonly assignedCarIds: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  
  toString(): string;
  toJSON(): Partial<Train> & { isNull: true };
}

export declare const NULL_TRAIN: NullTrain;
