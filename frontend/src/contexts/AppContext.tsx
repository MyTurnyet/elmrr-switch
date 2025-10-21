import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { AppContextType, RollingStock, Locomotive, Industry, Station, Goods, AarType, Block, Track, ImportResult } from '../types';

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
  | { type: 'UPDATE_CAR'; payload: RollingStock }
  | { type: 'UPDATE_INDUSTRY'; payload: Industry };

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
    case 'UPDATE_CAR':
      return {
        ...state,
        cars: state.cars.map(car => car.id === action.payload.id ? action.payload : car)
      };
    case 'UPDATE_INDUSTRY':
      return {
        ...state,
        industries: state.industries.map(industry => 
          industry.id === action.payload.id ? action.payload : industry
        )
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
      ] = await Promise.all([
        apiCall('/cars'),
        apiCall('/locomotives'),
        apiCall('/industries'),
        apiCall('/stations'),
        apiCall('/goods'),
        apiCall('/aar-types'),
        apiCall('/blocks'),
        apiCall('/tracks'),
      ]);

      dispatch({ type: 'SET_CARS', payload: carsResponse.data });
      dispatch({ type: 'SET_LOCOMOTIVES', payload: locomotivesResponse.data });
      dispatch({ type: 'SET_INDUSTRIES', payload: industriesResponse.data });
      dispatch({ type: 'SET_STATIONS', payload: stationsResponse.data });
      dispatch({ type: 'SET_GOODS', payload: goodsResponse.data });
      dispatch({ type: 'SET_AAR_TYPES', payload: aarTypesResponse.data });
      dispatch({ type: 'SET_BLOCKS', payload: blocksResponse.data });
      dispatch({ type: 'SET_TRACKS', payload: tracksResponse.data });
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

  const contextValue: AppContextType = {
    ...state,
    fetchData,
    importData,
    updateCar,
    moveCar,
    updateIndustry,
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
