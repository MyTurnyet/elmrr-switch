import express from 'express';
import request from 'supertest';
import tracksRouter from '../../routes/tracks.js';
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
app.use('/api/tracks', tracksRouter);

describe('Tracks Routes', () => {
  const mockTrack = {
    _id: '1',
    name: 'Main Line',
    description: 'Main line track between stations',
    length: 120, // in feet
    maxCars: 10,
    currentCars: 3,
    status: 'active',
    stationId: 'station1',
    industryId: 'industry1',
    isPassingTrack: false,
    isSpur: false,
    isYardTrack: true,
    notes: 'Primary yard track'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dbHelpers.findAll.mockResolvedValue([mockTrack]);
    dbHelpers.findById.mockResolvedValue(mockTrack);
  });

  describe('GET /api/tracks', () => {
    it('should return all tracks', async () => {
      const response = await request(app).get('/api/tracks');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: [mockTrack],
        count: 1
      });
      expect(dbHelpers.findAll).toHaveBeenCalledWith('tracks');
    });

    it('should handle database errors', async () => {
      dbHelpers.findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/tracks');
      
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to fetch tracks'
      });
    });
  });

  describe('GET /api/tracks/:id', () => {
    it('should return a track by id', async () => {
      const response = await request(app).get('/api/tracks/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockTrack
      });
      expect(dbHelpers.findById).toHaveBeenCalledWith('tracks', '1');
    });

    it('should return 404 if track not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);
      
      const response = await request(app).get('/api/tracks/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Track not found'
      });
    });

    it('should handle database errors', async () => {
      dbHelpers.findById.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/tracks/1');
      
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to fetch track'
      });
    });
  });
});
