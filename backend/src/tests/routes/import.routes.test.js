import express from 'express';
import request from 'supertest';
import multer from 'multer';
import importRouter from '../../routes/import.js';
import { dbHelpers } from '../../database/index.js';
import { validateCar, validateIndustry } from '../../models/car.js';

// Mock multer is now in src/__mocks__/multer.js
jest.mock('multer');

// Mock the database helpers
jest.mock('../../database/index.js', () => ({
  dbHelpers: {
    create: jest.fn(),
    findByQuery: jest.fn()
  }
}));

// Mock the model validators
jest.mock('../../models/car.js', () => ({
  validateCar: jest.fn(),
  validateIndustry: jest.fn()
}));

const app = express();
app.use(express.json());
app.use('/api/import', importRouter);

describe('Import Routes', () => {
  const mockCar = {
    reportingMarks: 'ATSF',
    reportingNumber: '12345',
    carType: 'boxcar',
    color: 'red',
    homeYard: 'yard1',
    currentIndustry: 'industry1',
    isInService: true
  };

  const mockIndustry = {
    name: 'Test Industry',
    stationId: 'station1',
    goodsReceived: [],
    goodsToShip: [],
    preferredCarTypes: ['boxcar']
  };

  const mockStation = {
    name: 'Test Station',
    shortCode: 'TS',
    description: 'A test station',
    isYard: false,
    isOnLayout: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    dbHelpers.findByQuery.mockResolvedValue([]);
    dbHelpers.create.mockResolvedValue({ _id: '123' });
    validateCar.mockReturnValue({ error: null, value: mockCar });
    validateIndustry.mockReturnValue({ error: null, value: mockIndustry });
  });

  describe('POST /api/import/json', () => {
    it('should import valid JSON data', async () => {
      const importData = {
        cars: [mockCar],
        industries: [mockIndustry],
        stations: [mockStation]
      };

      const response = await request(app)
        .post('/api/import/json')
        .send({ data: importData });
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true
      });
      expect(typeof response.body.imported).toBe('number');
    });

    it('should handle file uploads', async () => {
      const importData = {
        cars: [mockCar],
        industries: [mockIndustry]
      };

      // Mock file upload
      const file = {
        buffer: Buffer.from(JSON.stringify(importData)),
        originalname: 'test.json',
        mimetype: 'application/json'
      };

      const response = await request(app)
        .post('/api/import/json')
        .field('data', JSON.stringify(importData))
        .attach('file', file.buffer, 'test.json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate car data', async () => {
      const invalidCar = { ...mockCar, reportingMarks: undefined };
      const error = { details: [{ message: 'Validation error' }] };
      
      validateCar.mockReturnValueOnce({ error, value: null });
      
      const response = await request(app)
        .post('/api/import/json')
        .send({ 
          data: { 
            cars: [invalidCar] 
          } 
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should skip duplicate cars', async () => {
      dbHelpers.findByQuery.mockResolvedValueOnce([{ _id: 'existing' }]);
      
      const response = await request(app)
        .post('/api/import/json')
        .send({ 
          data: { 
            cars: [mockCar] 
          } 
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.warnings).toBeDefined();
    });

    it('should handle validation errors for industries', async () => {
      const error = { details: [{ message: 'Invalid industry data' }] };
      validateIndustry.mockReturnValueOnce({ error, value: null });
      
      const response = await request(app)
        .post('/api/import/json')
        .send({ 
          data: { 
            industries: [mockIndustry] 
          } 
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle database errors', async () => {
      dbHelpers.create.mockRejectedValueOnce(new Error('Database error'));
      
      const response = await request(app)
        .post('/api/import/json')
        .send({ 
          data: { 
            cars: [mockCar] 
          } 
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 if no data provided', async () => {
      const response = await request(app)
        .post('/api/import/json')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'No data provided'
      });
    });
  });

  // CSV import is not implemented in the current version
});
