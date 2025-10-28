/**
 * API Service Tests for Phase 2.2 Train Operations
 * 
 * Tests all new API methods for:
 * - Operating Sessions
 * - Trains
 * - Car Orders
 * - Routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiService } from '../api';
import type {
  OperatingSession,
  Train,
  CarOrder,
  Route,
  TrainFormData,
  CarOrderGenerationRequest,
  CarOrderGenerationSummary,
} from '../../types';

// Mock fetch globally
globalThis.fetch = vi.fn() as any;

describe('API Service - Train Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFetchSuccess = <T>(data: T) => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data }),
    });
  };

  const mockFetchError = (message: string, status = 400) => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status,
      json: async () => ({ success: false, message }),
    });
  };

  describe('Routes API', () => {
    const mockRoute: Route = {
      _id: 'route123',
      name: 'Portland-Seattle Route',
      description: 'Main line route',
      stationSequence: ['station1', 'station2'],
      originYard: 'yard1',
      terminationYard: 'yard2',
    };

    it('should get all routes', async () => {
      const routes = [mockRoute];
      mockFetchSuccess(routes);

      const result = await apiService.getRoutes();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/routes',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(routes);
    });

    it('should get a single route by id', async () => {
      mockFetchSuccess(mockRoute);

      const result = await apiService.getRoute('route123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/routes/route123',
        expect.any(Object)
      );
      expect(result.data).toEqual(mockRoute);
    });

    it('should create a new route', async () => {
      const newRoute: Partial<Route> = {
        name: 'New Route',
        stationSequence: ['station1'],
        originYard: 'yard1',
        terminationYard: 'yard2',
      };
      mockFetchSuccess(mockRoute);

      const result = await apiService.createRoute(newRoute);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/routes',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newRoute),
        })
      );
      expect(result.data).toEqual(mockRoute);
    });

    it('should update a route', async () => {
      const updates: Partial<Route> = { description: 'Updated description' };
      mockFetchSuccess(mockRoute);

      const result = await apiService.updateRoute('route123', updates);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/routes/route123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );
      expect(result.data).toEqual(mockRoute);
    });

    it('should delete a route', async () => {
      mockFetchSuccess(undefined);

      await apiService.deleteRoute('route123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/routes/route123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle route API errors', async () => {
      mockFetchError('Route not found', 404);

      await expect(apiService.getRoute('invalid')).rejects.toThrow('Route not found');
    });
  });

  describe('Operating Sessions API', () => {
    const mockSession: OperatingSession = {
      _id: 'session1',
      currentSessionNumber: 1,
      sessionDate: '2025-10-28T14:00:00.000Z',
      description: 'Test session',
      previousSessionSnapshot: null,
    };

    it('should get current session', async () => {
      mockFetchSuccess(mockSession);

      const result = await apiService.getCurrentSession();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/sessions/current',
        expect.any(Object)
      );
      expect(result.data).toEqual(mockSession);
    });

    it('should advance session', async () => {
      const advancedSession: OperatingSession = {
        ...mockSession,
        currentSessionNumber: 2,
        previousSessionSnapshot: {
          sessionNumber: 1,
          cars: [],
          trains: [],
          carOrders: [],
        },
      };
      mockFetchSuccess(advancedSession);

      const result = await apiService.advanceSession();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/sessions/advance',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.data?.currentSessionNumber).toBe(2);
      expect(result.data?.previousSessionSnapshot).toBeDefined();
    });

    it('should rollback session', async () => {
      mockFetchSuccess(mockSession);

      const result = await apiService.rollbackSession();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/sessions/rollback',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.data).toEqual(mockSession);
    });

    it('should update session description', async () => {
      const updatedSession = { ...mockSession, description: 'Updated description' };
      mockFetchSuccess(updatedSession);

      const result = await apiService.updateSessionDescription('Updated description');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/sessions/current',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ description: 'Updated description' }),
        })
      );
      expect(result.data?.description).toBe('Updated description');
    });

    it('should handle session API errors', async () => {
      mockFetchError('Cannot rollback from session 1', 400);

      await expect(apiService.rollbackSession()).rejects.toThrow(
        'Cannot rollback from session 1'
      );
    });
  });

  describe('Trains API', () => {
    const mockTrain: Train = {
      _id: 'train123',
      name: 'Portland Local',
      routeId: 'route456',
      sessionNumber: 1,
      status: 'Planned',
      locomotiveIds: ['loco1'],
      maxCapacity: 20,
      assignedCarIds: [],
      createdAt: '2025-10-28T14:00:00.000Z',
      updatedAt: '2025-10-28T14:00:00.000Z',
    };

    it('should get all trains', async () => {
      const trains = [mockTrain];
      mockFetchSuccess(trains);

      const result = await apiService.getTrains();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/trains',
        expect.any(Object)
      );
      expect(result.data).toEqual(trains);
    });

    it('should get trains with filters', async () => {
      const trains = [mockTrain];
      mockFetchSuccess(trains);

      const filters = {
        sessionNumber: 1,
        status: 'Planned' as const,
        routeId: 'route456',
        search: 'Portland',
      };

      const result = await apiService.getTrains(filters);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/trains?sessionNumber=1&status=Planned&routeId=route456&search=Portland',
        expect.any(Object)
      );
      expect(result.data).toEqual(trains);
    });

    it('should handle undefined and null filter values', async () => {
      mockFetchSuccess([mockTrain]);

      await apiService.getTrains({
        sessionNumber: 1,
        status: undefined,
        routeId: 'route456',
      });

      const callUrl = (globalThis.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('sessionNumber=1');
      expect(callUrl).toContain('routeId=route456');
      expect(callUrl).not.toContain('status=');
    });

    it('should get a single train by id', async () => {
      mockFetchSuccess(mockTrain);

      const result = await apiService.getTrain('train123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/trains/train123',
        expect.any(Object)
      );
      expect(result.data).toEqual(mockTrain);
    });

    it('should create a new train', async () => {
      const newTrain: TrainFormData = {
        name: 'New Train',
        routeId: 'route456',
        locomotiveIds: ['loco1', 'loco2'],
        maxCapacity: 25,
      };
      mockFetchSuccess(mockTrain);

      const result = await apiService.createTrain(newTrain);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/trains',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newTrain),
        })
      );
      expect(result.data).toEqual(mockTrain);
    });

    it('should update a train', async () => {
      const updates: Partial<TrainFormData> = { maxCapacity: 30 };
      mockFetchSuccess(mockTrain);

      const result = await apiService.updateTrain('train123', updates);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/trains/train123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );
      expect(result.data).toEqual(mockTrain);
    });

    it('should delete a train', async () => {
      mockFetchSuccess(undefined);

      await apiService.deleteTrain('train123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/trains/train123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should generate switch list', async () => {
      const trainWithSwitchList: Train = {
        ...mockTrain,
        status: 'In Progress',
        switchList: {
          stations: [],
          totalPickups: 2,
          totalSetouts: 1,
          finalCarCount: 3,
          generatedAt: '2025-10-28T14:00:00.000Z',
        },
      };
      mockFetchSuccess(trainWithSwitchList);

      const result = await apiService.generateSwitchList('train123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/trains/train123/generate-switch-list',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.data?.status).toBe('In Progress');
      expect(result.data?.switchList).toBeDefined();
    });

    it('should complete a train', async () => {
      const completedTrain: Train = { ...mockTrain, status: 'Completed' };
      mockFetchSuccess(completedTrain);

      const result = await apiService.completeTrain('train123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/trains/train123/complete',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.data?.status).toBe('Completed');
    });

    it('should cancel a train', async () => {
      const cancelledTrain: Train = { ...mockTrain, status: 'Cancelled' };
      mockFetchSuccess(cancelledTrain);

      const result = await apiService.cancelTrain('train123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/trains/train123/cancel',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.data?.status).toBe('Cancelled');
    });

    it('should handle train API errors', async () => {
      mockFetchError('Train name already exists', 400);

      await expect(
        apiService.createTrain({
          name: 'Duplicate',
          routeId: 'route1',
          locomotiveIds: ['loco1'],
          maxCapacity: 20,
        })
      ).rejects.toThrow('Train name already exists');
    });
  });

  describe('Car Orders API', () => {
    const mockOrder: CarOrder = {
      _id: 'order123',
      industryId: 'industry456',
      aarTypeId: 'boxcar',
      sessionNumber: 1,
      status: 'pending',
      createdAt: '2025-10-28T14:00:00.000Z',
    };

    it('should get all car orders', async () => {
      const orders = [mockOrder];
      mockFetchSuccess(orders);

      const result = await apiService.getCarOrders();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/car-orders',
        expect.any(Object)
      );
      expect(result.data).toEqual(orders);
    });

    it('should get car orders with filters', async () => {
      const orders = [mockOrder];
      mockFetchSuccess(orders);

      const filters = {
        industryId: 'industry456',
        status: 'pending' as const,
        sessionNumber: 1,
        aarTypeId: 'boxcar',
        search: 'test',
      };

      const result = await apiService.getCarOrders(filters);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/car-orders?industryId=industry456&status=pending&sessionNumber=1&aarTypeId=boxcar&search=test',
        expect.any(Object)
      );
      expect(result.data).toEqual(orders);
    });

    it('should get a single car order by id', async () => {
      mockFetchSuccess(mockOrder);

      const result = await apiService.getCarOrder('order123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/car-orders/order123',
        expect.any(Object)
      );
      expect(result.data).toEqual(mockOrder);
    });

    it('should create a new car order', async () => {
      const newOrder: Partial<CarOrder> = {
        industryId: 'industry456',
        aarTypeId: 'boxcar',
        sessionNumber: 1,
      };
      mockFetchSuccess(mockOrder);

      const result = await apiService.createCarOrder(newOrder);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/car-orders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newOrder),
        })
      );
      expect(result.data).toEqual(mockOrder);
    });

    it('should update a car order', async () => {
      const updates: Partial<CarOrder> = { status: 'assigned' };
      mockFetchSuccess({ ...mockOrder, status: 'assigned' });

      const result = await apiService.updateCarOrder('order123', updates);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/car-orders/order123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );
      expect(result.data?.status).toBe('assigned');
    });

    it('should delete a car order', async () => {
      mockFetchSuccess(undefined);

      await apiService.deleteCarOrder('order123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/car-orders/order123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should generate car orders with no parameters', async () => {
      const summary: CarOrderGenerationSummary = {
        totalOrdersGenerated: 10,
        industriesProcessed: 3,
        ordersByIndustry: { ind1: 4, ind2: 3, ind3: 3 },
        ordersByAarType: { boxcar: 6, flatcar: 4 },
      };
      mockFetchSuccess(summary);

      const result = await apiService.generateCarOrders();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/car-orders/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({}),
        })
      );
      expect(result.data).toEqual(summary);
    });

    it('should generate car orders with parameters', async () => {
      const request: CarOrderGenerationRequest = {
        sessionNumber: 2,
        industryIds: ['ind1', 'ind2'],
        force: true,
      };
      const summary: CarOrderGenerationSummary = {
        totalOrdersGenerated: 5,
        industriesProcessed: 2,
        ordersByIndustry: { ind1: 3, ind2: 2 },
        ordersByAarType: { boxcar: 5 },
      };
      mockFetchSuccess(summary);

      const result = await apiService.generateCarOrders(request);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/car-orders/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        })
      );
      expect(result.data).toEqual(summary);
    });

    it('should handle car order API errors', async () => {
      mockFetchError('Duplicate order exists', 400);

      await expect(
        apiService.createCarOrder({
          industryId: 'ind1',
          aarTypeId: 'boxcar',
          sessionNumber: 1,
        })
      ).rejects.toThrow('Duplicate order exists');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network failure'));

      await expect(apiService.getCurrentSession()).rejects.toThrow('Network failure');
    });

    it('should handle non-Error exceptions', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce('String error');

      await expect(apiService.getCurrentSession()).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors without message', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(apiService.getCurrentSession()).rejects.toThrow(
        'HTTP error! status: 500'
      );
    });
  });

  describe('API Base URL', () => {
    it('should use versioned API endpoint', () => {
      mockFetchSuccess({});
      apiService.getCurrentSession();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/'),
        expect.any(Object)
      );
    });
  });
});
