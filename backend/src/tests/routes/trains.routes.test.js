import express from 'express';
import request from 'supertest';
import trainsRouter from '../../routes/trains.js';
import { dbHelpers } from '../../database/index.js';

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

// Mock the validation functions
jest.mock('../../models/train.js', () => ({
  validateTrain: jest.fn(),
  validateTrainNameUniqueness: jest.fn(),
  validateLocomotiveAssignments: jest.fn(),
  validateStatusTransition: jest.fn(),
  validateSwitchListRequirements: jest.fn(),
  formatTrainSummary: jest.fn()
}));

import { 
  validateTrain,
  validateTrainNameUniqueness,
  validateLocomotiveAssignments,
  validateSwitchListRequirements
} from '../../models/train.js';

const app = express();
app.use(express.json());
app.use('/api/trains', trainsRouter);

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

  const mockRoute = {
    _id: 'route1',
    name: 'Test Route',
    originYard: 'yard1',
    terminationYard: 'yard2',
    stationSequence: ['station1']
  };

  const mockLocomotive = {
    _id: 'loco1',
    reportingMarks: 'UP',
    reportingNumber: '1234',
    type: 'GP38-2',
    isInService: true
  };

  const mockSession = {
    currentSessionNumber: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return all trains', async () => {
      dbHelpers.findByQuery.mockResolvedValue([mockTrain]);

      const response = await request(app)
        .get('/api/trains')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [mockTrain],
        count: 1
      });
      expect(dbHelpers.findByQuery).toHaveBeenCalledWith('trains', {});
    });

    it('should filter by sessionNumber', async () => {
      dbHelpers.findByQuery.mockResolvedValue([mockTrain]);

      await request(app)
        .get('/api/trains?sessionNumber=1')
        .expect(200);

      expect(dbHelpers.findByQuery).toHaveBeenCalledWith('trains', {
        sessionNumber: 1
      });
    });

    it('should filter by status', async () => {
      dbHelpers.findByQuery.mockResolvedValue([mockTrain]);

      await request(app)
        .get('/api/trains?status=Planned')
        .expect(200);

      expect(dbHelpers.findByQuery).toHaveBeenCalledWith('trains', {
        status: 'Planned'
      });
    });

    it('should filter by routeId', async () => {
      dbHelpers.findByQuery.mockResolvedValue([mockTrain]);

      await request(app)
        .get('/api/trains?routeId=route1')
        .expect(200);

      expect(dbHelpers.findByQuery).toHaveBeenCalledWith('trains', {
        routeId: 'route1'
      });
    });

    it('should search by train name', async () => {
      dbHelpers.findByQuery.mockResolvedValue([mockTrain]);

      const response = await request(app)
        .get('/api/trains?search=local')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should handle database errors', async () => {
      dbHelpers.findByQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/trains')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch trains',
        message: 'Database error'
      });
    });
  });

  describe('GET /:id', () => {
    it('should return single train with enriched data', async () => {
      dbHelpers.findById
        .mockResolvedValueOnce(mockTrain)
        .mockResolvedValueOnce(mockRoute)
        .mockResolvedValueOnce(mockLocomotive);

      const response = await request(app)
        .get('/api/trains/train1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.route).toEqual({
        _id: 'route1',
        name: 'Test Route'
      });
      expect(response.body.data.locomotives).toHaveLength(1);
    });

    it('should handle train not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/trains/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Train not found'
      });
    });

    it('should handle database errors', async () => {
      dbHelpers.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/trains/train1')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch train',
        message: 'Database error'
      });
    });
  });

  describe('POST /', () => {
    const newTrainData = {
      name: 'Express 456',
      routeId: 'route1',
      locomotiveIds: ['loco1'],
      maxCapacity: 25
    };

    beforeEach(() => {
      validateTrain.mockReturnValue({ error: null, value: { ...newTrainData, sessionNumber: 1, status: 'Planned' } });
      validateTrainNameUniqueness.mockReturnValue({ valid: true });
      validateLocomotiveAssignments.mockReturnValue({ valid: true });
    });

    it('should create new train successfully', async () => {
      dbHelpers.findAll
        .mockResolvedValueOnce([mockSession]) // operating sessions
        .mockResolvedValueOnce([]); // existing trains
      dbHelpers.findById
        .mockResolvedValueOnce(mockRoute) // route exists
        .mockResolvedValueOnce(mockLocomotive); // locomotive exists
      dbHelpers.create.mockResolvedValue({ ...newTrainData, _id: 'train2' });

      const response = await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Train created successfully');
    });

    it('should use current session if not provided', async () => {
      dbHelpers.findAll.mockResolvedValue([mockSession]);
      dbHelpers.findById
        .mockResolvedValueOnce(mockRoute)
        .mockResolvedValueOnce(mockLocomotive);
      dbHelpers.create.mockResolvedValue({ ...newTrainData, _id: 'train2' });

      await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(201);

      expect(validateTrain).toHaveBeenCalledWith(
        expect.objectContaining({ sessionNumber: 1 })
      );
    });

    it('should handle no current session', async () => {
      dbHelpers.findAll.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'No current session found',
        message: 'Cannot create train without an active operating session'
      });
    });

    it('should handle validation errors', async () => {
      validateTrain.mockReturnValue({ 
        error: { details: [{ message: 'Validation failed' }] }
      });
      dbHelpers.findAll.mockResolvedValue([mockSession]);

      const response = await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Validation failed',
        message: 'Validation failed'
      });
    });

    it('should handle route not found', async () => {
      dbHelpers.findAll.mockResolvedValue([mockSession]);
      dbHelpers.findById.mockResolvedValueOnce(null); // route not found

      const response = await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Route not found',
        message: `Route with ID '${newTrainData.routeId}' does not exist`
      });
    });

    it('should handle locomotive not found', async () => {
      dbHelpers.findAll.mockResolvedValue([mockSession]);
      dbHelpers.findById
        .mockResolvedValueOnce(mockRoute) // route exists
        .mockResolvedValueOnce(null); // locomotive not found

      const response = await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Locomotive not found',
        message: `Locomotive with ID '${newTrainData.locomotiveIds[0]}' does not exist`
      });
    });

    it('should handle locomotive out of service', async () => {
      const outOfServiceLoco = { ...mockLocomotive, isInService: false };
      dbHelpers.findAll.mockResolvedValue([mockSession]);
      dbHelpers.findById
        .mockResolvedValueOnce(mockRoute)
        .mockResolvedValueOnce(outOfServiceLoco);

      const response = await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Locomotive out of service',
        message: `Locomotive '${mockLocomotive.reportingMarks}' is not in service`
      });
    });

    it('should handle duplicate train name', async () => {
      validateTrainNameUniqueness.mockReturnValue({ valid: false });
      dbHelpers.findAll.mockResolvedValue([mockSession]);
      dbHelpers.findById
        .mockResolvedValueOnce(mockRoute)
        .mockResolvedValueOnce(mockLocomotive);

      const response = await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(409);

      expect(response.body.error).toBe('Duplicate train name');
    });

    it('should handle locomotive assignment conflicts', async () => {
      validateLocomotiveAssignments.mockReturnValue({ 
        valid: false,
        conflicts: [{ 
          locomotiveId: 'loco1', 
          conflictingTrains: [{ name: 'Other Train' }] 
        }]
      });
      dbHelpers.findAll.mockResolvedValue([mockSession]);
      dbHelpers.findById
        .mockResolvedValueOnce(mockRoute)
        .mockResolvedValueOnce(mockLocomotive);

      const response = await request(app)
        .post('/api/trains')
        .send(newTrainData)
        .expect(409);

      expect(response.body.error).toBe('Locomotive assignment conflict');
    });
  });

  describe('PUT /:id', () => {
    const updateData = { name: 'Updated Train', maxCapacity: 30 };

    beforeEach(() => {
      validateTrain.mockReturnValue({ error: null, value: updateData });
      validateTrainNameUniqueness.mockReturnValue({ valid: true });
      validateLocomotiveAssignments.mockReturnValue({ valid: true });
    });

    it('should update train successfully', async () => {
      dbHelpers.findById.mockResolvedValue(mockTrain);
      dbHelpers.update.mockResolvedValue(1);
      dbHelpers.findById.mockResolvedValue({ ...mockTrain, ...updateData });

      const response = await request(app)
        .put('/api/trains/train1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Train updated successfully');
    });

    it('should handle train not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/trains/nonexistent')
        .send(updateData)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Train not found'
      });
    });

    it('should prevent updates to non-Planned trains', async () => {
      const inProgressTrain = { ...mockTrain, status: 'In Progress' };
      dbHelpers.findById.mockResolvedValue(inProgressTrain);

      const response = await request(app)
        .put('/api/trains/train1')
        .send(updateData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Cannot update train',
        message: 'Cannot update train with status: In Progress. Only \'Planned\' trains can be updated.'
      });
    });

    it('should validate route if being updated', async () => {
      const updateWithRoute = { ...updateData, routeId: 'route2' };
      validateTrain.mockReturnValue({ error: null, value: updateWithRoute });
      dbHelpers.findById
        .mockResolvedValueOnce(mockTrain)
        .mockResolvedValueOnce(null); // route not found

      const response = await request(app)
        .put('/api/trains/train1')
        .send(updateWithRoute)
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });

    it('should validate locomotives if being updated', async () => {
      const updateWithLocos = { ...updateData, locomotiveIds: ['loco2'] };
      validateTrain.mockReturnValue({ error: null, value: updateWithLocos });
      dbHelpers.findById
        .mockResolvedValueOnce(mockTrain)
        .mockResolvedValueOnce(null); // locomotive not found

      const response = await request(app)
        .put('/api/trains/train1')
        .send(updateWithLocos)
        .expect(404);

      expect(response.body.error).toBe('Locomotive not found');
    });
  });

  describe('DELETE /:id', () => {
    it('should delete train successfully', async () => {
      dbHelpers.findById.mockResolvedValue(mockTrain);
      dbHelpers.delete.mockResolvedValue(1);

      const response = await request(app)
        .delete('/api/trains/train1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Train deleted successfully'
      });
    });

    it('should handle train not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/trains/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Train not found'
      });
    });

    it('should prevent deletion of non-Planned trains', async () => {
      const inProgressTrain = { ...mockTrain, status: 'In Progress' };
      dbHelpers.findById.mockResolvedValue(inProgressTrain);

      const response = await request(app)
        .delete('/api/trains/train1')
        .expect(409);

      expect(response.body).toEqual({
        success: false,
        error: 'Cannot delete train',
        message: 'Cannot delete train with status: In Progress. Only \'Planned\' trains can be deleted.'
      });
    });
  });

  describe('POST /:id/generate-switch-list', () => {
    const mockSwitchList = {
      stations: [
        {
          stationId: 'station1',
          stationName: 'Test Station',
          pickups: [
            {
              carId: 'car1',
              carReportingMarks: 'UP',
              carNumber: '12345',
              carType: 'boxcar',
              destinationIndustryId: 'industry1',
              destinationIndustryName: 'Test Industry',
              carOrderId: 'order1'
            }
          ],
          setouts: []
        }
      ],
      totalPickups: 1,
      totalSetouts: 0,
      finalCarCount: 1,
      generatedAt: new Date().toISOString()
    };

    beforeEach(() => {
      validateSwitchListRequirements.mockReturnValue({ valid: true, errors: [] });
    });

    it('should generate switch list successfully', async () => {
      // Mock train, route, and locomotive lookup
      dbHelpers.findById
        .mockResolvedValueOnce(mockTrain)
        .mockResolvedValueOnce(mockRoute)
        .mockResolvedValueOnce(mockLocomotive);
      
      // Mock the complex switch list generation algorithm step by step
      // 1. Get stations in route
      dbHelpers.findById
        .mockResolvedValueOnce({ _id: 'yard1', name: 'Origin Yard' }) // origin yard
        .mockResolvedValueOnce({ _id: 'station1', name: 'Test Station' }) // station in sequence
        .mockResolvedValueOnce({ _id: 'yard2', name: 'Termination Yard' }); // termination yard
      
      // 2. For each station, get industries
      dbHelpers.findByQuery
        .mockResolvedValueOnce([{ _id: 'industry1', stationId: 'yard1' }]) // industries at origin
        .mockResolvedValueOnce([{ _id: 'order1', industryId: 'industry1', aarTypeId: 'boxcar', sessionNumber: 1, status: 'pending' }]) // pending orders
        .mockResolvedValueOnce([{ _id: 'car1', currentIndustry: 'industry1', carType: 'boxcar', reportingMarks: 'UP', reportingNumber: '12345', isInService: true }]) // available cars
        .mockResolvedValueOnce([{ _id: 'industry2', stationId: 'station1' }]) // industries at station1
        .mockResolvedValueOnce([]) // no orders at station1
        .mockResolvedValueOnce([]) // no cars at station1
        .mockResolvedValueOnce([{ _id: 'industry3', stationId: 'yard2' }]) // industries at termination
        .mockResolvedValueOnce([]) // no orders at termination
        .mockResolvedValueOnce([]); // no cars at termination
      
      // 3. Mock industry lookups for destinations
      dbHelpers.findById
        .mockResolvedValueOnce({ _id: 'industry1', name: 'Test Industry' }); // destination industry
      
      // 4. Mock train update and final result
      dbHelpers.update.mockResolvedValue(1);
      dbHelpers.findById.mockResolvedValueOnce({ 
        ...mockTrain, 
        status: 'In Progress',
        switchList: mockSwitchList,
        assignedCarIds: ['car1']
      });

      const response = await request(app)
        .post('/api/trains/train1/generate-switch-list')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Switch list generated successfully');
      expect(response.body.stats).toBeDefined();
    });

    it('should handle train not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/trains/nonexistent/generate-switch-list')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Train not found'
      });
    });

    it('should handle validation failures', async () => {
      validateSwitchListRequirements.mockReturnValue({ 
        valid: false, 
        errors: ['Cannot generate switch list for train with status: Completed'] 
      });
      dbHelpers.findById
        .mockResolvedValueOnce(mockTrain)
        .mockResolvedValueOnce(mockRoute)
        .mockResolvedValueOnce(mockLocomotive);

      const response = await request(app)
        .post('/api/trains/train1/generate-switch-list')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Cannot generate switch list',
        message: 'Cannot generate switch list for train with status: Completed'
      });
    });
  });

  describe('POST /:id/complete', () => {
    const inProgressTrain = {
      ...mockTrain,
      status: 'In Progress',
      switchList: {
        stations: [
          {
            setouts: [
              {
                carId: 'car1',
                destinationIndustryId: 'industry1'
              }
            ]
          }
        ]
      }
    };

    it('should complete train successfully', async () => {
      dbHelpers.findById
        .mockResolvedValueOnce(inProgressTrain)
        .mockResolvedValueOnce({ ...inProgressTrain, status: 'Completed' });
      dbHelpers.findByQuery.mockResolvedValue([
        { _id: 'order1', status: 'assigned', assignedTrainId: 'train1' }
      ]);
      dbHelpers.update.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/trains/train1/complete')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Train completed successfully');
      expect(response.body.stats).toBeDefined();
    });

    it('should handle train not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/trains/nonexistent/complete')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Train not found'
      });
    });

    it('should prevent completion of non-InProgress trains', async () => {
      dbHelpers.findById.mockResolvedValue(mockTrain); // Status: Planned

      const response = await request(app)
        .post('/api/trains/train1/complete')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid train status',
        message: 'Cannot complete train with status: Planned. Only \'In Progress\' trains can be completed.'
      });
    });
  });

  describe('POST /:id/cancel', () => {
    it('should cancel planned train successfully', async () => {
      dbHelpers.findById.mockResolvedValue(mockTrain);
      dbHelpers.update.mockResolvedValue(1);
      dbHelpers.findById.mockResolvedValue({ ...mockTrain, status: 'Cancelled' });

      const response = await request(app)
        .post('/api/trains/train1/cancel')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Train cancelled successfully');
    });

    it('should cancel in-progress train and revert orders', async () => {
      const inProgressTrain = { ...mockTrain, status: 'In Progress' };
      dbHelpers.findById
        .mockResolvedValueOnce(inProgressTrain)
        .mockResolvedValueOnce({ ...inProgressTrain, status: 'Cancelled' });
      dbHelpers.findByQuery.mockResolvedValue([
        { _id: 'order1', status: 'assigned', assignedTrainId: 'train1' }
      ]);
      dbHelpers.update.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/trains/train1/cancel')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Check that car orders were reverted (first call) and train was updated (second call)
      expect(dbHelpers.update).toHaveBeenCalledWith('carOrders', 'order1', {
        status: 'pending',
        assignedCarId: null,
        assignedTrainId: null
      });
      expect(dbHelpers.update).toHaveBeenCalledWith('trains', 'train1', {
        status: 'Cancelled',
        updatedAt: expect.any(String)
      });
    });

    it('should handle train not found', async () => {
      dbHelpers.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/trains/nonexistent/cancel')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Train not found'
      });
    });

    it('should prevent cancellation of completed trains', async () => {
      const completedTrain = { ...mockTrain, status: 'Completed' };
      dbHelpers.findById.mockResolvedValue(completedTrain);

      const response = await request(app)
        .post('/api/trains/train1/cancel')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Cannot cancel completed train',
        message: 'Completed trains cannot be cancelled'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      dbHelpers.findByQuery.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/trains')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch trains');
    });

    it('should handle unexpected errors during creation', async () => {
      validateTrain.mockReturnValue({ error: null, value: {} });
      dbHelpers.findAll.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/trains')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to create train');
    });

    it('should handle unexpected errors during switch list generation', async () => {
      dbHelpers.findById.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/trains/train1/generate-switch-list')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to generate switch list');
    });

    it('should handle unexpected errors during completion', async () => {
      dbHelpers.findById.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/trains/train1/complete')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to complete train');
    });

    it('should handle unexpected errors during cancellation', async () => {
      dbHelpers.findById.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/trains/train1/cancel')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to cancel train');
    });
  });
});
