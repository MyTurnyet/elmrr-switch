import express from 'express';
import request from 'supertest';

// Mock the repositories before importing the route
jest.mock('../../repositories/index.js', () => {
  const mockAarTypeRepo = {
    findAll: jest.fn(),
    findById: jest.fn()
  };
  
  return {
    getRepository: jest.fn((repoName) => {
      if (repoName === 'aarTypes') {
        return mockAarTypeRepo;
      }
      return {
        findAll: jest.fn(),
        findById: jest.fn()
      };
    }),
    __mockAarTypeRepository: mockAarTypeRepo
  };
});

import aarTypesRouter from '../../routes/aarTypes.js';
import { getRepository } from '../../repositories/index.js';
import { ApiError } from '../../middleware/errorHandler.js';

// Get reference to the mock
const mockAarTypeRepoInstance = getRepository('aarTypes');

const app = express();
app.use(express.json());
app.use('/api/aar-types', aarTypesRouter);

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
    mockAarTypeRepoInstance.findAll.mockResolvedValue([mockAarType]);
    mockAarTypeRepoInstance.findById.mockResolvedValue(mockAarType);
  });

  describe('GET /api/aar-types', () => {
    it('should return all AAR types', async () => {
      const response = await request(app).get('/api/aar-types');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([mockAarType]);
      expect(mockAarTypeRepoInstance.findAll).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockAarTypeRepoInstance.findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/aar-types');
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/aar-types/:id', () => {
    it('should return an AAR type by id', async () => {
      const response = await request(app).get('/api/aar-types/1');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAarType);
      expect(mockAarTypeRepoInstance.findById).toHaveBeenCalledWith('1');
    });

    it('should return 404 if AAR type not found', async () => {
      mockAarTypeRepoInstance.findById.mockResolvedValue(null);
      
      const response = await request(app).get('/api/aar-types/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('AAR type not found');
    });

    it('should handle database errors', async () => {
      mockAarTypeRepoInstance.findById.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/aar-types/1');
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
