/**
 * Type definitions for NullCarOrder
 */

import { BaseNullObject, NullObject } from '../NullObject.js';
import { CarOrder } from '../../models/carOrder.js';

export declare class NullCarOrder extends BaseNullObject implements CarOrder, NullObject {
  readonly _id: string;
  readonly industryId: string;
  readonly aarTypeId: string;
  readonly sessionNumber: number;
  readonly status: 'pending' | 'assigned' | 'in-transit' | 'delivered';
  readonly assignedCarId: string | null;
  readonly assignedTrainId: string | null;
  readonly createdAt: Date;
  
  toString(): string;
  toJSON(): Partial<CarOrder> & { isNull: true };
}

export declare const NULL_CAR_ORDER: NullCarOrder;
