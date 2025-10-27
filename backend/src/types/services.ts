/**
 * Type Definitions for Services
 * 
 * Types for the service layer including service interfaces
 * and service-related types.
 */

import type {
  Train,
  Car,
  CarOrder,
  Route,
  OperatingSession,
  SwitchListStation,
  SessionSnapshot
} from './models.js';

/**
 * Train Service Interface
 */
export interface ITrainService {
  generateSwitchList(trainId: string): Promise<Train>;
  completeTrain(trainId: string): Promise<Train>;
  cancelTrain(trainId: string): Promise<Train>;
}

/**
 * Session Service Interface
 */
export interface ISessionService {
  getCurrentSession(): Promise<OperatingSession>;
  advanceSession(description?: string): Promise<SessionAdvanceResult>;
  rollbackSession(): Promise<SessionRollbackResult>;
  updateSessionDescription(description: string): Promise<OperatingSession>;
  getSessionStats(): Promise<SessionStats>;
}

/**
 * Car Order Service Interface
 */
export interface ICarOrderService {
  generateOrders(sessionNumber?: number, force?: boolean): Promise<OrderGenerationResult>;
  getOrdersWithFilters(filters: CarOrderFilters): Promise<CarOrder[]>;
  assignCarToOrder(orderId: string, carId: string): Promise<CarOrder>;
}

/**
 * Session Advance Result
 */
export interface SessionAdvanceResult {
  session: any;
  stats: {
    advancedToSession: number;
    carsUpdated: number;
    trainsDeleted: number;
    carsReverted: number;
  };
}

/**
 * Session Rollback Result
 */
export interface SessionRollbackResult {
  session: any;
  stats: {
    rolledBackToSession: number;
    carsRestored: number;
    trainsRestored: number;
    ordersRestored: number;
  };
}

/**
 * Session Statistics
 */
export interface SessionStats {
  currentSession: number;
  totalCars: number;
  totalTrains: number;
  totalOrders: number;
  pendingOrders: number;
  completedTrains: number;
}

/**
 * Order Generation Result
 */
export interface OrderGenerationResult {
  ordersCreated: number;
  ordersByIndustry: Record<string, number>;
  ordersByType: Record<string, number>;
  summary: string;
}

/**
 * Car Order Filters
 */
export interface CarOrderFilters {
  industryId?: string;
  status?: string;
  sessionNumber?: number;
  aarTypeId?: string;
  search?: string;
}

/**
 * Switch List Generation Context
 */
export interface SwitchListContext {
  train: Train;
  route: Route;
  availableCars: Car[];
  pendingOrders: CarOrder[];
  currentCapacity: number;
}

/**
 * Switch List Station Result
 */
export interface SwitchListStationResult {
  station: SwitchListStation;
  ordersAssigned: string[];
  capacityUsed: number;
}

/**
 * Service Error
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Service Factory Type
 */
export interface IServiceFactory {
  getService(serviceName: 'train'): ITrainService;
  getService(serviceName: 'session'): ISessionService;
  getService(serviceName: 'carOrder'): ICarOrderService;
  getService(serviceName: string): any;
}
