import express from 'express';
import request from 'supertest';
import aarTypesRouter from '../../routes/aarTypes.js';
import { dbHelpers } from '../../database/index.js';

// Mock the database helpers
jest.mock('../../database/index.js', () => ({
  dbHelpers: {
    findAll: jest.fn(),
    findById: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api/aar-types', aarTypesRouter);

describe('AAR Types Routes', () => {
  const mockAarType = {
    _id: '1',
    code: 'XM',
    description: 'Boxcar, Multi-Door',
    category: 'Boxcar',
    length: 50,
    capacity: 100000,
    notes: 'Standard 50ft boxcar'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dbHelpers.findAll.mockResolvedValue([mockAarType]);
    dbHelpers.findById.mockResolvedValue(mockAarType);
  });

  describe('GET /api/aar-types', () => {
    it('should return all AAR types', async () => {
      const response = await request(app).get('/api/aar-types');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: [mockAarType],
        count: 1
      });
      expect(dbHelpers.findAll).toHaveBeenCalledWith('aarTypes');
    });

    it('should handle database errors', async () => {
      dbHelpers.findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/aar-types');
      
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to fetch AAR types'
      });
    });
  });

  describe('GET /api/aar-types/:id', () => {
    it('should return an AAR type by id', async () => {
      const response = await request(app).get('/api/aar-types/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockAarType
      });
      expect(dbHelpers.findById).toHaveBeenCalledWith('aarTypes', '1');
    });

    it('should return 404 if AAR type not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);
      
      const response = await request(app).get('/api/aar-types/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'AAR type not found'
      });
    });

    it('should handle database errors', async () => {
      dbHelpers.findById.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/aar-types/1');
      
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to fetch AAR type'
      });
    });
  });
});
