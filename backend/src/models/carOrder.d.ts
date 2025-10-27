/**
 * Type definitions for car order model
 */

import Joi from 'joi';

export type CarOrderStatus = 'pending' | 'assigned' | 'in-transit' | 'delivered';

export interface CarOrder {
  _id?: string;
  industryId: string;
  aarTypeId: string;
  sessionNumber: number;
  status: CarOrderStatus;
  assignedCarId?: string | null;
  assignedTrainId?: string | null;
  createdAt: Date | string;
}

export interface OrderGenerationRequest {
  sessionNumber?: number;
  industryIds?: string[];
  force?: boolean;
}

export interface OrderGenerationSummary {
  totalOrdersGenerated: number;
  industriesProcessed: number;
  ordersByIndustry: Record<string, number>;
  ordersByAarType: Record<string, number>;
}

export declare const carOrderSchema: Joi.ObjectSchema<CarOrder>;

export declare function validateCarOrder(
  data: any,
  isUpdate?: boolean
): Joi.ValidationResult<CarOrder>;

export declare function validateOrderGeneration(
  data: any
): Joi.ValidationResult<OrderGenerationRequest>;

export declare function createOrderGenerationSummary(
  orders: CarOrder[],
  industryDemands: any[]
): OrderGenerationSummary;

export declare function validateCarAssignment(
  carId: string,
  aarTypeId: string
): Promise<{ valid: boolean; error?: string }>;

export declare function checkDuplicateOrder(
  industryId: string,
  aarTypeId: string,
  sessionNumber: number
): Promise<boolean>;

export declare function validateStatusTransition(
  currentStatus: CarOrderStatus,
  newStatus: CarOrderStatus
): { valid: boolean; error?: string };
