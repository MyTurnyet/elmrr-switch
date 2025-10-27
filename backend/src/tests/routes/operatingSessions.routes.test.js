import express from 'express';
import request from 'supertest';
import { ApiError } from '../../middleware/errorHandler.js';

// Create mock service methods
const mockGetCurrentSession = jest.fn();
const mockAdvanceSession = jest.fn();
const mockRollbackSession = jest.fn();
const mockUpdateSessionDescription = jest.fn();
const mockGetSessionStats = jest.fn();

// Mock getService to return an object with our mock methods
jest.mock('../../services/index.js', () => ({
  getService: jest.fn(() => ({
    getCurrentSession: (...args) => mockGetCurrentSession(...args),
    advanceSession: (...args) => mockAdvanceSession(...args),
    rollbackSession: (...args) => mockRollbackSession(...args),
    updateSessionDescription: (...args) => mockUpdateSessionDescription(...args),
    getSessionStats: (...args) => mockGetSessionStats(...args)
  }))
}));

import operatingSessionsRouter from '../../routes/operatingSessions.js';

const app = express();
app.use(express.json());
app.use('/api/v1/sessions', operatingSessionsRouter);

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
      mockGetCurrentSession.mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/api/v1/sessions/current')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSession);
      expect(mockGetCurrentSession).toHaveBeenCalled();
    });

    it('should create initial session if none exists', async () => {
      const newSession = {
        _id: 'new-session',
        currentSessionNumber: 1,
        sessionDate: '2024-01-15T10:00:00.000Z',
        description: 'Initial operating session',
        previousSessionSnapshot: null
      };
      mockGetCurrentSession.mockResolvedValue(newSession);

      const response = await request(app)
        .get('/api/v1/sessions/current')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentSessionNumber).toBe(1);
    });

    it('should handle validation error during initial session creation', async () => {
      mockGetCurrentSession.mockRejectedValue(
        new ApiError('Failed to create initial session', 500)
      );

      const response = await request(app)
        .get('/api/v1/sessions/current')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to create initial session');
    });

    it('should handle database errors', async () => {
      mockGetCurrentSession.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/sessions/current')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /advance', () => {
    // Remove the beforeEach that was interfering with individual test setups

    it('should advance session successfully', async () => {
      const advanceResult = {
        session: { ...mockSession, currentSessionNumber: 4, description: 'Session 4' },
        stats: {
          trainsDeleted: 1,
          carsUpdated: 2,
          activeTrainsReverted: 2
        }
      };
      mockAdvanceSession.mockResolvedValue(advanceResult);

      const response = await request(app)
        .post('/api/v1/sessions/advance')
        .send({ description: 'Session 4' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAdvanceSession).toHaveBeenCalledWith('Session 4');
    });

    it('should handle missing session', async () => {
      mockAdvanceSession.mockRejectedValue(
        new ApiError('No current session found', 404)
      );

      const response = await request(app)
        .post('/api/v1/sessions/advance')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No current session found');
    });

    it('should handle snapshot validation error', async () => {
      mockAdvanceSession.mockRejectedValue(
        new ApiError('Failed to create session snapshot', 500)
      );

      const response = await request(app)
        .post('/api/v1/sessions/advance')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to create session snapshot');
    });

    it('should revert cars from active trains', async () => {
      const advanceResult = {
        session: { ...mockSession, currentSessionNumber: 4 },
        stats: { activeTrainsReverted: 1, carsUpdated: 2, trainsDeleted: 0 }
      };
      mockAdvanceSession.mockResolvedValue(advanceResult);

      const response = await request(app)
        .post('/api/v1/sessions/advance')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should use default description if not provided', async () => {
      const advanceResult = {
        session: { ...mockSession, currentSessionNumber: 4, description: 'Operating Session 4' },
        stats: { trainsDeleted: 0, carsUpdated: 2, activeTrainsReverted: 0 }
      };
      mockAdvanceSession.mockResolvedValue(advanceResult);

      const response = await request(app)
        .post('/api/v1/sessions/advance')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAdvanceSession).toHaveBeenCalledWith(undefined);
    });
  });

  describe('POST /rollback', () => {
    it('should rollback session successfully', async () => {
      const rollbackResult = {
        session: { ...mockSession, currentSessionNumber: 2, description: 'Rolled back to Session 2' },
        stats: { carsRestored: 2, trainsRestored: 1, carOrdersRestored: 1 }
      };
      mockRollbackSession.mockResolvedValue(rollbackResult);

      const response = await request(app)
        .post('/api/v1/sessions/rollback')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockRollbackSession).toHaveBeenCalled();
    });

    it('should prevent rollback from session 1', async () => {
      mockRollbackSession.mockRejectedValue(
        new ApiError('Cannot rollback from session 1', 400)
      );

      const response = await request(app)
        .post('/api/v1/sessions/rollback')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot rollback from session 1');
    });

    it('should prevent rollback without snapshot', async () => {
      mockRollbackSession.mockRejectedValue(
        new ApiError('No previous session snapshot available', 400)
      );

      const response = await request(app)
        .post('/api/v1/sessions/rollback')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No previous session snapshot available');
    });

    it('should handle invalid snapshot', async () => {
      mockRollbackSession.mockRejectedValue(
        new ApiError('Invalid session snapshot', 500)
      );

      const response = await request(app)
        .post('/api/v1/sessions/rollback')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid session snapshot');
    });

    it('should handle missing session', async () => {
      mockRollbackSession.mockRejectedValue(
        new ApiError('No current session found', 404)
      );

      const response = await request(app)
        .post('/api/v1/sessions/rollback')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No current session found');
    });
  });

  describe('PUT /current', () => {
    it('should update session description successfully', async () => {
      const updatedSession = { ...mockSession, description: 'Updated description' };
      mockUpdateSessionDescription.mockResolvedValue(updatedSession);

      const response = await request(app)
        .put('/api/v1/sessions/current')
        .send({ description: 'Updated description' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockUpdateSessionDescription).toHaveBeenCalledWith('Updated description');
    });

    it('should require description', async () => {
      const response = await request(app)
        .put('/api/v1/sessions/current')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate description type', async () => {
      const response = await request(app)
        .put('/api/v1/sessions/current')
        .send({ description: 123 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should enforce description length limit', async () => {
      const longDescription = 'a'.repeat(501);
      
      const response = await request(app)
        .put('/api/v1/sessions/current')
        .send({ description: longDescription })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle missing session', async () => {
      mockUpdateSessionDescription.mockRejectedValue(
        new ApiError('No current session found', 404)
      );

      const response = await request(app)
        .put('/api/v1/sessions/current')
        .send({ description: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No current session found');
    });

    it('should handle database errors', async () => {
      mockUpdateSessionDescription.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .put('/api/v1/sessions/current')
        .send({ description: 'Test' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockGetCurrentSession.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/v1/sessions/current')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle unexpected errors during advance', async () => {
      mockAdvanceSession.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/v1/sessions/advance')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle unexpected errors during rollback', async () => {
      mockRollbackSession.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/v1/sessions/rollback')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
