/**
 * API Service Tests for Locomotive Management
 * 
 * Tests all locomotive API methods:
 * - Get locomotives (with filtering)
 * - Get locomotive statistics
 * - Get available locomotives
 * - Get locomotive by ID
 * - Get locomotive assignments
 * - Create locomotive
 * - Update locomotive
 * - Delete locomotive
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiService } from '../api';
import type {
  Locomotive,
  LocomotiveStatistics,
  LocomotiveTrainAssignment,
  LocomotiveFormData,
} from '../../types';

// Mock fetch globally
globalThis.fetch = vi.fn() as any;

describe('API Service - Locomotive Management', () => {
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

  describe('getLocomotives', () => {
    it('should fetch all locomotives without filters', async () => {
      const mockLocomotives = [mockLocomotive];
      mockFetchSuccess(mockLocomotives);

      const result = await apiService.getLocomotives();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/locomotives',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result.data).toEqual(mockLocomotives);
    });

    it('should fetch locomotives with manufacturer filter', async () => {
      const mockLocomotives = [mockLocomotive];
      mockFetchSuccess(mockLocomotives);

      await apiService.getLocomotives({ manufacturer: 'Atlas' });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/locomotives?manufacturer=Atlas',
        expect.any(Object)
      );
    });

    it('should fetch locomotives with multiple filters', async () => {
      const mockLocomotives = [mockLocomotive];
      mockFetchSuccess(mockLocomotives);

      await apiService.getLocomotives({
        manufacturer: 'Atlas',
        isInService: true,
        isDCC: true,
        search: 'ELMR',
      });

      const call = (globalThis.fetch as any).mock.calls[0][0];
      expect(call).toContain('manufacturer=Atlas');
      expect(call).toContain('isInService=true');
      expect(call).toContain('isDCC=true');
      expect(call).toContain('search=ELMR');
    });

    it('should handle fetch error', async () => {
      mockFetchError('Failed to fetch locomotives');

      await expect(apiService.getLocomotives()).rejects.toThrow(
        'Failed to fetch locomotives'
      );
    });
  });

  describe('getLocomotiveStatistics', () => {
    it('should fetch locomotive statistics', async () => {
      const mockStats: LocomotiveStatistics = {
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
      mockFetchSuccess(mockStats);

      const result = await apiService.getLocomotiveStatistics();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/locomotives/statistics',
        expect.any(Object)
      );
      expect(result.data).toEqual(mockStats);
    });

    it('should handle fetch error', async () => {
      mockFetchError('Failed to fetch statistics');

      await expect(apiService.getLocomotiveStatistics()).rejects.toThrow(
        'Failed to fetch statistics'
      );
    });
  });

  describe('getAvailableLocomotives', () => {
    it('should fetch available locomotives', async () => {
      const mockLocomotives = [mockLocomotive];
      mockFetchSuccess(mockLocomotives);

      const result = await apiService.getAvailableLocomotives();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/locomotives/available',
        expect.any(Object)
      );
      expect(result.data).toEqual(mockLocomotives);
    });
  });

  describe('getLocomotiveById', () => {
    it('should fetch locomotive by ID', async () => {
      mockFetchSuccess(mockLocomotive);

      const result = await apiService.getLocomotiveById('loco123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/locomotives/loco123',
        expect.any(Object)
      );
      expect(result.data).toEqual(mockLocomotive);
    });

    it('should handle not found error', async () => {
      mockFetchError('Locomotive not found', 404);

      await expect(apiService.getLocomotiveById('invalid')).rejects.toThrow(
        'Locomotive not found'
      );
    });
  });

  describe('getLocomotiveAssignments', () => {
    it('should fetch locomotive train assignments', async () => {
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
      mockFetchSuccess(mockAssignments);

      const result = await apiService.getLocomotiveAssignments('loco123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/locomotives/loco123/assignments',
        expect.any(Object)
      );
      expect(result.data).toEqual(mockAssignments);
    });

    it('should handle no assignments', async () => {
      const mockAssignments: LocomotiveTrainAssignment = {
        isAssigned: false,
        trainCount: 0,
        trains: [],
      };
      mockFetchSuccess(mockAssignments);

      const result = await apiService.getLocomotiveAssignments('loco123');

      expect(result.data?.isAssigned).toBe(false);
      expect(result.data?.trainCount).toBe(0);
    });
  });

  describe('createLocomotive', () => {
    it('should create a new locomotive', async () => {
      mockFetchSuccess(mockLocomotive);

      const result = await apiService.createLocomotive(mockLocomotiveFormData);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/locomotives',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockLocomotiveFormData),
        })
      );
      expect(result.data).toEqual(mockLocomotive);
    });

    it('should handle validation error', async () => {
      mockFetchError('Validation failed: reportingNumber must be exactly 6 characters', 400);

      await expect(
        apiService.createLocomotive(mockLocomotiveFormData)
      ).rejects.toThrow('Validation failed');
    });

    it('should handle duplicate error', async () => {
      mockFetchError('Locomotive with reporting marks ELMR and number 003801 already exists', 409);

      await expect(
        apiService.createLocomotive(mockLocomotiveFormData)
      ).rejects.toThrow('already exists');
    });
  });

  describe('updateLocomotive', () => {
    it('should update an existing locomotive', async () => {
      const updates = { notes: 'Updated notes' };
      const updatedLocomotive = { ...mockLocomotive, notes: 'Updated notes' };
      mockFetchSuccess(updatedLocomotive);

      const result = await apiService.updateLocomotive('loco123', updates);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/locomotives/loco123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );
      expect(result.data).toEqual(updatedLocomotive);
    });

    it('should handle not found error', async () => {
      mockFetchError('Locomotive not found', 404);

      await expect(
        apiService.updateLocomotive('invalid', { notes: 'test' })
      ).rejects.toThrow('Locomotive not found');
    });

    it('should handle validation error on update', async () => {
      mockFetchError('Cannot set out of service - locomotive is assigned to active trains', 409);

      await expect(
        apiService.updateLocomotive('loco123', { isInService: false })
      ).rejects.toThrow('Cannot set out of service');
    });
  });

  describe('deleteLocomotive', () => {
    it('should delete a locomotive', async () => {
      mockFetchSuccess(undefined);

      await apiService.deleteLocomotive('loco123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/locomotives/loco123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle not found error', async () => {
      mockFetchError('Locomotive not found', 404);

      await expect(apiService.deleteLocomotive('invalid')).rejects.toThrow(
        'Locomotive not found'
      );
    });

    it('should handle assigned to trains error', async () => {
      mockFetchError('Cannot delete locomotive - assigned to 2 active trains', 409);

      await expect(apiService.deleteLocomotive('loco123')).rejects.toThrow(
        'Cannot delete locomotive'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.getLocomotives()).rejects.toThrow('Network error');
    });

    it('should handle malformed response', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(apiService.getLocomotives()).rejects.toThrow();
    });
  });
});
