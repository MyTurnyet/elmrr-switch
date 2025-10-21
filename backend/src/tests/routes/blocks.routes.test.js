import express from 'express';
import request from 'supertest';
import blocksRouter from '../../routes/blocks.js';
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
app.use('/api/blocks', blocksRouter);

describe('Blocks Routes', () => {
  const mockBlock = {
    _id: '1',
    name: 'A-1',
    description: 'Main yard block',
    stationId: 'station1',
    maxCars: 10,
    currentCars: 5,
    isActive: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dbHelpers.findAll.mockResolvedValue([mockBlock]);
    dbHelpers.findById.mockResolvedValue(mockBlock);
  });

  describe('GET /api/blocks', () => {
    it('should return all blocks', async () => {
      const response = await request(app).get('/api/blocks');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: [mockBlock],
        count: 1
      });
      expect(dbHelpers.findAll).toHaveBeenCalledWith('blocks');
    });

    it('should handle database errors', async () => {
      dbHelpers.findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/blocks');
      
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to fetch blocks'
      });
    });
  });

  describe('GET /api/blocks/:id', () => {
    it('should return a block by id', async () => {
      const response = await request(app).get('/api/blocks/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockBlock
      });
      expect(dbHelpers.findById).toHaveBeenCalledWith('blocks', '1');
    });

    it('should return 404 if block not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);
      
      const response = await request(app).get('/api/blocks/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Block not found'
      });
    });

    it('should handle database errors', async () => {
      dbHelpers.findById.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/blocks/1');
      
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to fetch block'
      });
    });
  });
});
