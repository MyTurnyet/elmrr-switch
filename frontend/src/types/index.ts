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
  name: string;
  block: string;
  type: 'station' | 'yard' | 'industry';
  description?: string;
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

export interface Locomotive {
  id?: string;
  _id?: string;
  reportingMarks: string;
  reportingNumber: string;
  type: string;
  color: string;
  notes?: string;
  homeYard: string; // Industry ID
  currentIndustry: string; // Industry ID
  isInService: boolean;
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

export interface Train {
  id: string;
  name: string;
  route: string; // Route ID
  schedule?: string;
  status: 'planned' | 'in_progress' | 'completed';
  currentCars: string[]; // Array of car IDs
  locomotives: string[]; // Array of locomotive IDs
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  stationSequence: string[]; // Ordered array of station IDs
  originYard: string; // Industry ID
  terminationYard: string; // Industry ID
}

export interface OperatingSession {
  id: string;
  date: Date;
  description?: string;
  sessionNumber: number;
  status: 'planned' | 'active' | 'completed';
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
  type: 'car_moved' | 'train_created' | 'session_started' | 'data_imported';
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
}

// Context interfaces
export interface AppContextType {
  // Data
  cars: RollingStock[];
  locomotives: Locomotive[];
  industries: Industry[];
  stations: Station[];
  goods: Goods[];
  aarTypes: AarType[];
  blocks: Block[];
  tracks: Track[];
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  importData: (data: any) => Promise<ImportResult>;
  updateCar: (id: string, data: Partial<RollingStock>) => Promise<void>;
  moveCar: (carId: string, destinationIndustryId: string) => Promise<void>;
  updateIndustry: (id: string, data: Partial<Industry>) => Promise<void>;
}
