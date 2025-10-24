import express from 'express';
import request from 'supertest';

// Mock the service factory - create instance inside the factory
jest.mock('../../services/index.js', () => {
  const trainService = {
    generateSwitchList: jest.fn(),
    completeTrain: jest.fn(),
    cancelTrain: jest.fn()
  };
  
  return {
    getService: jest.fn((serviceName) => {
      if (serviceName === 'train') {
        return trainService;
      }
      return {};
    })
  };
});

// Mock the repository factory
jest.mock('../../repositories/index.js', () => ({
  getRepository: jest.fn((repoName) => {
    if (repoName === 'trains') {
      return {
        findAll: jest.fn(),
        findById: jest.fn(),
        findWithFilters: jest.fn(),
        createTrain: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      };
    }
    if (repoName === 'operatingSessions') {
      return {
        findAll: jest.fn()
      };
    }
    return {
      findAll: jest.fn(),
      findById: jest.fn()
    };
  })
}));

// Mock database helpers
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

// Mock validation middleware
jest.mock('../../middleware/validation.js', () => ({
  validateBody: jest.fn(() => (req, res, next) => next()),
  validateQuery: jest.fn(() => (req, res, next) => next()),
  validateParams: jest.fn(() => (req, res, next) => next())
}));

// Mock schemas
jest.mock('../../schemas/trainSchemas.js', () => ({
  trainSchemas: {
    create: {},
    update: {},
    query: {}
  }
}));

jest.mock('../../schemas/commonSchemas.js', () => ({
  commonSchemas: {
    params: { id: {} }
  }
}));

// Now import the dependencies
import { ApiError } from '../../middleware/errorHandler.js';
import trainsRouter from '../../routes/trains.js';
import { getService } from '../../services/index.js';
import { getRepository } from '../../repositories/index.js';
import { dbHelpers } from '../../database/index.js';

const app = express();
app.use(express.json());
app.use('/api/trains', trainsRouter);

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

