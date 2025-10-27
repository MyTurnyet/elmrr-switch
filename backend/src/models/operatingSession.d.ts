/**
 * Type definitions for operating session model
 */

import Joi from 'joi';

export interface SessionCarSnapshot {
  id: string;
  currentIndustry: string;
  sessionsAtCurrentLocation: number;
}

export interface SessionSnapshot {
  sessionNumber: number;
  cars: SessionCarSnapshot[];
  trains: any[];
  carOrders: any[];
}

export interface OperatingSession {
  _id?: string;
  currentSessionNumber: number;
  sessionDate: Date | string;
  description: string;
  previousSessionSnapshot?: SessionSnapshot | null;
}

export declare const operatingSessionSchema: Joi.ObjectSchema<OperatingSession>;

export declare function validateOperatingSession(
  data: any,
  isUpdate?: boolean
): Joi.ValidationResult<OperatingSession>;

export declare function createSessionSnapshot(
  sessionNumber: number,
  cars: any[],
  trains: any[],
  carOrders: any[]
): SessionSnapshot;

export declare function validateSnapshot(
  snapshot: any
): Joi.ValidationResult<SessionSnapshot>;
