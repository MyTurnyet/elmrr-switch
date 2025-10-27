import express from 'express';
import request from 'supertest';

// Create mock objects inside the factory functions to avoid hoisting issues
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

// Mock the services (new architecture)
jest.mock('../../services/index.js', () => {
    const mockService = {
        generateSwitchList: jest.fn(),
        completeTrain: jest.fn(),
        cancelTrain: jest.fn()
    };
    
    return {
        getService: jest.fn((serviceName) => {
            if (serviceName === 'train') {
                return mockService;
            }
            return {};
        }),
        __mockTrainService: mockService
    };
});

// Mock the repositories (new architecture)
jest.mock('../../repositories/index.js', () => {
    const mockTrainRepo = {
        findAll: jest.fn(),
        findById: jest.fn(),
        findWithFilters: jest.fn(),
        createTrain: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    };
    
    const mockSessionRepo = {
        findAll: jest.fn()
    };
    
    return {
        getRepository: jest.fn((repoName) => {
            if (repoName === 'trains') {
                return mockTrainRepo;
            }
            if (repoName === 'operatingSessions') {
                return mockSessionRepo;
            }
            return {
                findAll: jest.fn(),
                findById: jest.fn()
            };
        }),
        __mockTrainRepository: mockTrainRepo,
        __mockSessionRepository: mockSessionRepo
    };
});

// Mock validation middleware to pass through
jest.mock('../../middleware/validation.js', () => ({
    validateBody: jest.fn(() => (req, res, next) => next()),
    validateQuery: jest.fn(() => (req, res, next) => next()),
    validateParams: jest.fn(() => (req, res, next) => next())
}));

// Mock schemas
jest.mock('../../schemas/trainSchemas.js', () => ({ trainSchemas: { create: {}, update: {}, query: {} } }));
jest.mock('../../schemas/commonSchemas.js', () => ({ commonSchemas: { params: { id: {} } } }));

// Now import the dependencies
import { ApiError } from '../../middleware/errorHandler.js';
import trainsRouter from '../../routes/trains.js';
import { getRepository } from '../../repositories/index.js';
import { getService } from '../../services/index.js';

// Get references to the mocks
const mockTrainRepoInstance = getRepository('trains');
const mockSessionRepoInstance = getRepository('operatingSessions');
const mockTrainServiceInstance = getService('train');

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

describe('Trains Routes', () => {
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
        mockSessionRepoInstance.findAll.mockResolvedValue([mockSession]);
        mockTrainRepoInstance.findWithFilters.mockResolvedValue([mockTrain]);
        mockTrainRepoInstance.findById.mockResolvedValue(mockTrain);
        mockTrainRepoInstance.createTrain.mockResolvedValue(mockTrain);
        mockTrainRepoInstance.update.mockResolvedValue(mockTrain);
        mockTrainRepoInstance.delete.mockResolvedValue({ deletedCount: 1 });

        mockTrainServiceInstance.generateSwitchList.mockResolvedValue({ 
            train: { ...mockTrain, status: 'In Progress' },
            stats: { stationsServed: 3, carsAssigned: 5 }
        });
        mockTrainServiceInstance.completeTrain.mockResolvedValue({ 
            train: { ...mockTrain, status: 'Completed' },
            stats: { carsMoved: 5 }
        });
        mockTrainServiceInstance.cancelTrain.mockResolvedValue({ 
            train: { ...mockTrain, status: 'Cancelled' },
            stats: { ordersReverted: 5 }
        });
    });

    describe('GET /', () => {
        it('should return all trains with filters', async () => {
            const response = await request(app)
                .get('/api/trains?sessionNumber=1&status=Planned')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([mockTrain]);
            expect(mockTrainRepoInstance.findWithFilters).toHaveBeenCalledWith({
                sessionNumber: '1',
                status: 'Planned',
                routeId: undefined,
                search: undefined
            });
        });

        it('should handle repository errors gracefully', async () => {
            mockTrainRepoInstance.findWithFilters.mockRejectedValue(new Error('Database error'));

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
            expect(mockTrainRepoInstance.findById).toHaveBeenCalledWith('train1', { enrich: true });
        });

        it('should handle train not found', async () => {
            mockTrainRepoInstance.findById.mockResolvedValue(null);

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
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockTrain);
            expect(mockTrainRepoInstance.createTrain).toHaveBeenCalledWith({
                ...newTrainData,
                sessionNumber: 1,
                status: 'Planned'
            });
        });

        it('should handle missing session error', async () => {
            mockSessionRepoInstance.findAll.mockResolvedValue([]);

            const response = await request(app)
                .post('/api/trains')
                .send(newTrainData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Cannot create train without an active operating session');
        });
    });

    describe('PUT /:id', () => {
        const updateData = {
            name: 'Updated Name'
        };

        it('should update train successfully', async () => {
            // Mock findAll for name uniqueness check
            mockTrainRepoInstance.findAll.mockResolvedValue([mockTrain]);
            
            const response = await request(app)
                .put('/api/trains/train1')
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockTrain);
        });

        it('should prevent updates to non-Planned trains', async () => {
            mockTrainRepoInstance.findById.mockResolvedValue({ ...mockTrain, status: 'In Progress' });

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
                .expect(204);

            expect(response.status).toBe(204);
            expect(mockTrainRepoInstance.delete).toHaveBeenCalledWith('train1');
        });

        it('should prevent deletion of non-Planned trains', async () => {
            mockTrainRepoInstance.findById.mockResolvedValue({ ...mockTrain, status: 'In Progress' });

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
            expect(mockTrainServiceInstance.generateSwitchList).toHaveBeenCalledWith('train1');
        });

        it('should handle service errors', async () => {
            mockTrainServiceInstance.generateSwitchList.mockRejectedValue(
                new ApiError('Switchlist generation failed', 400)
            );

            const response = await request(app)
                .post('/api/trains/train1/generate-switch-list')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Switchlist generation failed');
        });
    });

    describe('POST /:id/complete', () => {
        it('should complete train successfully', async () => {
            const response = await request(app)
                .post('/api/trains/train1/complete')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('Completed');
            expect(mockTrainServiceInstance.completeTrain).toHaveBeenCalledWith('train1');
        });

        it('should handle service errors', async () => {
            mockTrainServiceInstance.completeTrain.mockRejectedValue(
                new ApiError('Completion failed', 400)
            );

            const response = await request(app)
                .post('/api/trains/train1/complete')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Completion failed');
        });
    });

    describe('POST /:id/cancel', () => {
        it('should cancel train successfully', async () => {
            const response = await request(app)
                .post('/api/trains/train1/cancel')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('Cancelled');
            expect(mockTrainServiceInstance.cancelTrain).toHaveBeenCalledWith('train1');
        });

        it('should handle service errors', async () => {
            mockTrainServiceInstance.cancelTrain.mockRejectedValue(
                new ApiError('Cancellation failed', 400)
            );

            const response = await request(app)
                .post('/api/trains/train1/cancel')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Cancellation failed');
        });
    });
});