import express from 'express';
import request from 'supertest';
import stationsRouter from '../../routes/stations.js';
import { dbHelpers } from '../../database/index.js';
import { ApiError } from '../../middleware/errorHandler.js';

// Mock the database helpers
jest.mock('../../database/index.js', () => ({
  dbHelpers: {
    findAll: jest.fn(),
    findById: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api/stations', stationsRouter);

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

describe('Station Routes', () => {
  const mockStation = {
    _id: '1',
    name: 'Test Station',
    shortCode: 'TS',
    description: 'A test station',
    isYard: false,
    isOnLayout: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation for each test
    dbHelpers.findAll.mockResolvedValue([mockStation]);
    dbHelpers.findById.mockResolvedValue(mockStation);
  });

  describe('GET /api/stations', () => {
    it('should return all stations', async () => {
      const response = await request(app).get('/api/stations');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([mockStation]);
      expect(dbHelpers.findAll).toHaveBeenCalledWith('stations');
    });

    it('should handle database errors', async () => {
      dbHelpers.findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/stations');
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/stations/:id', () => {
    it('should return a station by id', async () => {
      const response = await request(app).get('/api/stations/1');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStation);
      expect(dbHelpers.findById).toHaveBeenCalledWith('stations', '1');
    });

    it('should return 404 if station not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);
      
      const response = await request(app).get('/api/stations/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Station not found');
    });

    it('should handle database errors', async () => {
      dbHelpers.findById.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/stations/1');
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
