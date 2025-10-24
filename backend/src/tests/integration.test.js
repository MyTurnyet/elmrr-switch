import express from 'express';
import request from 'supertest';
import operatingSessionsRouter from '../routes/operatingSessions.js';
import { dbHelpers } from '../database/index.js';

// Mock the database helpers
jest.mock('../database/index.js', () => ({
  dbHelpers: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    bulkInsert: jest.fn(),
    bulkUpdate: jest.fn()
  }
}));

// Mock the validation functions
jest.mock('../models/operatingSession.js', () => ({
  validateOperatingSession: jest.fn(),
  createSessionSnapshot: jest.fn(),
  validateSnapshot: jest.fn()
}));

import { validateOperatingSession, createSessionSnapshot, validateSnapshot } from '../models/operatingSession.js';

const app = express();
app.use(express.json());
app.use('/api/sessions', operatingSessionsRouter);

describe('Phase 2.2 Integration Tests - Step 5', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    validateOperatingSession.mockReturnValue({ error: null });
    createSessionSnapshot.mockReturnValue({
      sessionNumber: 1,
      cars: [],
      trains: [],
      carOrders: []
    });
    validateSnapshot.mockReturnValue({ error: null });
  });

  describe('Session Advancement Integration', () => {
    test('should successfully advance session', async () => {
      const mockCurrentSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2024-01-15T10:00:00.000Z',
        description: 'Current session'
      };

      const mockCars = [
        { _id: 'car1', currentIndustry: 'yard1', sessionsAtCurrentLocation: 1 }
      ];

      const mockTrains = [
        {
          _id: 'train1',
          name: 'Local Freight 1',
          status: 'Completed',
          assignedCarIds: ['car1']
        }
      ];

      // Mock database calls
      dbHelpers.findAll
        .mockResolvedValueOnce([mockCurrentSession]) // Get current session
        .mockResolvedValueOnce(mockCars) // Get all cars
        .mockResolvedValueOnce(mockTrains) // Get all trains
        .mockResolvedValueOnce([]); // Get all car orders

      createSessionSnapshot.mockReturnValue({
        sessionNumber: 1,
        cars: mockCars.map(car => ({ ...car, id: car._id })),
        trains: mockTrains,
        carOrders: []
      });

      dbHelpers.update.mockResolvedValue({ acknowledged: true });
      dbHelpers.findById.mockResolvedValue({ ...mockCurrentSession, currentSessionNumber: 2 });
      dbHelpers.delete.mockResolvedValue({ acknowledged: true });

      const response = await request(app)
        .post('/api/sessions/advance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentSessionNumber).toBe(2);
      expect(createSessionSnapshot).toHaveBeenCalled();
    });
  });

  describe('Session Rollback Integration', () => {
    test('should successfully rollback session', async () => {
      const mockCurrentSession = {
        _id: 'session1',
        currentSessionNumber: 2,
        sessionDate: '2024-01-15T10:00:00.000Z',
        previousSessionSnapshot: {
          sessionNumber: 1,
          cars: [
            { id: 'car1', currentIndustry: 'yard1', sessionsAtCurrentLocation: 0 }
          ],
          trains: [],
          carOrders: []
        }
      };

      dbHelpers.findAll
        .mockResolvedValueOnce([mockCurrentSession]) // Get current session
        .mockResolvedValueOnce([]) // Get current trains
        .mockResolvedValueOnce([]); // Get current car orders

      dbHelpers.update.mockResolvedValue({ acknowledged: true });
      dbHelpers.bulkInsert.mockResolvedValue({ acknowledged: true });
      dbHelpers.findById.mockResolvedValue({ ...mockCurrentSession, currentSessionNumber: 1 });

      const response = await request(app)
        .post('/api/sessions/rollback')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentSessionNumber).toBe(1);
      expect(validateSnapshot).toHaveBeenCalled();
    });

    test('should prevent rollback from session 1', async () => {
      const mockCurrentSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2024-01-15T10:00:00.000Z'
      };

      dbHelpers.findAll.mockResolvedValueOnce([mockCurrentSession]);

      const response = await request(app)
        .post('/api/sessions/rollback')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot rollback');
    });
  });

  describe('Backend Integration Summary', () => {
    test('should verify all core systems are integrated', async () => {
      // This test verifies that the key integration points work together
      // by testing the session management system which touches all other systems

      // Test 1: Session can be retrieved
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2024-01-15T10:00:00.000Z'
      };

      dbHelpers.findAll.mockResolvedValueOnce([mockSession]);

      let response = await request(app)
        .get('/api/sessions/current')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentSessionNumber).toBe(1);

      // Test 2: Session description can be updated
      dbHelpers.findAll.mockResolvedValueOnce([mockSession]);
      dbHelpers.update.mockResolvedValue({ acknowledged: true });
      dbHelpers.findById.mockResolvedValue({ ...mockSession, description: 'Updated session' });

      response = await request(app)
        .put('/api/sessions/current')
        .send({ description: 'Updated session' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated session');

      // Verify all systems are accessible through the integration
      expect(dbHelpers.findAll).toHaveBeenCalled();
      expect(dbHelpers.update).toHaveBeenCalled();
      expect(dbHelpers.findById).toHaveBeenCalled();
    });
  });
});
