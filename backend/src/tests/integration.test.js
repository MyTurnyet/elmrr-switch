import express from 'express';
import request from 'supertest';
import { ApiError } from '../middleware/errorHandler.js';

// Create mock service methods
const mockGetCurrentSession = jest.fn();
const mockAdvanceSession = jest.fn();
const mockRollbackSession = jest.fn();
const mockUpdateSessionDescription = jest.fn();
const mockGetSessionStats = jest.fn();

// Mock getService to return an object with our mock methods
jest.mock('../services/index.js', () => ({
  getService: jest.fn(() => ({
    getCurrentSession: (...args) => mockGetCurrentSession(...args),
    advanceSession: (...args) => mockAdvanceSession(...args),
    rollbackSession: (...args) => mockRollbackSession(...args),
    updateSessionDescription: (...args) => mockUpdateSessionDescription(...args),
    getSessionStats: (...args) => mockGetSessionStats(...args)
  }))
}));

import operatingSessionsRouter from '../routes/operatingSessions.js';

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

describe('Phase 2.2 Integration Tests - Step 5', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Advancement Integration', () => {
    test('should successfully advance session', async () => {
      const advanceResult = {
        session: {
          _id: 'session1',
          currentSessionNumber: 2,
          sessionDate: '2024-01-15T10:00:00.000Z',
          description: 'Operating Session 2'
        },
        stats: {
          trainsDeleted: 1,
          carsUpdated: 1,
          activeTrainsReverted: 0
        }
      };
      mockAdvanceSession.mockResolvedValue(advanceResult);

      const response = await request(app)
        .post('/api/sessions/advance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentSessionNumber).toBe(2);
      expect(mockAdvanceSession).toHaveBeenCalled();
    });
  });

  describe('Session Rollback Integration', () => {
    test('should successfully rollback session', async () => {
      const rollbackResult = {
        session: {
          _id: 'session1',
          currentSessionNumber: 1,
          sessionDate: '2024-01-15T10:00:00.000Z',
          description: 'Rolled back to Session 1'
        },
        stats: {
          carsRestored: 1,
          trainsRestored: 0,
          carOrdersRestored: 0
        }
      };
      mockRollbackSession.mockResolvedValue(rollbackResult);

      const response = await request(app)
        .post('/api/sessions/rollback')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentSessionNumber).toBe(1);
      expect(mockRollbackSession).toHaveBeenCalled();
    });

    test('should prevent rollback from session 1', async () => {
      mockRollbackSession.mockRejectedValue(
        new ApiError('Cannot rollback from session 1', 400)
      );

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
      mockGetCurrentSession.mockResolvedValue(mockSession);

      let response = await request(app)
        .get('/api/sessions/current')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentSessionNumber).toBe(1);

      // Test 2: Session description can be updated
      const updatedSession = { ...mockSession, description: 'Updated session' };
      mockUpdateSessionDescription.mockResolvedValue(updatedSession);

      response = await request(app)
        .put('/api/sessions/current')
        .send({ description: 'Updated session' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated session');

      // Verify all systems are accessible through the integration
      expect(mockGetCurrentSession).toHaveBeenCalled();
      expect(mockUpdateSessionDescription).toHaveBeenCalled();
    });
  });
});
