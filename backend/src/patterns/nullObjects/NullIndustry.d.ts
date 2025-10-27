/**
 * Type definitions for NullIndustry
 */

import { BaseNullObject, NullObject } from '../NullObject.js';
import { Industry } from '../../models/industry.js';

export declare class NullIndustry extends BaseNullObject implements Industry, NullObject {
  readonly _id: string;
  readonly name: string;
  readonly stationId: string;
  readonly goodsReceived: string[];
  readonly goodsToShip: string[];
  readonly preferredCarTypes: string[];
  readonly isYard: boolean;
  readonly isOnLayout: boolean;
  readonly carDemandConfig: any[];
  
  toString(): string;
  toJSON(): Partial<Industry> & { isNull: true };
}

export declare const NULL_INDUSTRY: NullIndustry;
