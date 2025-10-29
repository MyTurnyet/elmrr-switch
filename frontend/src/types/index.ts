// Core data model interfaces for Model Railroad Layout Tracking System

export interface Block {
  id?: string;
  _id?: string;
  name: string;
  yardId?: string;
  capacity: number;
  currentCars: string[]; // Array of car IDs
}

export interface Station {
  id?: string;
  _id?: string;
  stationName: string; // Backend uses 'stationName', not 'name'
  name?: string; // Legacy field for compatibility
  block: string;
  type: 'station' | 'yard' | 'industry';
  description?: string;
}

/**
 * Car demand configuration for an industry
 * Defines how many cars of a specific type are needed per session
 */
export interface CarDemandConfig {
  aarTypeId: string; // AAR type ID for the car type
  carsPerSession: number; // Number of cars needed per session (min: 1)
  frequency: number; // How often to generate orders (sessionNumber % frequency === 0)
}

export interface Industry {
  id?: string;
  _id?: string;
  name: string;
  stationId: string;
  goodsReceived: string[]; // Array of goods IDs
  goodsToShip: string[]; // Array of goods IDs
  preferredCarTypes: string[]; // Array of AAR type IDs
  isYard?: boolean; // Special type: Yard (accepts all car types)
  isOnLayout: boolean;
  carDemandConfig?: CarDemandConfig[]; // Industry demand configuration for car orders
}

export interface Track {
  id?: string;
  _id?: string;
  industryId: string;
  capacity: number;
  currentCars: string[]; // Array of car IDs
  acceptedCarTypes: string[]; // Array of AAR type IDs, or ["all"] for all types
}

export interface Goods {
  id?: string;
  _id?: string;
  name: string;
  compatibleCarTypes: string[]; // Array of AAR type IDs
  loadingTime: number; // In operating sessions
  unloadingTime: number; // In operating sessions
}

/**
 * Locomotive entity
 * Represents a locomotive with DCC configuration and service status
 */
export interface Locomotive {
  id?: string; // Frontend convenience field
  _id?: string; // NeDB database ID
  reportingMarks: string; // 1-10 characters (e.g., "ELMR", "UP", "SP")
  reportingNumber: string; // Exactly 6 characters (e.g., "003801")
  model: string; // Model designation (e.g., "GP38-2", "SD40-2")
  manufacturer: string; // From approved list (Atlas, Kato, Lionel, etc.)
  isDCC: boolean; // DCC equipped or DC
  dccAddress?: number; // DCC address (1-9999), required if isDCC=true
  dccAddressFormatted?: string; // Formatted DCC address with leading zeros
  homeYard: string; // Industry ID (must be a yard)
  isInService: boolean; // Service status
  notes?: string; // Optional notes (max 500 characters)
  
  // Enriched fields (from API responses)
  homeYardDetails?: {
    _id: string;
    name: string;
    stationId: string;
    isYard: boolean;
    isOnLayout: boolean;
  };
  displayName?: string; // Formatted as "ELMR 003801"
  fullDesignation?: string; // Same as displayName
  status?: string; // "In Service" or "Out of Service"
  dccStatus?: string; // "DCC (3801)" or "DC"
}

/**
 * Locomotive statistics
 * Aggregated data about the locomotive fleet
 */
export interface LocomotiveStatistics {
  total: number;
  inService: number;
  outOfService: number;
  dccEnabled: number;
  dcOnly: number;
  byManufacturer: Record<string, number>;
  byModel: Record<string, number>;
  byHomeYard: Record<string, number>;
  availabilityRate: string; // Percentage as string (e.g., "90.0%")
  dccRate: string; // Percentage as string (e.g., "80.0%")
}

/**
 * Train assignment information for a locomotive
 * Used to check if locomotive can be deleted or set out of service
 */
export interface LocomotiveTrainAssignment {
  isAssigned: boolean;
  trainCount: number;
  trains: Array<{
    _id: string;
    name: string;
    status: TrainStatus;
    sessionNumber: number;
  }>;
}

export interface AarType {
  id?: string;
  _id?: string;
  name: string;
  initial: string;
  description?: string;
}

export interface RollingStock {
  id?: string; // Frontend convenience field
  _id?: string; // NeDB database ID
  reportingMarks: string;
  reportingNumber: string;
  carType: string; // AAR Type ID
  color: string;
  notes?: string;
  currentLoad?: string; // Goods ID
  homeYard: string; // Industry ID
  currentIndustry: string; // Industry ID
  isInService: boolean;
  lastMoved?: Date;
  sessionsAtCurrentLocation: number;
}

