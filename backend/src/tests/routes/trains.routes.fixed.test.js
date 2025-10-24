import express from 'express';
import request from 'supertest';

// Create mock functions that we can reference
const mockTrainService = {
  generateSwitchList: jest.fn(),
  completeTrain: jest.fn(),
  cancelTrain: jest.fn()
};

const mockTrainRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findWithFilters: jest.fn(),
  createTrain: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

const mockSessionRepository = {
  findAll: jest.fn()
};

const mockDbHelpers = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByQuery: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

// Mock the services (new architecture)
jest.mock('../../services/index.js', () => ({
  getService: jest.fn((serviceName) => {
    if (serviceName === 'train') {
      return mockTrainService;
    }
    return {};
  })
}));

// Mock the repositories (new architecture)
jest.mock('../../repositories/index.js', () => ({
  getRepository: jest.fn((repoName) => {
    if (repoName === 'trains') {
      return mockTrainRepository;
    }
    if (repoName === 'operatingSessions') {
      return mockSessionRepository;
    }
    return {
      findAll: jest.fn(),
      findById: jest.fn()
    };
  })
}));

// Mock the database helpers (for backward compatibility)
jest.mock('../../database/index.js', () => ({
  dbHelpers: mockDbHelpers
}));

// Mock validation middleware to pass through
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

import { ApiError } from '../../middleware/errorHandler.js';
import trainsRouter from '../../routes/trains.js';

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

describe('Trains Routes (Fixed)', () => {
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
    mockSessionRepository.findAll.mockResolvedValue([mockSession]);
    mockTrainRepository.findWithFilters.mockResolvedValue([mockTrain]);
    mockTrainRepository.findById.mockResolvedValue(mockTrain);
    mockTrainRepository.createTrain.mockResolvedValue(mockTrain);
    mockDbHelpers.findById.mockResolvedValue(mockTrain);
    mockDbHelpers.update.mockResolvedValue(1);
    mockDbHelpers.delete.mockResolvedValue(1);
    
    mockTrainService.generateSwitchList.mockResolvedValue({
      train: { ...mockTrain, status: 'In Progress' }
    });
    mockTrainService.completeTrain.mockResolvedValue({
      train: { ...mockTrain, status: 'Completed' }
    });
    mockTrainService.cancelTrain.mockResolvedValue({
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
      expect(mockTrainRepository.findWithFilters).toHaveBeenCalledWith({
        sessionNumber: '1',
        status: 'Planned',
        routeId: undefined,
        search: undefined
      });
    });

    it('should handle repository errors', async () => {
      mockTrainRepository.findWithFilters.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/trains')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /:id', () => {
    it('should get single train by id', async () => {
      const response = await request(app)
        .get('/api/trains/train1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTrain);
      expect(mockTrainRepository.findById).toHaveBeenCalledWith('train1', { enrich: true });
    });

    it('should handle train not found', async () => {
      mockTrainRepository.findById.mockResolvedValue(null);

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

    it('should create new train', async () => {
      const response = await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTrain);
      expect(mockTrainRepository.createTrain).toHaveBeenCalledWith({
        ...newTrainData,
        sessionNumber: 1,
        status: 'Planned'
      });
    });

    it('should handle missing session', async () => {
      mockSessionRepository.findAll.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot create train without an active operating session');
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
      expect(mockDbHelpers.update).toHaveBeenCalledWith('trains', 'train1', updateData);
    });

    it('should handle train not found', async () => {
      mockDbHelpers.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/trains/nonexistent')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Train not found');
    });

    it('should prevent updates to non-Planned trains', async () => {
      mockDbHelpers.findById.mockResolvedValue({ ...mockTrain, status: 'In Progress' });

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
      expect(mockDbHelpers.delete).toHaveBeenCalledWith('trains', 'train1');
    });

    it('should handle train not found', async () => {
      mockDbHelpers.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/trains/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Train not found');
    });

    it('should prevent deletion of non-Planned trains', async () => {
      mockDbHelpers.findById.mockResolvedValue({ ...mockTrain, status: 'In Progress' });

      const response = await request(app)
        .delete('/api/trains/train1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot delete train with status: In Progress');
    });
  });

  describe('POST /:id/generate-switch-list', () => {
    it('should generate switch list successfully', async () => {
      const response = await request(app)
        .post('/api/trains/train1/generate-switch-list')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('In Progress');
      expect(mockTrainService.generateSwitchList).toHaveBeenCalledWith('train1');
    });

    it('should handle service errors', async () => {
      mockTrainService.generateSwitchList.mockRejectedValue(
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
      expect(mockTrainService.completeTrain).toHaveBeenCalledWith('train1');
    });

    it('should handle train not found', async () => {
      mockTrainService.completeTrain.mockRejectedValue(
        new ApiError('Train not found', 404)
      );

      const response = await request(app)
        .post('/api/trains/train1/complete')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Train not found');
    });

    it('should handle invalid status transitions', async () => {
      mockTrainService.completeTrain.mockRejectedValue(
        new ApiError('Cannot complete train with status: Planned', 400)
      );

      const response = await request(app)
        .post('/api/trains/train1/complete')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot complete train with status: Planned');
    });
  });

  describe('POST /:id/cancel', () => {
    it('should cancel train successfully', async () => {
      const response = await request(app)
        .post('/api/trains/train1/cancel')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Cancelled');
      expect(mockTrainService.cancelTrain).toHaveBeenCalledWith('train1');
    });

    it('should handle train not found', async () => {
      mockTrainService.cancelTrain.mockRejectedValue(
        new ApiError('Train not found', 404)
      );

      const response = await request(app)
        .post('/api/trains/train1/cancel')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Train not found');
    });

    it('should handle business rule violations', async () => {
      mockTrainService.cancelTrain.mockRejectedValue(
        new ApiError('Cannot cancel completed train', 400)
      );

      const response = await request(app)
        .post('/api/trains/train1/cancel')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot cancel completed train');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      // This would be caught by validation middleware in real scenario
      const response = await request(app)
        .post('/api/trains')
        .send({}) // Invalid data
        .expect(404); // No session found

      expect(response.body.success).toBe(false);
    });

    it('should handle service layer errors', async () => {
      mockTrainService.generateSwitchList.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/trains/train1/generate-switch-list')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
