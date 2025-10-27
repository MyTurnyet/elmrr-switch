/**
 * Type definitions for route model
 */

import Joi from 'joi';

export interface RouteStation {
  stationId: string;
  sequence: number;
}

export interface Route {
  _id?: string;
  name: string;
  description?: string;
  originYard: string;
  terminationYard: string;
  stationSequence: string[];
}

export declare const routeStationSchema: Joi.ObjectSchema<RouteStation>;
export declare const routeSchema: Joi.ObjectSchema<Route>;

export declare function validateRoute(
  data: any,
  isUpdate?: boolean
): Joi.ValidationResult<Route>;
