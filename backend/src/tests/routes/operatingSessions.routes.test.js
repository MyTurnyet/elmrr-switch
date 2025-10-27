import express from 'express';
import request from 'supertest';
import operatingSessionsRouter from '../../routes/operatingSessions.js';
import { dbHelpers } from '../../database/index.js';
import { ApiError } from '../../middleware/errorHandler.js';

// Mock the database helpers
jest.mock('../../database/index.js', () => ({
  dbHelpers: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    bulkInsert: jest.fn()
  }
}));

// Mock the validation functions
jest.mock('../../models/operatingSession.js', () => ({
  validateOperatingSession: jest.fn(),
  createSessionSnapshot: jest.fn(),
  validateSnapshot: jest.fn()
}));

import { validateOperatingSession, createSessionSnapshot, validateSnapshot } from '../../models/operatingSession.js';

const app = express();
app.use(express.json());
app.use('/api/sessions', operatingSessionsRouter);

// Add error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      details: error.details
    });
  }
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

describe('Operating Sessions Routes', () => {
  const mockSession = {
    _id: 'session1',
    currentSessionNumber: 3,
    sessionDate: '2024-01-15T10:00:00.000Z',
    description: 'Test operating session',
    previousSessionSnapshot: {
      sessionNumber: 2,
      cars: [
        { id: 'car1', currentIndustry: 'yard1', sessionsAtCurrentLocation: 1 }
      ],
      trains: [],
      carOrders: []
    }
  };

  const mockCars = [
    { _id: 'car1', currentIndustry: 'yard1', sessionsAtCurrentLocation: 2 },
    { _id: 'car2', currentIndustry: 'industry1', sessionsAtCurrentLocation: 0 }
  ];

  const mockTrains = [
    { _id: 'train1', status: 'Completed', assignedCarIds: ['car1'] },
    { _id: 'train2', status: 'In Progress', assignedCarIds: ['car2'] },
    { _id: 'train3', status: 'Planned', assignedCarIds: [] }
  ];

  const mockCarOrders = [
    { _id: 'order1', status: 'pending' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /current', () => {
    it('should return existing session', async () => {
      dbHelpers.findAll.mockResolvedValue([mockSession]);

      const response = await request(app)
        .get('/api/sessions/current')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSession);
      expect(dbHelpers.findAll).toHaveBeenCalledWith('operatingSessions');
    });

    it('should create initial session if none exists', async () => {
      dbHelpers.findAll.mockResolvedValue([]);
      validateOperatingSession.mockReturnValue({ 
        error: null, 
        value: {
          currentSessionNumber: 1,
          sessionDate: expect.any(String),
          description: 'Initial operating session',
          previousSessionSnapshot: null
        }
      });
      dbHelpers.create.mockResolvedValue({
        _id: 'new-session',
        currentSessionNumber: 1,
        sessionDate: '2024-01-15T10:00:00.000Z',
        description: 'Initial operating session',
        previousSessionSnapshot: null
      });

      const response = await request(app)
        .get('/api/sessions/current')
        .expect(200);

      expect(validateOperatingSession).toHaveBeenCalled();
      expect(dbHelpers.create).toHaveBeenCalledWith('operatingSessions', expect.any(Object));
      expect(response.body.success).toBe(true);
    });

    it('should handle validation error during initial session creation', async () => {
      dbHelpers.findAll.mockResolvedValue([]);
      validateOperatingSession.mockReturnValue({ 
        error: { details: [{ message: 'Validation failed' }] }
      });

      const response = await request(app)
        .get('/api/sessions/current')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to create initial session',
        message: 'Validation failed'
      });
    });

    it('should handle database errors', async () => {
      dbHelpers.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/sessions/current')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch current session',
        message: 'Database error'
      });
    });
  });

  describe('POST /advance', () => {
    // Remove the beforeEach that was interfering with individual test setups

    it('should advance session successfully', async () => {
      jest.clearAllMocks();
      
      // Setup mocks for successful advance
      dbHelpers.findAll
        .mockResolvedValueOnce([mockSession]) // operatingSessions
        .mockResolvedValueOnce(mockCars) // cars
        .mockResolvedValueOnce(mockTrains) // trains
        .mockResolvedValueOnce(mockCarOrders); // carOrders
      
      createSessionSnapshot.mockReturnValue({
        sessionNumber: 3,
        cars: mockCars.map(car => ({
          id: car._id,
          currentIndustry: car.currentIndustry,
          sessionsAtCurrentLocation: car.sessionsAtCurrentLocation
        })),
        trains: mockTrains,
        carOrders: mockCarOrders
      });

      validateSnapshot.mockReturnValue({ error: null });
      dbHelpers.update.mockResolvedValue(1);
      dbHelpers.delete.mockResolvedValue(1);
      dbHelpers.findById.mockResolvedValue({
        ...mockSession,
        currentSessionNumber: 4
      });

      const response = await request(app)
        .post('/api/sessions/advance')
        .send({ description: 'Session 4' })
        .expect(200);

      expect(createSessionSnapshot).toHaveBeenCalledWith(3, mockCars, mockTrains, mockCarOrders);
      expect(dbHelpers.update).toHaveBeenCalledWith('operatingSessions', 'session1', {
        currentSessionNumber: 4,
        sessionDate: expect.any(String),
        description: 'Session 4',
        previousSessionSnapshot: expect.any(Object)
      });

      // Should update all cars
      expect(dbHelpers.update).toHaveBeenCalledWith('cars', 'car1', {
        sessionsAtCurrentLocation: 3
      });
      expect(dbHelpers.update).toHaveBeenCalledWith('cars', 'car2', {
        sessionsAtCurrentLocation: 1
      });

      // Should delete completed trains
      expect(dbHelpers.delete).toHaveBeenCalledWith('trains', 'train1');

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Session 4');
      expect(response.body.stats).toEqual({
        trainsDeleted: 1,
        carsUpdated: 2,
        activeTrainsReverted: 2
      });
    });

    it('should handle missing session', async () => {
      // Reset all mocks for this test
      jest.clearAllMocks();
      dbHelpers.findAll.mockResolvedValue([]); // No sessions

      const response = await request(app)
        .post('/api/sessions/advance')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'No current session found'
      });
    });

    it('should handle snapshot validation error', async () => {
      // Reset mocks and set up for this specific test
      jest.clearAllMocks();
      dbHelpers.findAll
        .mockResolvedValueOnce([mockSession]) // operatingSessions
        .mockResolvedValueOnce(mockCars) // cars
        .mockResolvedValueOnce(mockTrains) // trains
        .mockResolvedValueOnce(mockCarOrders); // carOrders
      
      createSessionSnapshot.mockReturnValue({
        sessionNumber: 3,
        cars: [],
        trains: [],
        carOrders: []
      });

      validateSnapshot.mockReturnValue({ 
        error: { details: [{ message: 'Invalid snapshot' }] }
      });

      const response = await request(app)
        .post('/api/sessions/advance')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to create session snapshot',
        message: 'Invalid snapshot'
      });
    });

    it('should revert cars from active trains', async () => {
      jest.clearAllMocks();
      
      // Setup mocks
      dbHelpers.findAll
        .mockResolvedValueOnce([mockSession]) // operatingSessions
        .mockResolvedValueOnce(mockCars) // cars
        .mockResolvedValueOnce(mockTrains) // trains
        .mockResolvedValueOnce(mockCarOrders); // carOrders

      const snapshot = {
        sessionNumber: 3,
        cars: [
          { id: 'car2', currentIndustry: 'original-location', sessionsAtCurrentLocation: 5 }
        ],
        trains: mockTrains,
        carOrders: mockCarOrders
      };

      createSessionSnapshot.mockReturnValue(snapshot);
      validateSnapshot.mockReturnValue({ error: null });
      dbHelpers.update.mockResolvedValue(1);
      dbHelpers.delete.mockResolvedValue(1);
      dbHelpers.findById.mockResolvedValue({
        ...mockSession,
        currentSessionNumber: 4
      });

      await request(app)
        .post('/api/sessions/advance')
        .expect(200);

      // Should revert car2 from active train to original location
      expect(dbHelpers.update).toHaveBeenCalledWith('cars', 'car2', {
        currentIndustry: 'original-location',
        sessionsAtCurrentLocation: 0
      });
    });

    it('should use default description if not provided', async () => {
      jest.clearAllMocks();
      
      // Setup mocks
      dbHelpers.findAll
        .mockResolvedValueOnce([mockSession]) // operatingSessions
        .mockResolvedValueOnce(mockCars) // cars
        .mockResolvedValueOnce(mockTrains) // trains
        .mockResolvedValueOnce(mockCarOrders); // carOrders
      
      createSessionSnapshot.mockReturnValue({
        sessionNumber: 3,
        cars: [],
        trains: [],
        carOrders: []
      });

      validateSnapshot.mockReturnValue({ error: null });
      dbHelpers.update.mockResolvedValue(1);
      dbHelpers.delete.mockResolvedValue(1);
      dbHelpers.findById.mockResolvedValue({
        ...mockSession,
        currentSessionNumber: 4
      });

      await request(app)
        .post('/api/sessions/advance')
        .send({})
        .expect(200);

      expect(dbHelpers.update).toHaveBeenCalledWith('operatingSessions', 'session1', 
        expect.objectContaining({
          description: 'Operating Session 4'
        })
      );
    });
  });

  describe('POST /rollback', () => {
    it('should rollback session successfully', async () => {
      jest.clearAllMocks();
      dbHelpers.findAll
        .mockResolvedValueOnce([mockSession]) // operatingSessions
        .mockResolvedValueOnce(mockTrains) // current trains
        .mockResolvedValueOnce(mockCarOrders); // current car orders
      
      validateSnapshot.mockReturnValue({ error: null });
      dbHelpers.update.mockResolvedValue(1);
      dbHelpers.delete.mockResolvedValue(1);
      dbHelpers.bulkInsert.mockResolvedValue([]);
      dbHelpers.findById.mockResolvedValue({
        ...mockSession,
        currentSessionNumber: 2,
        previousSessionSnapshot: null
      });

      const response = await request(app)
        .post('/api/sessions/rollback')
        .expect(200);

      // Should restore car locations
      expect(dbHelpers.update).toHaveBeenCalledWith('cars', 'car1', {
        currentIndustry: 'yard1',
        sessionsAtCurrentLocation: 1
      });

      // Should delete current trains and restore from snapshot
      // mockTrains = 3, mockCarOrders = 1, so 4 delete calls total
      expect(dbHelpers.delete).toHaveBeenCalledTimes(4);

      // Should update session
      expect(dbHelpers.update).toHaveBeenCalledWith('operatingSessions', 'session1', {
        currentSessionNumber: 2,
        sessionDate: expect.any(String),
        description: 'Rolled back to Session 2',
        previousSessionSnapshot: null
      });

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Session 2');
    });

    it('should prevent rollback from session 1', async () => {
      jest.clearAllMocks();
      // Session 1 should not have any snapshot, but the check is session number first
      const session1 = { 
        ...mockSession, 
        currentSessionNumber: 1, 
        previousSessionSnapshot: { // Even with snapshot, session 1 check comes first
          sessionNumber: 0,
          cars: [],
          trains: [],
          carOrders: []
        }
      };
      dbHelpers.findAll.mockResolvedValue([session1]);

      const response = await request(app)
        .post('/api/sessions/rollback')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Cannot rollback',
        message: 'Cannot rollback from session 1'
      });
    });

    it('should prevent rollback without snapshot', async () => {
      jest.clearAllMocks();
      const sessionNoSnapshot = { 
        ...mockSession, 
        currentSessionNumber: 2,
        previousSessionSnapshot: null 
      };
      dbHelpers.findAll.mockResolvedValue([sessionNoSnapshot]);

      const response = await request(app)
        .post('/api/sessions/rollback')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Cannot rollback',
        message: 'No previous session snapshot available'
      });
    });

    it('should handle invalid snapshot', async () => {
      dbHelpers.findAll.mockResolvedValue([mockSession]);
      validateSnapshot.mockReturnValue({ 
        error: { details: [{ message: 'Invalid snapshot structure' }] }
      });

      const response = await request(app)
        .post('/api/sessions/rollback')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid session snapshot',
        message: 'Invalid snapshot structure'
      });
    });

    it('should handle missing session', async () => {
      dbHelpers.findAll.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/sessions/rollback')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'No current session found'
      });
    });
  });

  describe('PUT /current', () => {
    beforeEach(() => {
      dbHelpers.findAll.mockResolvedValue([mockSession]);
      dbHelpers.update.mockResolvedValue(1);
      dbHelpers.findById.mockResolvedValue({
        ...mockSession,
        description: 'Updated description'
      });
    });

    it('should update session description successfully', async () => {
      const response = await request(app)
        .put('/api/sessions/current')
        .send({ description: 'Updated description' })
        .expect(200);

      expect(dbHelpers.update).toHaveBeenCalledWith('operatingSessions', 'session1', {
        description: 'Updated description'
      });

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Session description updated successfully');
    });

    it('should require description', async () => {
      const response = await request(app)
        .put('/api/sessions/current')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Validation failed',
        message: 'Description is required and must be a string'
      });
    });

    it('should validate description type', async () => {
      const response = await request(app)
        .put('/api/sessions/current')
        .send({ description: 123 })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Validation failed',
        message: 'Description is required and must be a string'
      });
    });

    it('should enforce description length limit', async () => {
      const longDescription = 'a'.repeat(501);
      
      const response = await request(app)
        .put('/api/sessions/current')
        .send({ description: longDescription })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Validation failed',
        message: 'Description cannot exceed 500 characters'
      });
    });

    it('should handle missing session', async () => {
      dbHelpers.findAll.mockResolvedValue([]);

      const response = await request(app)
        .put('/api/sessions/current')
        .send({ description: 'Test' })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'No current session found'
      });
    });

    it('should handle database errors', async () => {
      dbHelpers.update.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .put('/api/sessions/current')
        .send({ description: 'Test' })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to update session description',
        message: 'Update failed'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      dbHelpers.findAll.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/sessions/current')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch current session');
    });

    it('should handle unexpected errors during advance', async () => {
      dbHelpers.findAll.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/sessions/advance')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to advance session');
    });

    it('should handle unexpected errors during rollback', async () => {
      dbHelpers.findAll.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/sessions/rollback')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to rollback session');
    });
  });
});