describe('Trains Routes (Working)', () => {
  // Get references to the mocked services and repositories
  let trainService;
  let trainRepository;
  let sessionRepository;

  beforeAll(() => {
    trainService = getService('train');
    trainRepository = getRepository('trains');
    sessionRepository = getRepository('operatingSessions');
  });

  const mockTrain = {
    _id: 'train1',
    name: 'Local 123',
    routeId: 'route1',
    sessionNumber: 1,
    status: 'Planned',
    locomotiveIds: ['loco1'],
    maxCapacity: 20,
    assignedCarIds: [],
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z'
  };

  const mockSession = {
    _id: 'session1',
    currentSessionNumber: 1,
    sessionDate: '2024-01-15T10:00:00.000Z',
    description: 'Test session'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful mocks
    sessionRepository.findAll.mockResolvedValue([mockSession]);
    trainRepository.findWithFilters.mockResolvedValue([mockTrain]);
    trainRepository.findById.mockResolvedValue(mockTrain);
    trainRepository.createTrain.mockResolvedValue(mockTrain);
    dbHelpers.findById.mockResolvedValue(mockTrain);
    dbHelpers.update.mockResolvedValue(1);
    dbHelpers.delete.mockResolvedValue(1);
    
    trainService.generateSwitchList.mockResolvedValue({
      train: { ...mockTrain, status: 'In Progress' }
    });
    trainService.completeTrain.mockResolvedValue({
      train: { ...mockTrain, status: 'Completed' }
    });
    trainService.cancelTrain.mockResolvedValue({
      train: { ...mockTrain, status: 'Cancelled' }
    });
  });

  describe('GET /', () => {
    it('should return all trains with filters', async () => {
      const response = await request(app)
        .get('/api/trains?sessionNumber=1&status=Planned')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([mockTrain]);
      expect(trainRepository.findWithFilters).toHaveBeenCalledWith({
        sessionNumber: '1',
        status: 'Planned',
        routeId: undefined,
        search: undefined
      });
    });

    it('should handle repository errors gracefully', async () => {
      trainRepository.findWithFilters.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/trains')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /:id', () => {
    it('should get single train by id', async () => {
      const response = await request(app)
        .get('/api/trains/train1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTrain);
      expect(trainRepository.findById).toHaveBeenCalledWith('train1', { enrich: true });
    });

    it('should handle train not found', async () => {
      trainRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/trains/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Train not found');
    });
  });

  describe('POST /', () => {
    const newTrainData = {
      name: 'New Train',
      routeId: 'route1',
      locomotiveIds: ['loco1'],
      maxCapacity: 50
    };

    it('should create new train successfully', async () => {
      const response = await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTrain);
      expect(trainRepository.createTrain).toHaveBeenCalledWith({
        ...newTrainData,
        sessionNumber: 1,
        status: 'Planned'
      });
    });

    it('should handle missing session error', async () => {
      sessionRepository.findAll.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot create train without an active operating session');
    });

    it('should handle repository creation errors', async () => {
      trainRepository.createTrain.mockRejectedValue(new Error('Creation failed'));

      const response = await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('PUT /:id', () => {
    const updateData = {
      name: 'Updated Train',
      maxCapacity: 60
    };

    it('should update train successfully', async () => {
      const response = await request(app)
        .put('/api/trains/train1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTrain);
      expect(dbHelpers.update).toHaveBeenCalledWith('trains', 'train1', updateData);
    });

    it('should handle train not found during update', async () => {
      dbHelpers.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/trains/nonexistent')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Train not found');
    });

    it('should prevent updates to non-Planned trains', async () => {
      dbHelpers.findById.mockResolvedValue({ ...mockTrain, status: 'In Progress' });

      const response = await request(app)
        .put('/api/trains/train1')
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot update train with status: In Progress');
    });
  });

  describe('DELETE /:id', () => {
    it('should delete train successfully', async () => {
      const response = await request(app)
        .delete('/api/trains/train1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(dbHelpers.delete).toHaveBeenCalledWith('trains', 'train1');
    });

    it('should handle train not found during deletion', async () => {
      dbHelpers.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/trains/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Train not found');
    });

    it('should prevent deletion of non-Planned trains', async () => {
      dbHelpers.findById.mockResolvedValue({ ...mockTrain, status: 'In Progress' });

      const response = await request(app)
        .delete('/api/trains/train1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot delete train with status: In Progress');
    });
  });

  describe('POST /:id/generate-switch-list', () => {
    it('should verify service mock is working', () => {
      // Debug: Check if the service mock is actually applied
      expect(trainService.generateSwitchList).toBeDefined();
      expect(typeof trainService.generateSwitchList).toBe('function');
      expect(jest.isMockFunction(trainService.generateSwitchList)).toBe(true);
    });

    it('should generate switch list successfully', async () => {
      const response = await request(app)
        .post('/api/trains/train1/generate-switch-list')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('In Progress');
      expect(trainService.generateSwitchList).toHaveBeenCalledWith('train1');
    });

    it('should handle service errors during switch list generation', async () => {
      trainService.generateSwitchList.mockRejectedValue(
        new ApiError('Cannot generate switch list for train with status: Completed', 400)
      );

      const response = await request(app)
        .post('/api/trains/train1/generate-switch-list')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot generate switch list for train with status: Completed');
    });
  });

  describe('POST /:id/complete', () => {
    it('should complete train successfully', async () => {
      const response = await request(app)
        .post('/api/trains/train1/complete')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Completed');
      expect(trainService.completeTrain).toHaveBeenCalledWith('train1');
    });

    it('should handle train not found during completion', async () => {
      trainService.completeTrain.mockRejectedValue(
        new ApiError('Train not found', 404)
      );

      const response = await request(app)
        .post('/api/trains/train1/complete')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Train not found');
    });

    it('should handle invalid status transitions during completion', async () => {
      trainService.completeTrain.mockRejectedValue(
        new ApiError('Cannot complete train with status: Planned. Only \'In Progress\' trains can be completed.', 400)
      );

      const response = await request(app)
        .post('/api/trains/train1/complete')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot complete train with status: Planned. Only \'In Progress\' trains can be completed.');
    });
  });

  describe('POST /:id/cancel', () => {
    it('should cancel train successfully', async () => {
      const response = await request(app)
        .post('/api/trains/train1/cancel')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Cancelled');
      expect(trainService.cancelTrain).toHaveBeenCalledWith('train1');
    });

    it('should handle train not found during cancellation', async () => {
      trainService.cancelTrain.mockRejectedValue(
        new ApiError('Train not found', 404)
      );

      const response = await request(app)
        .post('/api/trains/train1/cancel')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Train not found');
    });

    it('should handle business rule violations during cancellation', async () => {
      trainService.cancelTrain.mockRejectedValue(
        new ApiError('Completed trains cannot be cancelled', 400)
      );

      const response = await request(app)
        .post('/api/trains/train1/cancel')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Completed trains cannot be cancelled');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected service errors', async () => {
      trainService.generateSwitchList.mockRejectedValue(new Error('Unexpected database error'));

      const response = await request(app)
        .post('/api/trains/train1/generate-switch-list')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle repository errors during train lookup', async () => {
      trainRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/trains/train1')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
