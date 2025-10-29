/**
 * Locomotive Routes Tests
 * Comprehensive tests for all locomotive API endpoints
 */

import express from 'express';
import request from 'supertest';

// Mock the repositories before importing the route
jest.mock('../../repositories/index.js', () => {
  const mockLocoRepo = {
    findAll: jest.fn(),
    findBy: jest.fn(),
    findById: jest.fn(),
    findByIdOrNull: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    enrich: jest.fn(),
    validate: jest.fn(),
    getStatistics: jest.fn(),
    findAvailable: jest.fn(),
    checkTrainAssignments: jest.fn()
  };
  
  return {
    getRepository: jest.fn((repoName) => {
      if (repoName === 'locomotives') {
        return mockLocoRepo;
      }
      return {
        findAll: jest.fn(),
        findById: jest.fn(),
        findByIdOrNull: jest.fn()
      };
    }),
    __mockLocomotiveRepository: mockLocoRepo
  };
});

// Mock the database helpers
jest.mock('../../database/index.js', () => ({
  dbHelpers: {
    findById: jest.fn(),
    find: jest.fn()
  }
}));

import locomotivesRouter from '../../routes/locomotives.js';
import { getRepository } from '../../repositories/index.js';
import { ApiError } from '../../middleware/errorHandler.js';
import { NULL_LOCOMOTIVE } from '../../patterns/nullObjects/NullLocomotive.js';

// Get reference to the mock
const mockLocoRepoInstance = getRepository('locomotives');

const app = express();
app.use(express.json());
app.use('/api/locomotives', locomotivesRouter);

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

