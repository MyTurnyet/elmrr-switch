import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { 
  AppContextType, 
  RollingStock, 
  Locomotive, 
  Industry, 
  Station, 
  Goods, 
  AarType, 
  Block, 
  Track, 
  Route, 
  ImportResult,
  OperatingSession,
  Train,
  CarOrder,
  TrainFormData,
  CarOrderGenerationRequest,
  CarOrderGenerationSummary,
  TrainStatus,
  CarOrderStatus,
} from '../types';
import { apiService } from '../services/api';

// State interface
interface AppState {
  // Core data
  cars: RollingStock[];
  locomotives: Locomotive[];
  industries: Industry[];
  stations: Station[];
  goods: Goods[];
  aarTypes: AarType[];
  blocks: Block[];
  tracks: Track[];
  routes: Route[];
  
  // Train operations data
  currentSession: OperatingSession | null;
  trains: Train[];
  carOrders: CarOrder[];
  
  // UI state
  loading: boolean;
  error: string | null;
  sessionLoading: boolean;
  trainsLoading: boolean;
  ordersLoading: boolean;
}

// Action types
type AppAction =
  // Core loading/error
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  
  // Core data
  | { type: 'SET_CARS'; payload: RollingStock[] }
  | { type: 'SET_LOCOMOTIVES'; payload: Locomotive[] }
  | { type: 'SET_INDUSTRIES'; payload: Industry[] }
  | { type: 'SET_STATIONS'; payload: Station[] }
  | { type: 'SET_GOODS'; payload: Goods[] }
  | { type: 'SET_AAR_TYPES'; payload: AarType[] }
  | { type: 'SET_BLOCKS'; payload: Block[] }
  | { type: 'SET_TRACKS'; payload: Track[] }
  | { type: 'SET_ROUTES'; payload: Route[] }
  
  // Car operations
  | { type: 'ADD_CAR'; payload: RollingStock }
  | { type: 'UPDATE_CAR'; payload: RollingStock }
  | { type: 'DELETE_CAR'; payload: string }
  
  // Industry operations
  | { type: 'ADD_INDUSTRY'; payload: Industry }
  | { type: 'UPDATE_INDUSTRY'; payload: Industry }
  | { type: 'DELETE_INDUSTRY'; payload: string }
  
  // Route operations
  | { type: 'ADD_ROUTE'; payload: Route }
  | { type: 'UPDATE_ROUTE'; payload: Route }
  | { type: 'DELETE_ROUTE'; payload: string }
  
  // Train operations - Session
  | { type: 'SET_SESSION_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_SESSION'; payload: OperatingSession | null }
  
  // Train operations - Trains
  | { type: 'SET_TRAINS_LOADING'; payload: boolean }
  | { type: 'SET_TRAINS'; payload: Train[] }
  | { type: 'ADD_TRAIN'; payload: Train }
  | { type: 'UPDATE_TRAIN'; payload: Train }
  | { type: 'DELETE_TRAIN'; payload: string }
  
  // Train operations - Car Orders
  | { type: 'SET_ORDERS_LOADING'; payload: boolean }
  | { type: 'SET_CAR_ORDERS'; payload: CarOrder[] }
  | { type: 'DELETE_CAR_ORDER'; payload: string };

