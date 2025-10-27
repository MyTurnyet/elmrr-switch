import express from 'express';
import request from 'supertest';
import routesRouter from '../../routes/routes.js';
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

// Mock the validateRoute function
jest.mock('../../models/route.js', () => ({
  validateRoute: jest.fn()
}));

const app = express();
app.use(express.json());
app.use('/api/routes', routesRouter);

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

describe('Route Routes', () => {
  const mockRoute = {
    _id: 'route1',
    name: 'Vancouver to Portland Local',
    description: 'Local freight service',
    originYard: 'vancouver-yard',
    terminationYard: 'portland-yard',
    stationSequence: ['station1', 'station2']
  };

  const mockYard = {
    _id: 'vancouver-yard',
    name: 'Vancouver Yard',
    isYard: true
  };

  const mockStation = {
    _id: 'station1',
    name: 'Test Station'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation for each test
    dbHelpers.findAll.mockResolvedValue([mockRoute]);
    dbHelpers.findById.mockResolvedValue(mockRoute);
    dbHelpers.findByQuery.mockResolvedValue([mockRoute]);
    dbHelpers.create.mockResolvedValue(mockRoute);
    dbHelpers.update.mockResolvedValue(1);
    dbHelpers.delete.mockResolvedValue(1);
  });

  describe('GET /api/routes', () => {
    it('should return all routes', async () => {
      const response = await request(app).get('/api/routes');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([mockRoute]);
      expect(dbHelpers.findByQuery).toHaveBeenCalledWith('routes', {});
    });

    it('should filter routes by originYard', async () => {
      const response = await request(app)
        .get('/api/routes')
        .query({ originYard: 'vancouver-yard' });

      expect(response.status).toBe(200);
      expect(dbHelpers.findByQuery).toHaveBeenCalledWith('routes', {
        originYard: 'vancouver-yard'
      });
    });

    it('should filter routes by terminationYard', async () => {
      const response = await request(app)
        .get('/api/routes')
        .query({ terminationYard: 'portland-yard' });

      expect(response.status).toBe(200);
      expect(dbHelpers.findByQuery).toHaveBeenCalledWith('routes', {
        terminationYard: 'portland-yard'
      });
    });

    it('should filter routes by both yards', async () => {
      const response = await request(app)
        .get('/api/routes')
        .query({
          originYard: 'vancouver-yard',
          terminationYard: 'portland-yard'
        });

      expect(response.status).toBe(200);
      expect(dbHelpers.findByQuery).toHaveBeenCalledWith('routes', {
        originYard: 'vancouver-yard',
        terminationYard: 'portland-yard'
      });
    });

    it('should filter routes by search term (name)', async () => {
      dbHelpers.findByQuery.mockResolvedValue([
        mockRoute,
        { ...mockRoute, _id: 'route2', name: 'Seattle Express' }
      ]);

      const response = await request(app)
        .get('/api/routes')
        .query({ search: 'vancouver' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Vancouver to Portland Local');
    });

    it('should filter routes by search term (description)', async () => {
      dbHelpers.findByQuery.mockResolvedValue([
        mockRoute,
        { ...mockRoute, _id: 'route2', name: 'Test', description: 'Express service' }
      ]);

      const response = await request(app)
        .get('/api/routes')
        .query({ search: 'freight' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Vancouver to Portland Local');
    });

    it('should handle empty results', async () => {
      dbHelpers.findByQuery.mockResolvedValue([]);

      const response = await request(app).get('/api/routes');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should handle database errors', async () => {
      dbHelpers.findByQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/routes');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/routes/:id', () => {
    it('should return a route by id', async () => {
      const response = await request(app).get('/api/routes/route1');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: mockRoute
      });
      expect(dbHelpers.findById).toHaveBeenCalledWith('routes', 'route1');
    });

    it('should return 404 if route not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/routes/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Route not found');
    });

    it('should handle database errors', async () => {
      dbHelpers.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/routes/route1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /api/routes', () => {
    const newRoute = {
      name: 'New Test Route',
      description: 'Test description',
      originYard: 'vancouver-yard',
      terminationYard: 'portland-yard',
      stationSequence: ['station1']
    };

    beforeEach(() => {
      const { validateRoute } = require('../../models/route.js');
      validateRoute.mockReturnValue({ value: newRoute });
    });

    it('should create a new route successfully', async () => {
      dbHelpers.findByQuery.mockResolvedValue([]); // No duplicates
      dbHelpers.findById
        .mockResolvedValueOnce({ ...mockYard, _id: 'vancouver-yard' }) // origin yard
        .mockResolvedValueOnce({ ...mockYard, _id: 'portland-yard' }) // termination yard
        .mockResolvedValueOnce(mockStation); // station in sequence

      const response = await request(app)
        .post('/api/routes')
        .send(newRoute);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        data: mockRoute,
        message: 'Route created successfully'
      });
      expect(dbHelpers.create).toHaveBeenCalledWith('routes', newRoute);
    });

    it('should create route with empty stationSequence', async () => {
      const directRoute = { ...newRoute, stationSequence: [] };
      const { validateRoute } = require('../../models/route.js');
      validateRoute.mockReturnValue({ value: directRoute });

      dbHelpers.findByQuery.mockResolvedValue([]); // No duplicates
      dbHelpers.findById
        .mockResolvedValueOnce({ ...mockYard, _id: 'vancouver-yard' })
        .mockResolvedValueOnce({ ...mockYard, _id: 'portland-yard' });

      const response = await request(app)
        .post('/api/routes')
        .send(directRoute);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 if validation fails', async () => {
      const { validateRoute } = require('../../models/route.js');
      validateRoute.mockReturnValue({
        error: {
          details: [{ message: 'name is required' }]
        }
      });

      const response = await request(app)
        .post('/api/routes')
        .send({ originYard: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 409 if route name already exists', async () => {
      dbHelpers.findByQuery.mockResolvedValue([mockRoute]); // Duplicate found

      const response = await request(app)
        .post('/api/routes')
        .send(newRoute);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('A route with this name already exists');
    });

    it('should return 404 if origin yard not found', async () => {
      dbHelpers.findByQuery.mockResolvedValue([]); // No duplicates
      dbHelpers.findById.mockResolvedValue(null); // Origin yard not found

      const response = await request(app)
        .post('/api/routes')
        .send(newRoute);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('does not exist');
    });

    it('should return 400 if origin is not a yard', async () => {
      dbHelpers.findByQuery.mockResolvedValue([]); // No duplicates
      dbHelpers.findById.mockResolvedValue({ ...mockYard, isYard: false });

      const response = await request(app)
        .post('/api/routes')
        .send(newRoute);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Origin must be an industry with isYard=true');
    });

    it('should return 404 if termination yard not found', async () => {
      dbHelpers.findByQuery.mockResolvedValue([]); // No duplicates
      dbHelpers.findById
        .mockResolvedValueOnce({ ...mockYard, isYard: true }) // origin valid
        .mockResolvedValueOnce(null); // termination not found

      const response = await request(app)
        .post('/api/routes')
        .send(newRoute);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('does not exist');
    });

    it('should return 400 if termination is not a yard', async () => {
      dbHelpers.findByQuery.mockResolvedValue([]); // No duplicates
      dbHelpers.findById
        .mockResolvedValueOnce({ ...mockYard, isYard: true }) // origin valid
        .mockResolvedValueOnce({ ...mockYard, isYard: false }); // termination invalid

      const response = await request(app)
        .post('/api/routes')
        .send(newRoute);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Termination must be an industry with isYard=true');
    });

    it('should return 404 if station in sequence not found', async () => {
      dbHelpers.findByQuery.mockResolvedValue([]); // No duplicates
      dbHelpers.findById
        .mockResolvedValueOnce({ ...mockYard, isYard: true }) // origin valid
        .mockResolvedValueOnce({ ...mockYard, isYard: true }) // termination valid
        .mockResolvedValueOnce(null); // station not found

      const response = await request(app)
        .post('/api/routes')
        .send(newRoute);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('does not exist');
    });

    it('should handle database errors', async () => {
      dbHelpers.findByQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/routes')
        .send(newRoute);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('PUT /api/routes/:id', () => {
    const updateData = {
      name: 'Updated Route Name',
      description: 'Updated description'
    };

    beforeEach(() => {
      const { validateRoute } = require('../../models/route.js');
      validateRoute.mockReturnValue({ value: updateData });
    });

    it('should update a route successfully', async () => {
      dbHelpers.findById.mockResolvedValue(mockRoute);
      dbHelpers.findByQuery.mockResolvedValue([]); // No duplicates

      const response = await request(app)
        .put('/api/routes/route1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Route updated successfully'
      });
      expect(dbHelpers.update).toHaveBeenCalledWith('routes', 'route1', updateData);
    });

    it('should return 404 if route not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/routes/nonexistent')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Route not found');
    });

    it('should return 400 if validation fails', async () => {
      const { validateRoute } = require('../../models/route.js');
      validateRoute.mockReturnValue({
        error: {
          details: [{ message: 'name is too long' }]
        }
      });

      const response = await request(app)
        .put('/api/routes/route1')
        .send({ name: 'x'.repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed'
      });
    });

    it('should return 409 if new name already exists', async () => {
      const updateWithNewName = { name: 'Existing Route' };
      const { validateRoute } = require('../../models/route.js');
      validateRoute.mockReturnValue({ value: updateWithNewName });

      dbHelpers.findById.mockResolvedValue(mockRoute);
      dbHelpers.findByQuery.mockResolvedValue([{ _id: 'other', name: 'Existing Route' }]);

      const response = await request(app)
        .put('/api/routes/route1')
        .send(updateWithNewName);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('A route with this name already exists');
    });

    it('should allow updating route with same name', async () => {
      const updateSameName = { name: mockRoute.name, description: 'New desc' };
      const { validateRoute } = require('../../models/route.js');
      validateRoute.mockReturnValue({ value: updateSameName });

      dbHelpers.findById.mockResolvedValue(mockRoute);

      const response = await request(app)
        .put('/api/routes/route1')
        .send(updateSameName);

      expect(response.status).toBe(200);
    });

    it('should validate updated origin yard', async () => {
      const updateOrigin = { originYard: 'new-yard' };
      const { validateRoute } = require('../../models/route.js');
      validateRoute.mockReturnValue({ value: updateOrigin });

      dbHelpers.findById
        .mockResolvedValueOnce(mockRoute) // existing route
        .mockResolvedValueOnce(null); // new origin not found

      const response = await request(app)
        .put('/api/routes/route1')
        .send(updateOrigin);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('does not exist');
    });

    it('should validate updated termination yard', async () => {
      const updateTermination = { terminationYard: 'new-yard' };
      const { validateRoute } = require('../../models/route.js');
      validateRoute.mockReturnValue({ value: updateTermination });

      dbHelpers.findById
        .mockResolvedValueOnce(mockRoute) // existing route
        .mockResolvedValueOnce(null); // new termination not found

      const response = await request(app)
        .put('/api/routes/route1')
        .send(updateTermination);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('does not exist');
    });

    it('should validate updated station sequence', async () => {
      const updateStations = { stationSequence: ['new-station'] };
      const { validateRoute } = require('../../models/route.js');
      validateRoute.mockReturnValue({ value: updateStations });

      dbHelpers.findById
        .mockResolvedValueOnce(mockRoute) // existing route
        .mockResolvedValueOnce(null); // new station not found

      const response = await request(app)
        .put('/api/routes/route1')
        .send(updateStations);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('does not exist');
    });

    it('should handle database errors', async () => {
      dbHelpers.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/routes/route1')
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/routes/:id', () => {
    it('should delete a route successfully', async () => {
      const response = await request(app).delete('/api/routes/route1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(dbHelpers.delete).toHaveBeenCalledWith('routes', 'route1');
    });

    it('should return 404 if route not found', async () => {
      dbHelpers.delete.mockResolvedValue(0);

      const response = await request(app).delete('/api/routes/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Route not found');
    });

    it('should handle database errors', async () => {
      dbHelpers.delete.mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/api/routes/route1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
