/**
 * AppContext Train Operations Tests
 * 
 * Tests the train operations integration in AppContext:
 * - Session management (fetch, advance, rollback, update)
 * - Train management (CRUD, generate switch list, complete, cancel)
 * - Car order management (fetch, generate, delete)
 * - State management and loading states
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AppProvider, useApp } from '../AppContext';
import { apiService } from '../../services/api';
import type { ReactNode } from 'react';

// Mock apiService
vi.mock('../../services/api', () => ({
  apiService: {
    getCars: vi.fn(),
    getLocomotives: vi.fn(),
    getIndustries: vi.fn(),
    getStations: vi.fn(),
    getGoods: vi.fn(),
    getAarTypes: vi.fn(),
    getBlocks: vi.fn(),
    getTracks: vi.fn(),
    getRoutes: vi.fn(),
    getCurrentSession: vi.fn(),
    advanceSession: vi.fn(),
    rollbackSession: vi.fn(),
    updateSessionDescription: vi.fn(),
    getTrains: vi.fn(),
    createTrain: vi.fn(),
    updateTrain: vi.fn(),
    deleteTrain: vi.fn(),
    generateSwitchList: vi.fn(),
    completeTrain: vi.fn(),
    cancelTrain: vi.fn(),
    getCarOrders: vi.fn(),
    generateCarOrders: vi.fn(),
    deleteCarOrder: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('AppContext - Train Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses for fetchData
    (apiService.getCars as any).mockResolvedValue({ data: [] });
    (apiService.getLocomotives as any).mockResolvedValue({ data: [] });
    (apiService.getIndustries as any).mockResolvedValue({ data: [] });
    (apiService.getStations as any).mockResolvedValue({ data: [] });
    (apiService.getGoods as any).mockResolvedValue({ data: [] });
    (apiService.getAarTypes as any).mockResolvedValue({ data: [] });
    (apiService.getBlocks as any).mockResolvedValue({ data: [] });
    (apiService.getTracks as any).mockResolvedValue({ data: [] });
    (apiService.getRoutes as any).mockResolvedValue({ data: [] });
    (apiService.getCurrentSession as any).mockResolvedValue({ data: null });
  });

  describe('Session Management', () => {
    it('should fetch current session', async () => {
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2025-10-28T14:00:00.000Z',
        description: 'Test session',
        previousSessionSnapshot: null,
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.fetchCurrentSession();
      });

      await waitFor(() => {
        expect(result.current.currentSession).toEqual(mockSession);
        expect(result.current.sessionLoading).toBe(false);
      });
    });

    it('should advance session and refresh data', async () => {
      const advancedSession = {
        _id: 'session1',
        currentSessionNumber: 2,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: {
          sessionNumber: 1,
          cars: [],
          trains: [],
          carOrders: [],
        },
      };
      (apiService.advanceSession as any).mockResolvedValue({ data: advancedSession });
      (apiService.getTrains as any).mockResolvedValue({ data: [] });
      (apiService.getCarOrders as any).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        const session = await result.current.advanceSession();
        expect(session).toEqual(advancedSession);
      });

      await waitFor(() => {
        expect(result.current.currentSession?.currentSessionNumber).toBe(2);
        expect(apiService.getTrains).toHaveBeenCalled();
        expect(apiService.getCarOrders).toHaveBeenCalled();
      });
    });

    it('should rollback session and refresh all data', async () => {
      const rolledBackSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: null,
      };
      (apiService.rollbackSession as any).mockResolvedValue({ data: rolledBackSession });
      // Mock getCurrentSession for fetchData call
      (apiService.getCurrentSession as any).mockResolvedValue({ data: rolledBackSession });

      const { result } = renderHook(() => useApp(), { wrapper });

      let session;
      await act(async () => {
        session = await result.current.rollbackSession();
      });

      expect(session).toEqual(rolledBackSession);
      
      await waitFor(() => {
        // fetchData should be called after rollback
        expect(apiService.getCars).toHaveBeenCalled();
        // Session should be set after fetchData completes
        expect(result.current.currentSession).toEqual(rolledBackSession);
      }, { timeout: 2000 });
    });

    it('should update session description', async () => {
      const updatedSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2025-10-28T14:00:00.000Z',
        description: 'Updated description',
        previousSessionSnapshot: null,
      };
      (apiService.updateSessionDescription as any).mockResolvedValue({ data: updatedSession });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.updateSessionDescription('Updated description');
      });

      await waitFor(() => {
        expect(result.current.currentSession?.description).toBe('Updated description');
      });
    });

    it('should handle session errors', async () => {
      (apiService.getCurrentSession as any).mockRejectedValue(new Error('Session not found'));

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await expect(result.current.fetchCurrentSession()).rejects.toThrow('Session not found');
      });

      await waitFor(() => {
        // Error message is the original error message
        expect(result.current.error).toBe('Session not found');
      });
    });
  });

  describe('Train Management', () => {
    it('should fetch trains', async () => {
      const mockTrains = [
        {
          _id: 'train1',
          name: 'Portland Local',
          routeId: 'route1',
          sessionNumber: 1,
          status: 'Planned' as const,
          locomotiveIds: ['loco1'],
          maxCapacity: 20,
          assignedCarIds: [],
          createdAt: '2025-10-28T14:00:00.000Z',
          updatedAt: '2025-10-28T14:00:00.000Z',
        },
      ];
      (apiService.getTrains as any).mockResolvedValue({ data: mockTrains });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.fetchTrains();
      });

      await waitFor(() => {
        expect(result.current.trains).toEqual(mockTrains);
        expect(result.current.trainsLoading).toBe(false);
      });
    });

    it('should fetch trains with filters', async () => {
      (apiService.getTrains as any).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.fetchTrains({
          sessionNumber: 1,
          status: 'Planned',
          routeId: 'route1',
        });
      });

      expect(apiService.getTrains).toHaveBeenCalledWith({
        sessionNumber: 1,
        status: 'Planned',
        routeId: 'route1',
      });
    });

    it('should create train', async () => {
      const newTrain = {
        _id: 'train1',
        name: 'New Train',
        routeId: 'route1',
        sessionNumber: 1,
        status: 'Planned' as const,
        locomotiveIds: ['loco1'],
        maxCapacity: 20,
        assignedCarIds: [],
        createdAt: '2025-10-28T14:00:00.000Z',
        updatedAt: '2025-10-28T14:00:00.000Z',
      };
      (apiService.createTrain as any).mockResolvedValue({ data: newTrain });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        const train = await result.current.createTrain({
          name: 'New Train',
          routeId: 'route1',
          locomotiveIds: ['loco1'],
          maxCapacity: 20,
        });
        expect(train).toEqual(newTrain);
      });

      await waitFor(() => {
        expect(result.current.trains).toContainEqual(newTrain);
      });
    });

    it('should update train', async () => {
      const updatedTrain = {
        _id: 'train1',
        name: 'Updated Train',
        routeId: 'route1',
        sessionNumber: 1,
        status: 'Planned' as const,
        locomotiveIds: ['loco1'],
        maxCapacity: 25,
        assignedCarIds: [],
        createdAt: '2025-10-28T14:00:00.000Z',
        updatedAt: '2025-10-28T14:00:00.000Z',
      };
      (apiService.updateTrain as any).mockResolvedValue({ data: updatedTrain });

      const { result } = renderHook(() => useApp(), { wrapper });

      // Add initial train
      act(() => {
        result.current.trains.push({
          _id: 'train1',
          name: 'Old Name',
          routeId: 'route1',
          sessionNumber: 1,
          status: 'Planned',
          locomotiveIds: ['loco1'],
          maxCapacity: 20,
          assignedCarIds: [],
          createdAt: '2025-10-28T14:00:00.000Z',
          updatedAt: '2025-10-28T14:00:00.000Z',
        });
      });

      await act(async () => {
        await result.current.updateTrain('train1', { maxCapacity: 25 });
      });

      await waitFor(() => {
        const train = result.current.trains.find(t => t._id === 'train1');
        expect(train?.maxCapacity).toBe(25);
      });
    });

    it('should delete train', async () => {
      (apiService.deleteTrain as any).mockResolvedValue({});

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.deleteTrain('train1');
      });

      expect(apiService.deleteTrain).toHaveBeenCalledWith('train1');
    });

    it('should generate switch list', async () => {
      const trainWithSwitchList = {
        _id: 'train1',
        name: 'Portland Local',
        routeId: 'route1',
        sessionNumber: 1,
        status: 'In Progress' as const,
        locomotiveIds: ['loco1'],
        maxCapacity: 20,
        assignedCarIds: [],
        createdAt: '2025-10-28T14:00:00.000Z',
        updatedAt: '2025-10-28T14:00:00.000Z',
        switchList: {
          stations: [],
          totalPickups: 2,
          totalSetouts: 1,
          finalCarCount: 3,
          generatedAt: '2025-10-28T14:00:00.000Z',
        },
      };
      (apiService.generateSwitchList as any).mockResolvedValue({ data: trainWithSwitchList });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        const train = await result.current.generateSwitchList('train1');
        expect(train.status).toBe('In Progress');
        expect(train.switchList).toBeDefined();
      });
    });

    it('should complete train and refresh orders', async () => {
      const completedTrain = {
        _id: 'train1',
        name: 'Portland Local',
        routeId: 'route1',
        sessionNumber: 1,
        status: 'Completed' as const,
        locomotiveIds: ['loco1'],
        maxCapacity: 20,
        assignedCarIds: [],
        createdAt: '2025-10-28T14:00:00.000Z',
        updatedAt: '2025-10-28T14:00:00.000Z',
      };
      (apiService.completeTrain as any).mockResolvedValue({ data: completedTrain });
      (apiService.getCarOrders as any).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        const train = await result.current.completeTrain('train1');
        expect(train.status).toBe('Completed');
      });

      await waitFor(() => {
        expect(apiService.getCarOrders).toHaveBeenCalled();
      });
    });

    it('should cancel train and refresh orders', async () => {
      const cancelledTrain = {
        _id: 'train1',
        name: 'Portland Local',
        routeId: 'route1',
        sessionNumber: 1,
        status: 'Cancelled' as const,
        locomotiveIds: ['loco1'],
        maxCapacity: 20,
        assignedCarIds: [],
        createdAt: '2025-10-28T14:00:00.000Z',
        updatedAt: '2025-10-28T14:00:00.000Z',
      };
      (apiService.cancelTrain as any).mockResolvedValue({ data: cancelledTrain });
      (apiService.getCarOrders as any).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        const train = await result.current.cancelTrain('train1');
        expect(train.status).toBe('Cancelled');
      });

      await waitFor(() => {
        expect(apiService.getCarOrders).toHaveBeenCalled();
      });
    });
  });

  describe('Car Order Management', () => {
    it('should fetch car orders', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          industryId: 'industry1',
          aarTypeId: 'boxcar',
          sessionNumber: 1,
          status: 'pending' as const,
          createdAt: '2025-10-28T14:00:00.000Z',
        },
      ];
      (apiService.getCarOrders as any).mockResolvedValue({ data: mockOrders });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.fetchCarOrders();
      });

      await waitFor(() => {
        expect(result.current.carOrders).toEqual(mockOrders);
        expect(result.current.ordersLoading).toBe(false);
      });
    });

    it('should fetch car orders with filters', async () => {
      (apiService.getCarOrders as any).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.fetchCarOrders({
          industryId: 'industry1',
          status: 'pending',
          sessionNumber: 1,
        });
      });

      expect(apiService.getCarOrders).toHaveBeenCalledWith({
        industryId: 'industry1',
        status: 'pending',
        sessionNumber: 1,
      });
    });

    it('should generate car orders and refresh', async () => {
      const summary = {
        totalOrdersGenerated: 10,
        industriesProcessed: 3,
        ordersByIndustry: { ind1: 4, ind2: 3, ind3: 3 },
        ordersByAarType: { boxcar: 6, flatcar: 4 },
      };
      (apiService.generateCarOrders as any).mockResolvedValue({ data: summary });
      (apiService.getCarOrders as any).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        const result_summary = await result.current.generateCarOrders();
        expect(result_summary).toEqual(summary);
      });

      await waitFor(() => {
        expect(apiService.getCarOrders).toHaveBeenCalled();
      });
    });

    it('should delete car order', async () => {
      (apiService.deleteCarOrder as any).mockResolvedValue({});

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.deleteCarOrder('order1');
      });

      expect(apiService.deleteCarOrder).toHaveBeenCalledWith('order1');
    });
  });

  describe('Loading States', () => {
    it('should set sessionLoading during session operations', async () => {
      (apiService.getCurrentSession as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: null }), 100))
      );

      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.fetchCurrentSession();
      });

      // Should be loading
      expect(result.current.sessionLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.sessionLoading).toBe(false);
      });
    });

    it('should set trainsLoading during train operations', async () => {
      (apiService.getTrains as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
      );

      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.fetchTrains();
      });

      // Should be loading
      expect(result.current.trainsLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.trainsLoading).toBe(false);
      });
    });

    it('should set ordersLoading during order operations', async () => {
      (apiService.getCarOrders as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
      );

      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.fetchCarOrders();
      });

      // Should be loading
      expect(result.current.ordersLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.ordersLoading).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle train operation errors', async () => {
      (apiService.getTrains as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await expect(result.current.fetchTrains()).rejects.toThrow('Network error');
      });

      await waitFor(() => {
        // Error message is the original error message
        expect(result.current.error).toBe('Network error');
      });
    });

    it('should handle car order errors', async () => {
      (apiService.generateCarOrders as any).mockRejectedValue(new Error('Generation failed'));

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await expect(result.current.generateCarOrders()).rejects.toThrow('Generation failed');
      });

      await waitFor(() => {
        // Error message is the original error message
        expect(result.current.error).toBe('Generation failed');
      });
    });
  });
});