/**
 * Train status enum
 * Workflow: Planned → In Progress → Completed/Cancelled
 */
export type TrainStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';

/**
 * Switch list item representing a car pickup or setout
 */
export interface SwitchListItem {
  carId: string;
  carReportingMarks: string;
  carNumber: string;
  carType: string;
  destinationIndustryId: string;
  destinationIndustryName: string;
  carOrderId?: string | null; // May not have an associated order
}

/**
 * Switch list station with pickups and setouts
 */
export interface SwitchListStation {
  stationId: string;
  stationName: string;
  pickups: SwitchListItem[];
  setouts: SwitchListItem[];
}

/**
 * Complete switch list for a train
 * Generated when train moves from Planned to In Progress
 */
export interface SwitchList {
  stations: SwitchListStation[];
  totalPickups: number;
  totalSetouts: number;
  finalCarCount: number;
  generatedAt: string; // ISO date string
}

/**
 * Train entity
 * Represents a train with its route, locomotives, and switch list
 */
export interface Train {
  id?: string; // Frontend convenience field
  _id?: string; // NeDB database ID
  name: string;
  routeId: string; // Route ID
  sessionNumber: number;
  status: TrainStatus;
  locomotiveIds: string[]; // Array of locomotive IDs (min: 1)
  maxCapacity: number; // Maximum number of cars (1-100)
  switchList?: SwitchList | null; // Generated when status changes to In Progress
  assignedCarIds: string[]; // Cars currently assigned to this train
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  
  // Enriched fields (from API responses)
  route?: {
    _id: string;
    name: string;
  };
  locomotives?: Array<{
    _id: string;
    reportingMarks: string;
    reportingNumber: string;
  }>;
}

export interface Route {
  id?: string; // Frontend convenience field
  _id?: string; // NeDB database ID
  name: string;
  description?: string;
  stationSequence: string[]; // Ordered array of station IDs
  originYard: string; // Industry ID
  terminationYard: string; // Industry ID
}

/**
 * Snapshot of car state for session rollback
 */
export interface CarSnapshot {
  id: string;
  currentIndustry: string;
  sessionsAtCurrentLocation: number;
}

/**
 * Session snapshot for rollback capability
 * Contains complete state of cars, trains, and orders from previous session
 */
export interface SessionSnapshot {
  sessionNumber: number;
  cars: CarSnapshot[];
  trains: any[]; // Full train objects
  carOrders: any[]; // Full car order objects
}

/**
 * Operating Session entity (singleton pattern - only one exists)
 * Tracks current session number and enables rollback to previous session
 */
export interface OperatingSession {
  id?: string; // Frontend convenience field
  _id?: string; // NeDB database ID
  currentSessionNumber: number; // Current session number (min: 1)
  sessionDate: string; // ISO date string
  description?: string; // Optional session description
  previousSessionSnapshot?: SessionSnapshot | null; // Snapshot for rollback (null if session 1)
}

/**
 * Car order status enum
 * Workflow: pending → assigned → in-transit → delivered
 */
export type CarOrderStatus = 'pending' | 'assigned' | 'in-transit' | 'delivered';

/**
 * Car Order entity
 * Represents industry demand for a specific car type
 */
export interface CarOrder {
  id?: string; // Frontend convenience field
  _id?: string; // NeDB database ID
  industryId: string; // Industry requesting the car
  aarTypeId: string; // Type of car needed
  sessionNumber: number; // Session when order was created
  status: CarOrderStatus;
  assignedCarId?: string | null; // Car assigned to fulfill this order
  assignedTrainId?: string | null; // Train assigned to deliver this car
  createdAt: string; // ISO date string
  
  // Enriched fields (from API responses)
  industry?: {
    _id: string;
    name: string;
  };
  aarType?: {
    _id: string;
    name: string;
    initial: string;
  };
  assignedCar?: {
    _id: string;
    reportingMarks: string;
    reportingNumber: string;
  };
  assignedTrain?: {
    _id: string;
    name: string;
  };
}

