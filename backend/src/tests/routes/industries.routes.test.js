import express from 'express';
import request from 'supertest';
import industriesRouter from '../../routes/industries.js';
import { dbHelpers } from '../../database/index.js';
import { ApiError } from '../../middleware/errorHandler.js';

// Mock the database helpers
jest.mock('../../database/index.js', () => ({
  dbHelpers: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByQuery: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

// Mock the validateIndustry function
jest.mock('../../models/industry.js', () => ({
  validateIndustry: jest.fn(),
  validateCarDemandConfig: jest.fn()
}));

const app = express();
app.use(express.json());
app.use('/api/industries', industriesRouter);

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

describe('Industry Routes', () => {
  const mockIndustry = {
    _id: '1',
    name: 'Test Industry',
    stationId: 'station1',
    goodsReceived: [],
    goodsToShip: [],
    preferredCarTypes: ['boxcar'],
    isYard: false,
    isOnLayout: true
  };

  const mockCar = {
    _id: 'car1',
    reportingMarks: 'ATSF',
    reportingNumber: '12345',
    carType: 'boxcar',
    currentIndustry: '1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation for each test
    dbHelpers.findAll.mockResolvedValue([mockIndustry]);
    dbHelpers.findById.mockResolvedValue(mockIndustry);
    dbHelpers.findByQuery.mockResolvedValue([mockCar]);
    dbHelpers.create.mockResolvedValue(mockIndustry);
    dbHelpers.update.mockResolvedValue(1);
    dbHelpers.delete.mockResolvedValue(1);
  });

  describe('GET /api/industries', () => {
    it('should return all industries', async () => {
      const response = await request(app).get('/api/industries');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([mockIndustry]);
      expect(dbHelpers.findAll).toHaveBeenCalledWith('industries');
    });

    it('should handle database errors', async () => {
      dbHelpers.findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/industries');
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/industries/:id', () => {
    it('should return an industry by id', async () => {
      const response = await request(app).get('/api/industries/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: mockIndustry
      });
      expect(dbHelpers.findById).toHaveBeenCalledWith('industries', '1');
    });

    it('should return 404 if industry not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);
      
      const response = await request(app).get('/api/industries/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Industry not found');
    });
  });

  describe('GET /api/industries/:id/cars', () => {
    it('should return cars at the industry', async () => {
      const response = await request(app).get('/api/industries/1/cars');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([mockCar]);
      expect(dbHelpers.findByQuery).toHaveBeenCalledWith('cars', {
        currentIndustry: '1'
      });
    });

    it('should handle no cars at industry', async () => {
      dbHelpers.findByQuery.mockResolvedValueOnce([]);
      
      const response = await request(app).get('/api/industries/1/cars');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /api/industries', () => {
    const newIndustry = {
      name: 'New Industry',
      stationId: 'station2',
      goodsReceived: ['lumber', 'coal'],
      goodsToShip: ['gravel'],
      preferredCarTypes: ['boxcar', 'flatcar'],
      isYard: false,
      isOnLayout: true
    };

    beforeEach(() => {
      const { validateIndustry } = require('../../models/industry.js');
      validateIndustry.mockReturnValue({ error: null, value: newIndustry });
    });

    it('should create a new industry', async () => {
      const response = await request(app)
        .post('/api/industries')
        .send(newIndustry);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        data: mockIndustry
      });
      expect(dbHelpers.create).toHaveBeenCalledWith('industries', newIndustry);
    });

    it('should validate industry data', async () => {
      const { validateIndustry } = require('../../models/industry.js');
      validateIndustry.mockReturnValueOnce({ 
        error: { details: [{ message: 'Validation error' }] } 
      });
      
      const response = await request(app)
        .post('/api/industries')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed'
      });
    });
  });

  describe('PUT /api/industries/:id', () => {
    const updates = {
      name: 'Updated Industry',
      isYard: true
    };

    beforeEach(() => {
      const { validateIndustry } = require('../../models/industry.js');
      validateIndustry.mockReturnValue({ error: null, value: updates });
    });

    it('should update an industry', async () => {
      const response = await request(app)
        .put('/api/industries/1')
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: mockIndustry
      });
      expect(dbHelpers.update).toHaveBeenCalledWith('industries', '1', updates);
    });

    it('should return 404 if industry not found', async () => {
      dbHelpers.update.mockResolvedValue(0);
      
      const response = await request(app)
        .put('/api/industries/nonexistent')
        .send(updates);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Industry not found');
    });
  });

  describe('DELETE /api/industries/:id', () => {
    it('should delete an industry', async () => {
      const response = await request(app).delete('/api/industries/1');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(dbHelpers.delete).toHaveBeenCalledWith('industries', '1');
    });

    it('should handle deletion of non-existent industry', async () => {
      dbHelpers.delete.mockResolvedValue(0);
      
      const response = await request(app).delete('/api/industries/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Industry not found');
    });
  });
});