describe('Locomotive Routes', () => {
  const mockLocomotive = {
    _id: 'loco-001',
    reportingMarks: 'ELMR',
    reportingNumber: '003801',
    model: 'GP38-2',
    manufacturer: 'Atlas',
    isDCC: true,
    dccAddress: 3801,
    homeYard: 'yard-001',
    isInService: true,
    notes: 'Test locomotive'
  };

  const mockEnrichedLocomotive = {
    ...mockLocomotive,
    homeYardDetails: {
      _id: 'yard-001',
      name: 'Main Yard',
      stationId: 'station-001',
      isYard: true,
      isOnLayout: true
    },
    displayName: 'ELMR 003801',
    dccAddressFormatted: '3801',
    statusText: 'In Service',
    dccStatusText: 'DCC (3801)'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocoRepoInstance.findAll.mockResolvedValue([mockLocomotive]);
    mockLocoRepoInstance.findBy.mockResolvedValue([mockLocomotive]);
    mockLocoRepoInstance.findById.mockResolvedValue(mockLocomotive);
    mockLocoRepoInstance.findByIdOrNull.mockResolvedValue(mockLocomotive);
    mockLocoRepoInstance.enrich.mockResolvedValue(mockEnrichedLocomotive);
    mockLocoRepoInstance.validate.mockResolvedValue(mockLocomotive);
    mockLocoRepoInstance.create.mockResolvedValue(mockLocomotive);
    mockLocoRepoInstance.update.mockResolvedValue(true);
    mockLocoRepoInstance.delete.mockResolvedValue(true);
    mockLocoRepoInstance.checkTrainAssignments.mockResolvedValue({
      isAssigned: false,
      trainCount: 0,
      trains: []
    });
  });

  describe('GET /api/locomotives', () => {
    it('should return all locomotives with list view', async () => {
      const response = await request(app).get('/api/locomotives');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(mockLocoRepoInstance.findAll).toHaveBeenCalled();
    });

    it('should filter locomotives by manufacturer', async () => {
      const response = await request(app)
        .get('/api/locomotives')
        .query({ manufacturer: 'Atlas' });
      
      expect(response.status).toBe(200);
      expect(mockLocoRepoInstance.findBy).toHaveBeenCalled();
    });

    it('should filter locomotives by model', async () => {
      const response = await request(app)
        .get('/api/locomotives')
        .query({ model: 'GP38-2' });
      
      expect(response.status).toBe(200);
      expect(mockLocoRepoInstance.findBy).toHaveBeenCalled();
    });

    it('should filter locomotives by isInService', async () => {
      const response = await request(app)
        .get('/api/locomotives')
        .query({ isInService: 'true' });
      
      expect(response.status).toBe(200);
      expect(mockLocoRepoInstance.findBy).toHaveBeenCalled();
    });

    it('should filter locomotives by isDCC', async () => {
      const response = await request(app)
        .get('/api/locomotives')
        .query({ isDCC: 'true' });
      
      expect(response.status).toBe(200);
      expect(mockLocoRepoInstance.findBy).toHaveBeenCalled();
    });

    it('should search locomotives', async () => {
      const response = await request(app)
        .get('/api/locomotives')
        .query({ search: 'ELMR' });
      
      expect(response.status).toBe(200);
      expect(mockLocoRepoInstance.findBy).toHaveBeenCalled();
    });

    it('should support detail view', async () => {
      const response = await request(app)
        .get('/api/locomotives')
        .query({ view: 'detail' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle database errors', async () => {
      mockLocoRepoInstance.findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/locomotives');
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/locomotives/statistics', () => {
    it('should return locomotive statistics', async () => {
      const mockStats = {
        total: 10,
        inService: 8,
        outOfService: 2,
        dccEnabled: 7,
        dcOnly: 3,
        byManufacturer: { Atlas: 5, Kato: 3, Bachmann: 2 },
        byModel: { 'GP38-2': 4, 'SD40-2': 3, 'GP9': 3 },
        byHomeYard: { 'yard-001': 6, 'yard-002': 4 },
        availabilityRate: '80.0%',
        dccRate: '70.0%'
      };
      mockLocoRepoInstance.getStatistics.mockResolvedValue(mockStats);

      const response = await request(app).get('/api/locomotives/statistics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
      expect(mockLocoRepoInstance.getStatistics).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockLocoRepoInstance.getStatistics.mockRejectedValue(new Error('Stats error'));
      
      const response = await request(app).get('/api/locomotives/statistics');
      
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/locomotives/available', () => {
    it('should return available locomotives', async () => {
      mockLocoRepoInstance.findAvailable.mockResolvedValue([mockLocomotive]);

      const response = await request(app).get('/api/locomotives/available');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockLocoRepoInstance.findAvailable).toHaveBeenCalled();
    });

    it('should support view parameter', async () => {
      mockLocoRepoInstance.findAvailable.mockResolvedValue([mockLocomotive]);

      const response = await request(app)
        .get('/api/locomotives/available')
        .query({ view: 'detail' });
      
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/locomotives/:id', () => {
    it('should return a locomotive by id with enriched data', async () => {
      const response = await request(app).get('/api/locomotives/loco-001');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockLocoRepoInstance.findByIdOrNull).toHaveBeenCalledWith('loco-001');
      expect(mockLocoRepoInstance.enrich).toHaveBeenCalledWith(mockLocomotive);
    });

    it('should return 404 if locomotive not found', async () => {
      mockLocoRepoInstance.findByIdOrNull.mockResolvedValueOnce(NULL_LOCOMOTIVE);
      
      const response = await request(app).get('/api/locomotives/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Locomotive not found');
    });

    it('should handle database errors', async () => {
      mockLocoRepoInstance.findByIdOrNull.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/locomotives/loco-001');
      
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/locomotives/:id/assignments', () => {
    it('should return train assignments for locomotive', async () => {
      const mockAssignments = {
        isAssigned: true,
        trainCount: 2,
        trains: [
          { _id: 'train-001', name: 'Local 1', status: 'Planned', sessionNumber: 1 },
          { _id: 'train-002', name: 'Local 2', status: 'In Progress', sessionNumber: 1 }
        ]
      };
      mockLocoRepoInstance.checkTrainAssignments.mockResolvedValue(mockAssignments);

      const response = await request(app).get('/api/locomotives/loco-001/assignments');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAssignments);
      expect(mockLocoRepoInstance.checkTrainAssignments).toHaveBeenCalledWith('loco-001');
    });

    it('should return 404 if locomotive not found', async () => {
      mockLocoRepoInstance.findByIdOrNull.mockResolvedValueOnce(NULL_LOCOMOTIVE);
      
      const response = await request(app).get('/api/locomotives/nonexistent/assignments');
      
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/locomotives', () => {
    const newLocomotive = {
      reportingMarks: 'ELMR',
      reportingNumber: '000901',
      model: 'GP9',
      manufacturer: 'Bachmann',
      isDCC: false,
      homeYard: 'yard-002',
      isInService: true,
      notes: 'New locomotive'
    };

    it('should create a new locomotive', async () => {
      mockLocoRepoInstance.validate.mockResolvedValue(newLocomotive);
      mockLocoRepoInstance.create.mockResolvedValue({ _id: 'loco-002', ...newLocomotive });
      mockLocoRepoInstance.enrich.mockResolvedValue({ _id: 'loco-002', ...newLocomotive });

      const response = await request(app)
        .post('/api/locomotives')
        .send(newLocomotive);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockLocoRepoInstance.validate).toHaveBeenCalledWith(newLocomotive, 'create');
      expect(mockLocoRepoInstance.create).toHaveBeenCalledWith(newLocomotive);
    });

    it('should return 400 for validation errors', async () => {
      mockLocoRepoInstance.validate.mockRejectedValue(
        new ApiError('Validation failed: reportingNumber is required', 400)
      );

      const response = await request(app)
        .post('/api/locomotives')
        .send({ reportingMarks: 'ELMR' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate reporting marks/number', async () => {
      mockLocoRepoInstance.validate.mockRejectedValue(
        new ApiError('A locomotive with reporting marks \'ELMR\' and number \'003801\' already exists', 409)
      );

      const response = await request(app)
        .post('/api/locomotives')
        .send(newLocomotive);
      
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate DCC address', async () => {
      mockLocoRepoInstance.validate.mockRejectedValue(
        new ApiError('DCC address 3801 is already assigned', 409)
      );

      const response = await request(app)
        .post('/api/locomotives')
        .send({ ...newLocomotive, isDCC: true, dccAddress: 3801 });
      
      expect(response.status).toBe(409);
    });

    it('should return 404 if home yard not found', async () => {
      mockLocoRepoInstance.validate.mockRejectedValue(
        new ApiError('Home yard with ID \'invalid-yard\' does not exist', 404)
      );

      const response = await request(app)
        .post('/api/locomotives')
        .send({ ...newLocomotive, homeYard: 'invalid-yard' });
      
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/locomotives/:id', () => {
    const updateData = {
      notes: 'Updated notes',
      isInService: true
    };

    it('should update a locomotive', async () => {
      mockLocoRepoInstance.validate.mockResolvedValue(updateData);
      mockLocoRepoInstance.update.mockResolvedValue(true);

      const response = await request(app)
        .put('/api/locomotives/loco-001')
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockLocoRepoInstance.validate).toHaveBeenCalledWith(updateData, 'update', 'loco-001');
      expect(mockLocoRepoInstance.update).toHaveBeenCalledWith('loco-001', updateData);
    });

    it('should return 404 if locomotive not found', async () => {
      mockLocoRepoInstance.findByIdOrNull.mockResolvedValueOnce(NULL_LOCOMOTIVE);

      const response = await request(app)
        .put('/api/locomotives/nonexistent')
        .send(updateData);
      
      expect(response.status).toBe(404);
    });

    it('should prevent setting out of service if assigned to trains', async () => {
      mockLocoRepoInstance.checkTrainAssignments.mockResolvedValue({
        isAssigned: true,
        trainCount: 1,
        trains: [{ _id: 'train-001', name: 'Local 1', status: 'Planned' }]
      });

      const response = await request(app)
        .put('/api/locomotives/loco-001')
        .send({ isInService: false });
      
      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Cannot set locomotive out of service');
    });

    it('should return 400 for validation errors', async () => {
      mockLocoRepoInstance.validate.mockRejectedValue(
        new ApiError('Validation failed', 400)
      );

      const response = await request(app)
        .put('/api/locomotives/loco-001')
        .send({ manufacturer: 'InvalidManufacturer' });
      
      expect(response.status).toBe(400);
    });

    it('should return 500 if update fails', async () => {
      mockLocoRepoInstance.update.mockResolvedValue(false);

      const response = await request(app)
        .put('/api/locomotives/loco-001')
        .send(updateData);
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update locomotive');
    });
  });

  describe('DELETE /api/locomotives/:id', () => {
    it('should delete a locomotive', async () => {
      mockLocoRepoInstance.delete.mockResolvedValue(true);

      const response = await request(app).delete('/api/locomotives/loco-001');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockLocoRepoInstance.delete).toHaveBeenCalledWith('loco-001');
    });

    it('should return 404 if locomotive not found', async () => {
      mockLocoRepoInstance.findByIdOrNull.mockResolvedValueOnce(NULL_LOCOMOTIVE);

      const response = await request(app).delete('/api/locomotives/nonexistent');
      
      expect(response.status).toBe(404);
    });

    it('should prevent deletion if assigned to trains', async () => {
      mockLocoRepoInstance.checkTrainAssignments.mockResolvedValue({
        isAssigned: true,
        trainCount: 2,
        trains: [
          { _id: 'train-001', name: 'Local 1', status: 'Planned' },
          { _id: 'train-002', name: 'Local 2', status: 'In Progress' }
        ]
      });

      const response = await request(app).delete('/api/locomotives/loco-001');
      
      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Cannot delete locomotive');
      expect(response.body.error).toContain('2 active train');
    });

    it('should return 500 if delete fails', async () => {
      mockLocoRepoInstance.delete.mockResolvedValue(false);

      const response = await request(app).delete('/api/locomotives/loco-001');
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete locomotive');
    });
  });
});
