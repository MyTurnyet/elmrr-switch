import express from 'express';
import request from 'supertest';
import goodsRouter from '../../routes/goods.js';
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
app.use('/api/goods', goodsRouter);

describe('Goods Routes', () => {
  const mockGood = {
    _id: '1',
    name: 'Lumber',
    description: 'Wooden planks and boards',
    aarCode: 'LBR',
    weightPerUnit: 1000, // in lbs
    unit: 'ton',
    isHazardous: false,
    requiresSpecialHandling: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dbHelpers.findAll.mockResolvedValue([mockGood]);
    dbHelpers.findById.mockResolvedValue(mockGood);
  });

  describe('GET /api/goods', () => {
    it('should return all goods', async () => {
      const response = await request(app).get('/api/goods');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: [mockGood],
        count: 1
      });
      expect(dbHelpers.findAll).toHaveBeenCalledWith('goods');
    });

    it('should handle database errors', async () => {
      dbHelpers.findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/goods');
      
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to fetch goods'
      });
    });
  });

  describe('GET /api/goods/:id', () => {
    it('should return a good by id', async () => {
      const response = await request(app).get('/api/goods/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockGood
      });
      expect(dbHelpers.findById).toHaveBeenCalledWith('goods', '1');
    });

    it('should return 404 if good not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);
      
      const response = await request(app).get('/api/goods/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Good not found'
      });
    });

    it('should handle database errors', async () => {
      dbHelpers.findById.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/goods/1');
      
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to fetch good'
      });
    });
  });
});
