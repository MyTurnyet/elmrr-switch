import express from 'express';
import request from 'supertest';
import locomotivesRouter from '../../routes/locomotives.js';
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
app.use('/api/v1/locomotives', locomotivesRouter);

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

describe('Locomotives Routes', () => {
  const mockLocomotive = {
    _id: '1',
    roadNumber: 'GP38-2',
    roadName: 'ATSF',
    model: 'EMD GP38-2',
    buildDate: '1975-01-01',
    length: 60, // in feet
    weight: 120, // in tons
    isDCC: true,
    isSoundEquipped: true,
    currentLocation: 'yard1',
    status: 'available',
    lastServiced: '2023-01-15',
    notes: 'Primary road switcher'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dbHelpers.findAll.mockResolvedValue([mockLocomotive]);
    dbHelpers.findById.mockResolvedValue(mockLocomotive);
  });

  describe('GET /api/locomotives', () => {
    it('should return all locomotives', async () => {
      const response = await request(app).get('/api/v1/locomotives');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([mockLocomotive]);
      expect(dbHelpers.findAll).toHaveBeenCalledWith('locomotives');
    });

    it('should handle database errors', async () => {
      dbHelpers.findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/v1/locomotives');
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/locomotives/:id', () => {
    it('should return a locomotive by id', async () => {
      const response = await request(app).get('/api/v1/locomotives/1');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockLocomotive);
      expect(dbHelpers.findById).toHaveBeenCalledWith('locomotives', '1');
    });

    it('should return 404 if locomotive not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);
      
      const response = await request(app).get('/api/v1/locomotives/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Locomotive not found');
    });

    it('should handle database errors', async () => {
      dbHelpers.findById.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/v1/locomotives/1');
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
