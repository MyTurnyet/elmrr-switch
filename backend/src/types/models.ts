/**
 * Type Definitions for ELMRR Switch Models
 * 
 * Comprehensive type definitions for all entities in the system.
 * These types provide compile-time type safety and IDE support.
 */

/**
 * Base Entity
 * All entities extend from this base type
 */
export interface BaseEntity {
  _id: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Car Entity
 */
export interface Car extends BaseEntity {
  reportingMarks: string;
  reportingNumber: string;
  carType: string;
  color?: string;
  isInService: boolean;
  currentIndustry: string;
  homeYard: string;
  sessionsAtCurrentLocation: number;
  lastMoved: Date | string;
}

/**
 * Locomotive Entity
 */
export interface Locomotive extends BaseEntity {
  roadName: string;
  roadNumber: string;
  model: string;
  isInService: boolean;
}

/**
 * Station Entity
 */
export interface Station extends BaseEntity {
  name: string;
  code: string;
}

/**
 * Industry Entity
 */
export interface Industry extends BaseEntity {
  name: string;
  stationId: string;
  carDemandConfig: CarDemandConfig[];
  station?: Station; // Enriched data
}

/**
 * Car Demand Configuration
 */
export interface CarDemandConfig {
  aarTypeId: string;
  carsPerSession: number;
  frequency: number;
}

/**
 * Good Entity
 */
export interface Good extends BaseEntity {
  name: string;
  category: string;
}

/**
 * AAR Type Entity
 */
export interface AarType extends BaseEntity {
  name: string;
  code: string;
  category: string;
}

/**
 * Block Entity
 */
export interface Block extends BaseEntity {
  name: string;
}

/**
 * Track Entity
 */
export interface Track extends BaseEntity {
  name: string;
  stationId: string;
  trackType: string;
}

/**
 * Route Entity
 */
export interface Route extends BaseEntity {
  name: string;
  description?: string;
  originYard: string;
  terminationYard: string;
  stationSequence: string[];
}

/**
 * Train Status
 */
export type TrainStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';

/**
 * Train Entity
 */
export interface Train extends BaseEntity {
  name: string;
  routeId: string;
  sessionNumber: number;
  status: TrainStatus;
  locomotiveIds: string[];
  maxCapacity: number;
  assignedCarIds: string[];
  switchList: SwitchListStation[] | null;
  route?: Route; // Enriched data
  locomotives?: Locomotive[]; // Enriched data
}

/**
 * Switch List Station
 */
export interface SwitchListStation {
  stationId: string;
  stationName: string;
  pickups: SwitchListPickup[];
  setouts: SwitchListSetout[];
}

/**
 * Switch List Pickup
 */
export interface SwitchListPickup {
  carId: string;
  fromIndustry: string;
  toIndustry: string;
  orderId?: string;
}

/**
 * Switch List Setout
 */
export interface SwitchListSetout {
  carId: string;
  toIndustry: string;
  orderId?: string;
}

/**
 * Car Order Status
 */
export type CarOrderStatus = 'pending' | 'assigned' | 'in-transit' | 'delivered';

/**
 * Car Order Entity
 */
export interface CarOrder extends BaseEntity {
  industryId: string;
  aarTypeId: string;
  sessionNumber: number;
  status: CarOrderStatus;
  assignedCarId?: string;
  assignedTrainId?: string;
  industry?: Industry; // Enriched data
  assignedCar?: Car; // Enriched data
  assignedTrain?: Train; // Enriched data
}

/**
 * Operating Session Entity
 */
export interface OperatingSession extends BaseEntity {
  currentSessionNumber: number;
  sessionDate: string;
  description: string;
  previousSessionSnapshot: SessionSnapshot | null;
}

/**
 * Session Snapshot
 */
export interface SessionSnapshot {
  sessionNumber: number;
  cars: CarSnapshot[];
  trains: Train[];
  carOrders: CarOrder[];
}

/**
 * Car Snapshot
 */
export interface CarSnapshot {
  id: string;
  currentIndustry: string;
  sessionsAtCurrentLocation: number;
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Pagination Metadata
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Sort Configuration
 */
export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Transformation Options
 */
export interface TransformOptions {
  view?: 'list' | 'detail' | 'export' | 'default';
  fields?: string[];
}

/**
 * Filter Query
 * Generic type for database queries
 */
export type FilterQuery = Record<string, any>;

/**
 * Statistics
 * Generic type for entity statistics
 */
export interface Statistics {
  total: number;
  [key: string]: any;
}

/**
 * API Response
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
  timestamp?: string;
}

/**
 * API Response (Union Type)
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;
