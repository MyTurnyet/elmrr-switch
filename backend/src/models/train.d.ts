/**
 * Type definitions for train model
 */

import Joi from 'joi';

export interface SwitchListItem {
  carId: string;
  carReportingMarks: string;
  carNumber: string;
  carType: string;
  destinationIndustryId: string;
  destinationIndustryName: string;
  carOrderId?: string | null;
}

export interface SwitchListStation {
  stationId: string;
  stationName: string;
  pickups: SwitchListItem[];
  setouts: SwitchListItem[];
}

export interface SwitchList {
  stations: SwitchListStation[];
  totalPickups: number;
  totalSetouts: number;
  finalCarCount: number;
  generatedAt: string;
}

export type TrainStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Train {
  _id?: string;
  name: string;
  routeId: string;
  sessionNumber: number;
  status: TrainStatus;
  locomotiveIds: string[];
  maxCapacity: number;
  switchList?: SwitchList | null;
  assignedCarIds: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export declare const switchListItemSchema: Joi.ObjectSchema<SwitchListItem>;
export declare const switchListStationSchema: Joi.ObjectSchema<SwitchListStation>;
export declare const switchListSchema: Joi.ObjectSchema<SwitchList>;
export declare const trainSchema: Joi.ObjectSchema<Train>;

export declare function validateTrain(
  data: any,
  isUpdate?: boolean
): Joi.ValidationResult<Train>;

export declare function validateTrainNameUniqueness(
  trains: any[],
  trainName: string,
  sessionNumber: number,
  excludeTrainId?: string | null
): { valid: boolean; duplicateTrains: any[] };

export declare function validateLocomotiveAssignments(
  trains: any[],
  locomotiveIds: string[],
  excludeTrainId?: string | null
): { valid: boolean; conflicts: any[] };

export declare function validateStatusTransition(
  currentStatus: TrainStatus,
  newStatus: TrainStatus
): { valid: boolean; error?: string };

export declare function calculateCapacityUsage(
  switchList: SwitchList | null
): { currentLoad: number; percentUsed: number };

export declare function formatTrainSummary(train: Train): string;

export declare function validateSwitchListRequirements(
  train: Train
): { valid: boolean; errors: string[] };