// Initial state
const initialState: AppState = {
  // Core data
  cars: [],
  locomotives: [],
  industries: [],
  stations: [],
  goods: [],
  aarTypes: [],
  blocks: [],
  tracks: [],
  routes: [],
  
  // Train operations data
  currentSession: null,
  trains: [],
  carOrders: [],
  
  // UI state
  loading: false,
  error: null,
  sessionLoading: false,
  trainsLoading: false,
  ordersLoading: false,
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_CARS':
      return { ...state, cars: action.payload };
    case 'SET_LOCOMOTIVES':
      return { ...state, locomotives: action.payload };
    case 'SET_INDUSTRIES':
      return { ...state, industries: action.payload };
    case 'SET_STATIONS':
      return { ...state, stations: action.payload };
    case 'SET_GOODS':
      return { ...state, goods: action.payload };
    case 'SET_AAR_TYPES':
      return { ...state, aarTypes: action.payload };
    case 'SET_BLOCKS':
      return { ...state, blocks: action.payload };
    case 'SET_TRACKS':
      return { ...state, tracks: action.payload };
    case 'SET_ROUTES':
      return { ...state, routes: action.payload };
    case 'ADD_CAR':
      return {
        ...state,
        cars: [...state.cars, action.payload]
      };
    case 'UPDATE_CAR':
      return {
        ...state,
        cars: state.cars.map(car =>
          (car.id || car._id) === (action.payload.id || action.payload._id) ? action.payload : car
        )
      };
    case 'DELETE_CAR':
      return {
        ...state,
        cars: state.cars.filter(car => (car.id || car._id) !== action.payload)
      };
    case 'ADD_INDUSTRY':
      return {
        ...state,
        industries: [...state.industries, action.payload]
      };
    case 'UPDATE_INDUSTRY':
      return {
        ...state,
        industries: state.industries.map(industry =>
          (industry.id || industry._id) === (action.payload.id || action.payload._id) ? action.payload : industry
        )
      };
    case 'DELETE_INDUSTRY':
      return {
        ...state,
        industries: state.industries.filter(industry => (industry.id || industry._id) !== action.payload)
      };
    case 'ADD_ROUTE':
      return {
        ...state,
        routes: [...state.routes, action.payload]
      };
    case 'UPDATE_ROUTE':
      return {
        ...state,
        routes: state.routes.map(route =>
          (route.id || route._id) === (action.payload.id || action.payload._id) ? action.payload : route
        )
      };
    case 'DELETE_ROUTE':
      return {
        ...state,
        routes: state.routes.filter(route => (route.id || route._id) !== action.payload)
      };
    
    // Train operations - Session
    case 'SET_SESSION_LOADING':
      return { ...state, sessionLoading: action.payload };
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
    
    // Train operations - Trains
    case 'SET_TRAINS_LOADING':
      return { ...state, trainsLoading: action.payload };
    case 'SET_TRAINS':
      return { ...state, trains: action.payload };
    case 'ADD_TRAIN':
      return { ...state, trains: [...state.trains, action.payload] };
    case 'UPDATE_TRAIN':
      return {
        ...state,
        trains: state.trains.map(train =>
          (train.id || train._id) === (action.payload.id || action.payload._id) ? action.payload : train
        )
      };
    case 'DELETE_TRAIN':
      return {
        ...state,
        trains: state.trains.filter(train => (train.id || train._id) !== action.payload)
      };
    
    // Train operations - Car Orders
    case 'SET_ORDERS_LOADING':
      return { ...state, ordersLoading: action.payload };
    case 'SET_CAR_ORDERS':
      return { ...state, carOrders: action.payload };
    case 'DELETE_CAR_ORDER':
      return {
        ...state,
        carOrders: state.carOrders.filter(order => (order.id || order._id) !== action.payload)
      };
    
    default:
      return state;
  }
};

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Note: Using apiService from services/api.ts for all API calls

  // Fetch all data
  const fetchData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const [
        carsResponse,
        locomotivesResponse,
        industriesResponse,
        stationsResponse,
        goodsResponse,
        aarTypesResponse,
        blocksResponse,
        tracksResponse,
        routesResponse,
        sessionResponse,
      ] = await Promise.all([
        apiService.getCars(),
        apiService.getLocomotives(),
        apiService.getIndustries(),
        apiService.getStations(),
        apiService.getGoods(),
        apiService.getAarTypes(),
        apiService.getBlocks(),
        apiService.getTracks(),
        apiService.getRoutes(),
        apiService.getCurrentSession().catch(() => ({ data: null })), // Session might not exist yet
      ]);

      dispatch({ type: 'SET_CARS', payload: (carsResponse.data as RollingStock[]) || [] });
      dispatch({ type: 'SET_LOCOMOTIVES', payload: (locomotivesResponse.data as Locomotive[]) || [] });
      dispatch({ type: 'SET_INDUSTRIES', payload: (industriesResponse.data as Industry[]) || [] });
      dispatch({ type: 'SET_STATIONS', payload: (stationsResponse.data as Station[]) || [] });
      dispatch({ type: 'SET_GOODS', payload: (goodsResponse.data as Goods[]) || [] });
      dispatch({ type: 'SET_AAR_TYPES', payload: (aarTypesResponse.data as AarType[]) || [] });
      dispatch({ type: 'SET_BLOCKS', payload: (blocksResponse.data as Block[]) || [] });
      dispatch({ type: 'SET_TRACKS', payload: (tracksResponse.data as Track[]) || [] });
      dispatch({ type: 'SET_ROUTES', payload: (routesResponse.data as Route[]) || [] });
      dispatch({ type: 'SET_CURRENT_SESSION', payload: (sessionResponse.data as OperatingSession | null) || null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Import data
  const importData = useCallback(async (data: any): Promise<ImportResult> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await apiService.importData(data);

      // Refresh data after import
      await fetchData();

      return response.data as ImportResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [fetchData]);

  // Clear database
  const clearDatabase = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await apiService.clearData();

      // Clear local state after successful clear
      dispatch({ type: 'SET_CARS', payload: [] });
      dispatch({ type: 'SET_LOCOMOTIVES', payload: [] });
      dispatch({ type: 'SET_INDUSTRIES', payload: [] });
      dispatch({ type: 'SET_STATIONS', payload: [] });
      dispatch({ type: 'SET_GOODS', payload: [] });
      dispatch({ type: 'SET_AAR_TYPES', payload: [] });
      dispatch({ type: 'SET_BLOCKS', payload: [] });
      dispatch({ type: 'SET_TRACKS', payload: [] });
      dispatch({ type: 'SET_ROUTES', payload: [] });
      dispatch({ type: 'SET_CURRENT_SESSION', payload: null });
      dispatch({ type: 'SET_TRAINS', payload: [] });
      dispatch({ type: 'SET_CAR_ORDERS', payload: [] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear database';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Create car
  const createCar = useCallback(async (data: Partial<RollingStock>): Promise<RollingStock> => {
    try {
      const response = await apiService.createCar(data);
      const car = response.data as RollingStock;
      dispatch({ type: 'ADD_CAR', payload: car });
      return car;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create car' });
      throw error;
    }
  }, []);

  // Update car
  const updateCar = useCallback(async (id: string, data: Partial<RollingStock>) => {
    try {
      const response = await apiService.updateCar(id, data);
      dispatch({ type: 'UPDATE_CAR', payload: response.data as RollingStock });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update car' });
      throw error;
    }
  }, []);

  // Delete car
  const deleteCar = useCallback(async (id: string) => {
    try {
      await apiService.deleteCar(id);
      dispatch({ type: 'DELETE_CAR', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete car' });
      throw error;
    }
  }, []);

  // Move car
  const moveCar = useCallback(async (carId: string, destinationIndustryId: string) => {
    try {
      const response = await apiService.moveCar(carId, destinationIndustryId);
      dispatch({ type: 'UPDATE_CAR', payload: response.data as RollingStock });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to move car' });
      throw error;
    }
  }, []);

  // Create industry
  const createIndustry = useCallback(async (data: Partial<Industry>): Promise<Industry> => {
    try {
      const response = await apiService.createIndustry(data);
      const industry = response.data as Industry;
      dispatch({ type: 'ADD_INDUSTRY', payload: industry });
      return industry;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create industry' });
      throw error;
    }
  }, []);

  // Update industry
  const updateIndustry = useCallback(async (id: string, data: Partial<Industry>) => {
    try {
      const response = await apiService.updateIndustry(id, data);
      dispatch({ type: 'UPDATE_INDUSTRY', payload: response.data as Industry });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update industry' });
      throw error;
    }
  }, []);

  // Delete industry
  const deleteIndustry = useCallback(async (id: string) => {
    try {
      await apiService.deleteIndustry(id);
      dispatch({ type: 'DELETE_INDUSTRY', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete industry' });
      throw error;
    }
  }, []);

  // Create route
  const createRoute = useCallback(async (data: Partial<Route>): Promise<Route> => {
    try {
      const response = await apiService.createRoute(data);
      const route = response.data as Route;
      dispatch({ type: 'ADD_ROUTE', payload: route });
      return route;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create route' });
      throw error;
    }
  }, []);

  // Update route
  const updateRoute = useCallback(async (id: string, data: Partial<Route>) => {
    try {
      const response = await apiService.updateRoute(id, data);
      dispatch({ type: 'UPDATE_ROUTE', payload: response.data as Route });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update route' });
      throw error;
    }
  }, []);

  // Delete route
  const deleteRoute = useCallback(async (id: string) => {
    try {
      await apiService.deleteRoute(id);
      dispatch({ type: 'DELETE_ROUTE', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete route' });
      throw error;
    }
  }, []);

  // ========== Train Operations Methods ==========

  // Fetch current session
  const fetchCurrentSession = useCallback(async () => {
    dispatch({ type: 'SET_SESSION_LOADING', payload: true });
    try {
      const response = await apiService.getCurrentSession();
      dispatch({ type: 'SET_CURRENT_SESSION', payload: response.data as OperatingSession });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_SESSION_LOADING', payload: false });
    }
  }, []);

  // Advance session
  const advanceSession = useCallback(async (): Promise<OperatingSession> => {
    dispatch({ type: 'SET_SESSION_LOADING', payload: true });
    try {
      const response = await apiService.advanceSession();
      dispatch({ type: 'SET_CURRENT_SESSION', payload: response.data as OperatingSession });
      // Refresh trains and orders after session advance
      await Promise.all([
        apiService.getTrains().then(r => dispatch({ type: 'SET_TRAINS', payload: r.data || [] })),
        apiService.getCarOrders().then(r => dispatch({ type: 'SET_CAR_ORDERS', payload: r.data || [] })),
      ]);
      return response.data as OperatingSession;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to advance session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_SESSION_LOADING', payload: false });
    }
  }, []);

  // Rollback session
  const rollbackSession = useCallback(async (): Promise<OperatingSession> => {
    dispatch({ type: 'SET_SESSION_LOADING', payload: true });
    try {
      const response = await apiService.rollbackSession();
      dispatch({ type: 'SET_CURRENT_SESSION', payload: response.data as OperatingSession });
      // Refresh all data after rollback
      await fetchData();
      return response.data as OperatingSession;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to rollback session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_SESSION_LOADING', payload: false });
    }
  }, [fetchData]);

  // Update session description
  const updateSessionDescription = useCallback(async (description: string) => {
    dispatch({ type: 'SET_SESSION_LOADING', payload: true });
    try {
      const response = await apiService.updateSessionDescription(description);
      dispatch({ type: 'SET_CURRENT_SESSION', payload: response.data as OperatingSession });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_SESSION_LOADING', payload: false });
    }
  }, []);

  // Fetch trains
  const fetchTrains = useCallback(async (filters?: { sessionNumber?: number; status?: TrainStatus; routeId?: string; search?: string }) => {
    dispatch({ type: 'SET_TRAINS_LOADING', payload: true });
    try {
      const response = await apiService.getTrains(filters);
      dispatch({ type: 'SET_TRAINS', payload: response.data || [] });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch trains' });
      throw error;
    } finally {
      dispatch({ type: 'SET_TRAINS_LOADING', payload: false });
    }
  }, []);

  // Create train
  const createTrain = useCallback(async (data: TrainFormData): Promise<Train> => {
    dispatch({ type: 'SET_TRAINS_LOADING', payload: true });
    try {
      const response = await apiService.createTrain(data);
      const train = response.data as Train;
      dispatch({ type: 'ADD_TRAIN', payload: train });
      return train;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create train' });
      throw error;
    } finally {
      dispatch({ type: 'SET_TRAINS_LOADING', payload: false });
    }
  }, []);

  // Update train
  const updateTrain = useCallback(async (id: string, data: Partial<TrainFormData>) => {
    dispatch({ type: 'SET_TRAINS_LOADING', payload: true });
    try {
      const response = await apiService.updateTrain(id, data);
      dispatch({ type: 'UPDATE_TRAIN', payload: response.data as Train });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update train' });
      throw error;
    } finally {
      dispatch({ type: 'SET_TRAINS_LOADING', payload: false });
    }
  }, []);

  // Delete train
  const deleteTrain = useCallback(async (id: string) => {
    dispatch({ type: 'SET_TRAINS_LOADING', payload: true });
    try {
      await apiService.deleteTrain(id);
      dispatch({ type: 'DELETE_TRAIN', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete train' });
      throw error;
    } finally {
      dispatch({ type: 'SET_TRAINS_LOADING', payload: false });
    }
  }, []);

  // Generate switch list
  const generateSwitchList = useCallback(async (id: string): Promise<Train> => {
    dispatch({ type: 'SET_TRAINS_LOADING', payload: true });
    try {
      const response = await apiService.generateSwitchList(id);
      dispatch({ type: 'UPDATE_TRAIN', payload: response.data as Train });
      return response.data as Train;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to generate switch list' });
      throw error;
    } finally {
      dispatch({ type: 'SET_TRAINS_LOADING', payload: false });
    }
  }, []);

  // Complete train
  const completeTrain = useCallback(async (id: string): Promise<Train> => {
    dispatch({ type: 'SET_TRAINS_LOADING', payload: true });
    try {
      const response = await apiService.completeTrain(id);
      dispatch({ type: 'UPDATE_TRAIN', payload: response.data as Train });
      // Refresh car orders after train completion
      const ordersResponse = await apiService.getCarOrders();
      dispatch({ type: 'SET_CAR_ORDERS', payload: ordersResponse.data || [] });
      return response.data as Train;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to complete train' });
      throw error;
    } finally {
      dispatch({ type: 'SET_TRAINS_LOADING', payload: false });
    }
  }, []);

  // Cancel train
  const cancelTrain = useCallback(async (id: string): Promise<Train> => {
    dispatch({ type: 'SET_TRAINS_LOADING', payload: true });
    try {
      const response = await apiService.cancelTrain(id);
      dispatch({ type: 'UPDATE_TRAIN', payload: response.data as Train });
      // Refresh car orders after train cancellation
      const ordersResponse = await apiService.getCarOrders();
      dispatch({ type: 'SET_CAR_ORDERS', payload: ordersResponse.data || [] });
      return response.data as Train;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to cancel train' });
      throw error;
    } finally {
      dispatch({ type: 'SET_TRAINS_LOADING', payload: false });
    }
  }, []);

  // Fetch car orders
  const fetchCarOrders = useCallback(async (filters?: { industryId?: string; status?: CarOrderStatus; sessionNumber?: number; aarTypeId?: string; search?: string }) => {
    dispatch({ type: 'SET_ORDERS_LOADING', payload: true });
    try {
      const response = await apiService.getCarOrders(filters);
      dispatch({ type: 'SET_CAR_ORDERS', payload: response.data || [] });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch car orders' });
      throw error;
    } finally {
      dispatch({ type: 'SET_ORDERS_LOADING', payload: false });
    }
  }, []);

  // Generate car orders
  const generateCarOrders = useCallback(async (request?: CarOrderGenerationRequest): Promise<CarOrderGenerationSummary> => {
    dispatch({ type: 'SET_ORDERS_LOADING', payload: true });
    try {
      const response = await apiService.generateCarOrders(request);
      // Refresh car orders after generation
      const ordersResponse = await apiService.getCarOrders();
      dispatch({ type: 'SET_CAR_ORDERS', payload: ordersResponse.data || [] });
      return response.data as CarOrderGenerationSummary;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to generate car orders' });
      throw error;
    } finally {
      dispatch({ type: 'SET_ORDERS_LOADING', payload: false });
    }
  }, []);

  // Delete car order
  const deleteCarOrder = useCallback(async (id: string) => {
    dispatch({ type: 'SET_ORDERS_LOADING', payload: true });
    try {
      await apiService.deleteCarOrder(id);
      dispatch({ type: 'DELETE_CAR_ORDER', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete car order' });
      throw error;
    } finally {
      dispatch({ type: 'SET_ORDERS_LOADING', payload: false });
    }
  }, []);

  const contextValue: AppContextType = {
    ...state,
    fetchData,
    importData,
    clearDatabase,
    createCar,
    updateCar,
    deleteCar,
    moveCar,
    createIndustry,
    updateIndustry,
    deleteIndustry,
    createRoute,
    updateRoute,
    deleteRoute,
    // Train operations
    fetchCurrentSession,
    advanceSession,
    rollbackSession,
    updateSessionDescription,
    fetchTrains,
    createTrain,
    updateTrain,
    deleteTrain,
    generateSwitchList,
    completeTrain,
    cancelTrain,
    fetchCarOrders,
    generateCarOrders,
    deleteCarOrder,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