// UI-specific interfaces
export interface FilterOptions {
  carType?: string;
  location?: string;
  status?: string;
  homeYard?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ImportResult {
  imported: number;
  errors: string[];
  warnings: string[];
}

// Dashboard data interfaces
export interface DashboardStats {
  totalCars: number;
  totalLocomotives: number;
  totalIndustries: number;
  carsInService: number;
  locomotivesInService: number;
  currentSession?: OperatingSession;
}

export interface RecentActivity {
  id: string;
  type: 'car_moved' | 'train_created' | 'train_completed' | 'session_advanced' | 'session_rolled_back' | 'orders_generated' | 'data_imported';
  description: string;
  timestamp: Date;
  entityId?: string;
}

// Form data interfaces
export interface CarFormData {
  reportingMarks: string;
  reportingNumber: string;
  carType: string;
  color: string;
  notes?: string;
  homeYard: string;
  currentIndustry: string;
  isInService: boolean;
}

export interface IndustryFormData {
  name: string;
  stationId: string;
  goodsReceived: string[];
  goodsToShip: string[];
  preferredCarTypes: string[];
  isYard?: boolean;
  isOnLayout: boolean;
  carDemandConfig?: CarDemandConfig[];
}

export interface TrainFormData {
  name: string;
  routeId: string;
  locomotiveIds: string[];
  maxCapacity: number;
}

export interface LocomotiveFormData {
  reportingMarks: string;
  reportingNumber: string;
  model: string;
  manufacturer: string;
  isDCC: boolean;
  dccAddress?: number;
  homeYard: string;
  isInService: boolean;
  notes?: string;
}

export interface CarOrderGenerationRequest {
  sessionNumber?: number; // If not provided, use current session
  industryIds?: string[]; // If provided, only generate for these industries
  force?: boolean; // Force generation even if orders already exist
}

export interface CarOrderGenerationSummary {
  totalOrdersGenerated: number;
  industriesProcessed: number;
  ordersByIndustry: Record<string, number>;
  ordersByAarType: Record<string, number>;
}

// Context interfaces
export interface AppContextType {
  // Core Data
  cars: RollingStock[];
  locomotives: Locomotive[];
  industries: Industry[];
  stations: Station[];
  goods: Goods[];
  aarTypes: AarType[];
  blocks: Block[];
  tracks: Track[];
  routes: Route[];

  // Train Operations Data
  currentSession: OperatingSession | null;
  trains: Train[];
  carOrders: CarOrder[];
  locomotiveStatistics: LocomotiveStatistics | null;

  // UI State
  loading: boolean;
  error: string | null;
  sessionLoading: boolean;
  trainsLoading: boolean;
  ordersLoading: boolean;

  // Core Actions
  fetchData: () => Promise<void>;
  importData: (data: any) => Promise<ImportResult>;
  clearDatabase: () => Promise<void>;

  // Car Actions
  createCar: (data: Partial<RollingStock>) => Promise<RollingStock>;
  updateCar: (id: string, data: Partial<RollingStock>) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
  moveCar: (carId: string, destinationIndustryId: string) => Promise<void>;

  // Industry Actions
  createIndustry: (data: Partial<Industry>) => Promise<Industry>;
  updateIndustry: (id: string, data: Partial<Industry>) => Promise<void>;
  deleteIndustry: (id: string) => Promise<void>;

  // Route Actions
  createRoute: (data: Partial<Route>) => Promise<Route>;
  updateRoute: (id: string, data: Partial<Route>) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;

  // Session Actions
  fetchCurrentSession: () => Promise<void>;
  advanceSession: () => Promise<OperatingSession>;
  rollbackSession: () => Promise<OperatingSession>;
  updateSessionDescription: (description: string) => Promise<void>;

  // Train Actions
  fetchTrains: (filters?: { sessionNumber?: number; status?: TrainStatus; routeId?: string; search?: string }) => Promise<void>;
  createTrain: (data: TrainFormData) => Promise<Train>;
  updateTrain: (id: string, data: Partial<TrainFormData>) => Promise<void>;
  deleteTrain: (id: string) => Promise<void>;
  generateSwitchList: (id: string) => Promise<Train>;
  completeTrain: (id: string) => Promise<Train>;
  cancelTrain: (id: string) => Promise<Train>;

  // Car Order Actions
  fetchCarOrders: (filters?: { industryId?: string; status?: CarOrderStatus; sessionNumber?: number; aarTypeId?: string; search?: string }) => Promise<void>;
  generateCarOrders: (request?: CarOrderGenerationRequest) => Promise<CarOrderGenerationSummary>;
  deleteCarOrder: (id: string) => Promise<void>;

  // Locomotive Actions
  fetchLocomotives: (filters?: { manufacturer?: string; model?: string; homeYard?: string; isInService?: boolean; isDCC?: boolean; search?: string }) => Promise<void>;
  fetchLocomotiveStatistics: () => Promise<void>;
  createLocomotive: (data: LocomotiveFormData) => Promise<Locomotive>;
  updateLocomotive: (id: string, data: Partial<LocomotiveFormData>) => Promise<void>;
  deleteLocomotive: (id: string) => Promise<void>;
  getLocomotiveAssignments: (id: string) => Promise<LocomotiveTrainAssignment>;
}
