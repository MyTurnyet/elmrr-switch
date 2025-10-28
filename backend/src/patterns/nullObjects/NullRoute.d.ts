/**
 * Type definitions for NullRoute
 */

import { BaseNullObject, NullObject } from '../NullObject.js';
import { Route } from '../../models/route.js';

export declare class NullRoute extends BaseNullObject implements Route, NullObject {
  readonly _id: string;
  readonly name: string;
  readonly description: string;
  readonly originYard: string;
  readonly terminationYard: string;
  readonly stationSequence: string[];
  
  toString(): string;
  toJSON(): Partial<Route> & { isNull: true };
}

export declare const NULL_ROUTE: NullRoute;
