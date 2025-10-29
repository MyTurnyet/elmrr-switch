/**
 * AppContext Locomotive Management Tests
 * 
 * Tests the locomotive management integration in AppContext:
 * - Fetch locomotives with filtering
 * - Fetch locomotive statistics
 * - Create locomotive
 * - Update locomotive
 * - Delete locomotive
 * - Get locomotive assignments
 * - State management and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AppProvider, useApp } from '../AppContext';
import { apiService } from '../../services/api';
import type { ReactNode } from 'react';
import type {
  Locomotive,
  LocomotiveStatistics,
  LocomotiveTrainAssignment,
  LocomotiveFormData,
} from '../../types';

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
    getLocomotiveStatistics: vi.fn(),
    getAvailableLocomotives: vi.fn(),
    getLocomotiveById: vi.fn(),
    getLocomotiveAssignments: vi.fn(),
    createLocomotive: vi.fn(),
    updateLocomotive: vi.fn(),
    deleteLocomotive: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('AppContext - Locomotive Management', () => {
  const mockLocomotive: Locomotive = {
    _id: 'loco123',
    reportingMarks: 'ELMR',
    reportingNumber: '003801',
    model: 'GP38-2',
    manufacturer: 'Atlas',
    isDCC: true,
    dccAddress: 3801,
    dccAddressFormatted: '3801',
    homeYard: 'yard123',
    isInService: true,
    notes: 'Primary road switcher',
    displayName: 'ELMR 003801',
    status: 'In Service',
    dccStatus: 'DCC (3801)',
  };

  const mockLocomotiveFormData: LocomotiveFormData = {
    reportingMarks: 'ELMR',
    reportingNumber: '003801',
    model: 'GP38-2',
    manufacturer: 'Atlas',
    isDCC: true,
    dccAddress: 3801,
    homeYard: 'yard123',
    isInService: true,
    notes: 'Primary road switcher',
  };

  const mockStatistics: LocomotiveStatistics = {
    total: 10,
    inService: 9,
    outOfService: 1,
    dccEnabled: 8,
    dcOnly: 2,
    byManufacturer: { Atlas: 4, Kato: 2 },
    byModel: { 'GP38-2': 3, 'SD40-2': 3 },
    byHomeYard: { 'yard123': 5 },
    availabilityRate: '90.0%',
    dccRate: '80.0%',
  };

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

  describe('fetchLocomotives', () => {
    it('should fetch locomotives without filters', async () => {
      const mockLocomotives = [mockLocomotive];
      (apiService.getLocomotives as any).mockResolvedValue({ data: mockLocomotives });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.fetchLocomotives();
      });

      await waitFor(() => {
        expect(result.current.locomotives).toEqual(mockLocomotives);
      });
      expect(apiService.getLocomotives).toHaveBeenCalledWith(undefined);
    });

    it('should fetch locomotives with filters', async () => {
      const mockLocomotives = [mockLocomotive];
      (apiService.getLocomotives as any).mockResolvedValue({ data: mockLocomotives });

      const { result } = renderHook(() => useApp(), { wrapper });

      const filters = { manufacturer: 'Atlas', isInService: true };
      await act(async () => {
        await result.current.fetchLocomotives(filters);
      });

      await waitFor(() => {
        expect(result.current.locomotives).toEqual(mockLocomotives);
      });
      expect(apiService.getLocomotives).toHaveBeenCalledWith(filters);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch locomotives');
      (apiService.getLocomotives as any).mockRejectedValue(error);

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        try {
          await result.current.fetchLocomotives();
        } catch (e) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch locomotives');
      });
    });
  });

  describe('fetchLocomotiveStatistics', () => {
    it('should fetch locomotive statistics', async () => {
      (apiService.getLocomotiveStatistics as any).mockResolvedValue({ data: mockStatistics });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.fetchLocomotiveStatistics();
      });

      await waitFor(() => {
        expect(result.current.locomotiveStatistics).toEqual(mockStatistics);
      });
      expect(apiService.getLocomotiveStatistics).toHaveBeenCalled();
    });

    it('should handle null statistics', async () => {
      (apiService.getLocomotiveStatistics as any).mockResolvedValue({ data: null });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.fetchLocomotiveStatistics();
      });

      await waitFor(() => {
        expect(result.current.locomotiveStatistics).toBeNull();
      });
    });

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch statistics');
      (apiService.getLocomotiveStatistics as any).mockRejectedValue(error);

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        try {
          await result.current.fetchLocomotiveStatistics();
        } catch (e) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch statistics');
      });
    });
  });

  describe('createLocomotive', () => {
    it('should create a new locomotive', async () => {
      (apiService.createLocomotive as any).mockResolvedValue({ data: mockLocomotive });
      (apiService.getLocomotiveStatistics as any).mockResolvedValue({ data: mockStatistics });

      const { result } = renderHook(() => useApp(), { wrapper });

      let createdLocomotive: Locomotive | undefined;
      await act(async () => {
        createdLocomotive = await result.current.createLocomotive(mockLocomotiveFormData);
      });

      await waitFor(() => {
        expect(result.current.locomotives).toContainEqual(mockLocomotive);
      });
      expect(createdLocomotive).toEqual(mockLocomotive);
      expect(apiService.createLocomotive).toHaveBeenCalledWith(mockLocomotiveFormData);
      expect(apiService.getLocomotiveStatistics).toHaveBeenCalled();
    });

    it('should refresh statistics after creating', async () => {
      (apiService.createLocomotive as any).mockResolvedValue({ data: mockLocomotive });
      (apiService.getLocomotiveStatistics as any).mockResolvedValue({ data: mockStatistics });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.createLocomotive(mockLocomotiveFormData);
      });

      await waitFor(() => {
        expect(result.current.locomotiveStatistics).toEqual(mockStatistics);
      });
    });

    it('should handle validation error', async () => {
      const error = new Error('Validation failed: reportingNumber must be exactly 6 characters');
      (apiService.createLocomotive as any).mockRejectedValue(error);

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        try {
          await result.current.createLocomotive(mockLocomotiveFormData);
        } catch (e) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Validation failed');
      });
    });
  });

  describe('updateLocomotive', () => {
    it('should update an existing locomotive', async () => {
      const updatedLocomotive = { ...mockLocomotive, notes: 'Updated notes' };
      (apiService.updateLocomotive as any).mockResolvedValue({ data: updatedLocomotive });
      (apiService.getLocomotiveStatistics as any).mockResolvedValue({ data: mockStatistics });

      const { result } = renderHook(() => useApp(), { wrapper });

      // Set initial state
      await act(async () => {
        await result.current.fetchData();
      });

      // Update locomotive
      await act(async () => {
        await result.current.updateLocomotive('loco123', { notes: 'Updated notes' });
      });

      expect(apiService.updateLocomotive).toHaveBeenCalledWith('loco123', { notes: 'Updated notes' });
      expect(apiService.getLocomotiveStatistics).toHaveBeenCalled();
    });

    it('should handle not found error', async () => {
      const error = new Error('Locomotive not found');
      (apiService.updateLocomotive as any).mockRejectedValue(error);

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        try {
          await result.current.updateLocomotive('invalid', { notes: 'test' });
        } catch (e) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Locomotive not found');
      });
    });

    it('should handle business rule error', async () => {
      const error = new Error('Cannot set out of service - locomotive is assigned to active trains');
      (apiService.updateLocomotive as any).mockRejectedValue(error);

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        try {
          await result.current.updateLocomotive('loco123', { isInService: false });
        } catch (e) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Cannot set out of service');
      });
    });
  });

  describe('deleteLocomotive', () => {
    it('should delete a locomotive', async () => {
      (apiService.deleteLocomotive as any).mockResolvedValue({});
      (apiService.getLocomotiveStatistics as any).mockResolvedValue({ data: mockStatistics });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.deleteLocomotive('loco123');
      });

      expect(apiService.deleteLocomotive).toHaveBeenCalledWith('loco123');
      expect(apiService.getLocomotiveStatistics).toHaveBeenCalled();
    });

    it('should refresh statistics after deleting', async () => {
      (apiService.deleteLocomotive as any).mockResolvedValue({});
      (apiService.getLocomotiveStatistics as any).mockResolvedValue({ data: mockStatistics });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.deleteLocomotive('loco123');
      });

      await waitFor(() => {
        expect(result.current.locomotiveStatistics).toEqual(mockStatistics);
      });
    });

    it('should handle not found error', async () => {
      const error = new Error('Locomotive not found');
      (apiService.deleteLocomotive as any).mockRejectedValue(error);

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        try {
          await result.current.deleteLocomotive('invalid');
        } catch (e) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Locomotive not found');
      });
    });

    it('should handle assigned to trains error', async () => {
      const error = new Error('Cannot delete locomotive - assigned to 2 active trains');
      (apiService.deleteLocomotive as any).mockRejectedValue(error);

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        try {
          await result.current.deleteLocomotive('loco123');
        } catch (e) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Cannot delete locomotive');
      });
    });
  });

  describe('getLocomotiveAssignments', () => {
    it('should get locomotive train assignments', async () => {
      const mockAssignments: LocomotiveTrainAssignment = {
        isAssigned: true,
        trainCount: 2,
        trains: [
          {
            _id: 'train123',
            name: 'Local 1',
            status: 'Planned',
            sessionNumber: 1,
          },
        ],
      };
      (apiService.getLocomotiveAssignments as any).mockResolvedValue({ data: mockAssignments });

      const { result } = renderHook(() => useApp(), { wrapper });

      let assignments: LocomotiveTrainAssignment | undefined;
      await act(async () => {
        assignments = await result.current.getLocomotiveAssignments('loco123');
      });

      expect(assignments).toEqual(mockAssignments);
      expect(apiService.getLocomotiveAssignments).toHaveBeenCalledWith('loco123');
    });

    it('should handle no assignments', async () => {
      const mockAssignments: LocomotiveTrainAssignment = {
        isAssigned: false,
        trainCount: 0,
        trains: [],
      };
      (apiService.getLocomotiveAssignments as any).mockResolvedValue({ data: mockAssignments });

      const { result } = renderHook(() => useApp(), { wrapper });

      let assignments: LocomotiveTrainAssignment | undefined;
      await act(async () => {
        assignments = await result.current.getLocomotiveAssignments('loco123');
      });

      expect(assignments?.isAssigned).toBe(false);
      expect(assignments?.trainCount).toBe(0);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Failed to get assignments');
      (apiService.getLocomotiveAssignments as any).mockRejectedValue(error);

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        try {
          await result.current.getLocomotiveAssignments('loco123');
        } catch (e) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to get assignments');
      });
    });
  });

  describe('State Management', () => {
    it('should initialize with empty locomotives array', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      expect(result.current.locomotives).toEqual([]);
      expect(result.current.locomotiveStatistics).toBeNull();
    });

    it('should update locomotives state on fetch', async () => {
      const mockLocomotives = [mockLocomotive];
      (apiService.getLocomotives as any).mockResolvedValue({ data: mockLocomotives });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.fetchLocomotives();
      });

      await waitFor(() => {
        expect(result.current.locomotives).toEqual(mockLocomotives);
      });
    });

    it('should add locomotive to state on create', async () => {
      (apiService.createLocomotive as any).mockResolvedValue({ data: mockLocomotive });
      (apiService.getLocomotiveStatistics as any).mockResolvedValue({ data: mockStatistics });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.createLocomotive(mockLocomotiveFormData);
      });

      await waitFor(() => {
        expect(result.current.locomotives).toContainEqual(mockLocomotive);
      });
    });
  });
});
