/**
 * Type definitions for NullOperatingSession
 */

import { BaseNullObject, NullObject } from '../NullObject.js';
import { OperatingSession } from '../../models/operatingSession.js';

export declare class NullOperatingSession extends BaseNullObject implements OperatingSession, NullObject {
  readonly _id: string;
  readonly currentSessionNumber: number;
  readonly sessionDate: Date;
  readonly description: string;
  readonly previousSessionSnapshot: null;
  
  toString(): string;
  toJSON(): Partial<OperatingSession> & { isNull: true };
}

export declare const NULL_OPERATING_SESSION: NullOperatingSession;
