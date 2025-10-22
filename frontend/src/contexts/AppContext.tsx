import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { AppContextType, RollingStock, Locomotive, Industry, Station, Goods, AarType, Block, Track, Route, ImportResult } from '../types';

// API base URL
const API_BASE_URL = 'http://localhost:3001/api';

// State interface
interface AppState {
  cars: RollingStock[];
  locomotives: Locomotive[];
  industries: Industry[];
  stations: Station[];
  goods: Goods[];
  aarTypes: AarType[];
  blocks: Block[];
  tracks: Track[];
  routes: Route[];
  loading: boolean;
  error: string | null;
}

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CARS'; payload: RollingStock[] }
  | { type: 'SET_LOCOMOTIVES'; payload: Locomotive[] }
  | { type: 'SET_INDUSTRIES'; payload: Industry[] }
  | { type: 'SET_STATIONS'; payload: Station[] }
  | { type: 'SET_GOODS'; payload: Goods[] }
  | { type: 'SET_AAR_TYPES'; payload: AarType[] }
  | { type: 'SET_BLOCKS'; payload: Block[] }
  | { type: 'SET_TRACKS'; payload: Track[] }
  | { type: 'SET_ROUTES'; payload: Route[] }
  | { type: 'ADD_CAR'; payload: RollingStock }
  | { type: 'UPDATE_CAR'; payload: RollingStock }
  | { type: 'DELETE_CAR'; payload: string }
  | { type: 'ADD_INDUSTRY'; payload: Industry }
  | { type: 'UPDATE_INDUSTRY'; payload: Industry }
  | { type: 'DELETE_INDUSTRY'; payload: string }
  | { type: 'ADD_ROUTE'; payload: Route }
  | { type: 'UPDATE_ROUTE'; payload: Route }
  | { type: 'DELETE_ROUTE'; payload: string };

// Initial state
const initialState: AppState = {
  cars: [],
  locomotives: [],
  industries: [],
  stations: [],
  goods: [],
  aarTypes: [],
  blocks: [],
  tracks: [],
  routes: [],
  loading: false,
  error: null,
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
    default:
      return state;
  }
};

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // API helper function
  const apiCall = async (endpoint: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

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
      ] = await Promise.all([
        apiCall('/cars'),
        apiCall('/locomotives'),
        apiCall('/industries'),
        apiCall('/stations'),
        apiCall('/goods'),
        apiCall('/aar-types'),
        apiCall('/blocks'),
        apiCall('/tracks'),
        apiCall('/routes'),
      ]);

      dispatch({ type: 'SET_CARS', payload: carsResponse.data });
      dispatch({ type: 'SET_LOCOMOTIVES', payload: locomotivesResponse.data });
      dispatch({ type: 'SET_INDUSTRIES', payload: industriesResponse.data });
      dispatch({ type: 'SET_STATIONS', payload: stationsResponse.data });
      dispatch({ type: 'SET_GOODS', payload: goodsResponse.data });
      dispatch({ type: 'SET_AAR_TYPES', payload: aarTypesResponse.data });
      dispatch({ type: 'SET_BLOCKS', payload: blocksResponse.data });
      dispatch({ type: 'SET_TRACKS', payload: tracksResponse.data });
      dispatch({ type: 'SET_ROUTES', payload: routesResponse.data });
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
      const response = await apiCall('/import/json', {
        method: 'POST',
        body: JSON.stringify({ data }),
      });

      // Refresh data after import
      await fetchData();

      return response.data;
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
      await apiCall('/import/clear', {
        method: 'POST',
      });

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
      const response = await apiCall('/cars', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      dispatch({ type: 'ADD_CAR', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create car' });
      throw error;
    }
  }, []);

  // Update car
  const updateCar = useCallback(async (id: string, data: Partial<RollingStock>) => {
    try {
      const response = await apiCall(`/cars/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      dispatch({ type: 'UPDATE_CAR', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update car' });
      throw error;
    }
  }, []);

  // Delete car
  const deleteCar = useCallback(async (id: string) => {
    try {
      await apiCall(`/cars/${id}`, {
        method: 'DELETE',
      });

      dispatch({ type: 'DELETE_CAR', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete car' });
      throw error;
    }
  }, []);

  // Move car
  const moveCar = useCallback(async (carId: string, destinationIndustryId: string) => {
    try {
      const response = await apiCall(`/cars/${carId}/move`, {
        method: 'POST',
        body: JSON.stringify({ destinationIndustryId }),
      });

      dispatch({ type: 'UPDATE_CAR', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to move car' });
      throw error;
    }
  }, []);

  // Create industry
  const createIndustry = useCallback(async (data: Partial<Industry>): Promise<Industry> => {
    try {
      const response = await apiCall('/industries', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      dispatch({ type: 'ADD_INDUSTRY', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create industry' });
      throw error;
    }
  }, []);

  // Update industry
  const updateIndustry = useCallback(async (id: string, data: Partial<Industry>) => {
    try {
      const response = await apiCall(`/industries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      dispatch({ type: 'UPDATE_INDUSTRY', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update industry' });
      throw error;
    }
  }, []);

  // Delete industry
  const deleteIndustry = useCallback(async (id: string) => {
    try {
      await apiCall(`/industries/${id}`, {
        method: 'DELETE',
      });

      dispatch({ type: 'DELETE_INDUSTRY', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete industry' });
      throw error;
    }
  }, []);

  // Create route
  const createRoute = useCallback(async (data: Partial<Route>): Promise<Route> => {
    try {
      const response = await apiCall('/routes', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      dispatch({ type: 'ADD_ROUTE', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create route' });
      throw error;
    }
  }, []);

  // Update route
  const updateRoute = useCallback(async (id: string, data: Partial<Route>) => {
    try {
      const response = await apiCall(`/routes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      dispatch({ type: 'UPDATE_ROUTE', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update route' });
      throw error;
    }
  }, []);

  // Delete route
  const deleteRoute = useCallback(async (id: string) => {
    try {
      await apiCall(`/routes/${id}`, {
        method: 'DELETE',
      });

      dispatch({ type: 'DELETE_ROUTE', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete route' });
      throw error;
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
