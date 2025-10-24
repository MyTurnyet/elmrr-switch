import express from 'express';
import request from 'supertest';
import carsRouter from '../../routes/cars.js';
import { dbHelpers } from '../../database/index.js';
import { globalErrorHandler } from '../../middleware/errorHandler.js';

// Mock the database helpers
jest.mock('../../database/index.js', () => ({
  dbHelpers: {
    findByQuery: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

// Mock the validateCar function
jest.mock('../../models/car.js', () => ({
  validateCar: jest.fn()
}));

const app = express();
app.use(express.json());
app.use('/api/cars', carsRouter);
app.use(globalErrorHandler);

describe('Car Routes', () => {
  const mockCar = {
    _id: '1',
    reportingMarks: 'ATSF',
    reportingNumber: '12345',
    carType: 'boxcar',
    color: 'brown',
    homeYard: 'yard1',
    currentIndustry: 'industry1',
    isInService: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation for each test
    dbHelpers.findByQuery.mockResolvedValue([mockCar]);
    dbHelpers.findById.mockResolvedValue(mockCar);
    dbHelpers.create.mockResolvedValue(mockCar);
    dbHelpers.update.mockResolvedValue(1);
    dbHelpers.delete.mockResolvedValue(1);
  });

  describe('GET /api/cars', () => {
    it('should return all cars', async () => {
      const response = await request(app).get('/api/cars');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: [mockCar],
        message: 'Cars retrieved successfully',
        statusCode: 200
      });
      expect(response.body.timestamp).toBeDefined();
      expect(dbHelpers.findByQuery).toHaveBeenCalledWith('cars', {});
    });

    it('should filter cars by carType', async () => {
      await request(app).get('/api/cars?carType=boxcar');
      
      expect(dbHelpers.findByQuery).toHaveBeenCalledWith('cars', {
        carType: 'boxcar'
      });
    });

    it('should handle database errors', async () => {
      dbHelpers.findByQuery.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/cars');
      
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Internal Server Error',
        statusCode: 500
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/cars/:id', () => {
    it('should return a car by id', async () => {
      const response = await request(app).get('/api/cars/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Object)
      });
      expect(dbHelpers.findById).toHaveBeenCalledWith('cars', '1');
    });

    it('should return 404 if car not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);
      
      const response = await request(app).get('/api/cars/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Car not found',
        statusCode: 404
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('POST /api/cars', () => {
    const newCar = {
      reportingMarks: 'SP',
      reportingNumber: '67890',
      carType: 'tankcar',
      color: 'black',
      homeYard: 'yard2',
      currentIndustry: 'industry2',
      isInService: true
    };

    beforeEach(() => {
      const { validateCar } = require('../../models/car.js');
      validateCar.mockReturnValue({ error: null, value: newCar });
    });

    it('should create a new car', async () => {
      // Mock no existing cars with the same reporting marks/number
      dbHelpers.findByQuery.mockResolvedValueOnce([]);
      
      const response = await request(app)
        .post('/api/cars')
        .send(newCar);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Object)
      });
      
      // Verify the create was called with the expected data
      expect(dbHelpers.create).toHaveBeenCalledWith('cars', {
        ...newCar,
        sessionsAtCurrentLocation: 0,
        lastMoved: expect.any(Date)
      });
    });

    it('should validate car data', async () => {
      const { validateCar } = require('../../models/car.js');
      validateCar.mockReturnValueOnce({ 
        error: { details: [{ message: 'Validation error' }] } 
      });
      
      const response = await request(app)
        .post('/api/cars')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
        statusCode: 400
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('PUT /api/cars/:id', () => {
    const updates = {
      color: 'red',
      currentIndustry: 'industry3'
    };

    beforeEach(() => {
      const { validateCar } = require('../../models/car.js');
      validateCar.mockReturnValue({ error: null, value: updates });
    });

    it('should update a car', async () => {
      const response = await request(app)
        .put('/api/cars/1')
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Object)
      });
      expect(dbHelpers.update).toHaveBeenCalledWith('cars', '1', updates);
    });

    it('should return 404 if car not found', async () => {
      dbHelpers.update.mockResolvedValue(0);
      
      const response = await request(app)
        .put('/api/cars/nonexistent')
        .send(updates);
      
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Car not found',
        statusCode: 404
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('DELETE /api/cars/:id', () => {
    it('should delete a car', async () => {
      const response = await request(app).delete('/api/cars/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: null,
        message: 'Car deleted successfully',
        statusCode: 200
      });
      expect(response.body.timestamp).toBeDefined();
      expect(dbHelpers.delete).toHaveBeenCalledWith('cars', '1');
    });

    it('should return 404 if car not found', async () => {
      dbHelpers.delete.mockResolvedValue(0);
      
      const response = await request(app).delete('/api/cars/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Car not found',
        statusCode: 404
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });
});
