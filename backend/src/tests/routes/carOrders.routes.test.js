import express from 'express';
import request from 'supertest';
import { ApiError } from '../../middleware/errorHandler.js';

// Create mock functions that will be accessible in the factory
const mockGetOrdersWithFilters = jest.fn();
const mockGetEnrichedOrder = jest.fn();
const mockCreateOrder = jest.fn();
const mockUpdateOrder = jest.fn();
const mockDeleteOrder = jest.fn();
const mockGenerateOrders = jest.fn();
const mockGetOrderStats = jest.fn();

// Mock getService to return an object with our mock methods
jest.mock('../../services/index.js', () => ({
  getService: jest.fn(() => ({
    getOrdersWithFilters: (...args) => mockGetOrdersWithFilters(...args),
    getEnrichedOrder: (...args) => mockGetEnrichedOrder(...args),
    createOrder: (...args) => mockCreateOrder(...args),
    updateOrder: (...args) => mockUpdateOrder(...args),
    deleteOrder: (...args) => mockDeleteOrder(...args),
    generateOrders: (...args) => mockGenerateOrders(...args),
    getOrderStats: (...args) => mockGetOrderStats(...args)
  }))
}));

import carOrdersRouter from '../../routes/carOrders.js';

const app = express();
app.use(express.json());
app.use('/api/v1/car-orders', carOrdersRouter);

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

describe('Car Orders Routes', () => {
  const mockOrder = {
    _id: 'order1',
    industryId: 'lumber-mill',
    aarTypeId: 'flatcar',
    sessionNumber: 1,
    status: 'pending',
    assignedCarId: null,
    assignedTrainId: null,
    createdAt: '2024-01-15T10:00:00.000Z'
  };

  const mockIndustry = {
    _id: 'lumber-mill',
    name: 'Lumber Mill'
  };

  const mockAarType = {
    _id: 'flatcar',
    name: 'Flatcar'
  };

  const mockCar = {
    _id: 'car1',
    reportingMarks: 'UP',
    reportingNumber: '12345',
    carType: 'flatcar',
    isInService: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return all car orders', async () => {
      mockGetOrdersWithFilters.mockResolvedValue([mockOrder]);

      const response = await request(app)
        .get('/api/v1/car-orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([mockOrder]);
      expect(mockGetOrdersWithFilters).toHaveBeenCalledWith({});
    });

    it('should filter by industryId', async () => {
      mockGetOrdersWithFilters.mockResolvedValue([mockOrder]);

      await request(app)
        .get('/api/v1/car-orders?industryId=lumber-mill')
        .expect(200);

      expect(mockGetOrdersWithFilters).toHaveBeenCalledWith({
        industryId: 'lumber-mill'
      });
    });

    it('should filter by status', async () => {
      mockGetOrdersWithFilters.mockResolvedValue([mockOrder]);

      await request(app)
        .get('/api/v1/car-orders?status=pending')
        .expect(200);

      expect(mockGetOrdersWithFilters).toHaveBeenCalledWith({
        status: 'pending'
      });
    });

    it('should filter by sessionNumber', async () => {
      mockGetOrdersWithFilters.mockResolvedValue([mockOrder]);

      await request(app)
        .get('/api/v1/car-orders?sessionNumber=1')
        .expect(200);

      expect(mockGetOrdersWithFilters).toHaveBeenCalledWith({
        sessionNumber: 1
      });
    });

    it('should filter by aarTypeId', async () => {
      mockGetOrdersWithFilters.mockResolvedValue([mockOrder]);

      await request(app)
        .get('/api/v1/car-orders?aarTypeId=flatcar')
        .expect(200);

      expect(mockGetOrdersWithFilters).toHaveBeenCalledWith({
        aarTypeId: 'flatcar'
      });
    });

    it('should search by industry name', async () => {
      mockGetOrdersWithFilters.mockResolvedValue([mockOrder]);

      const response = await request(app)
        .get('/api/v1/car-orders?search=lumber')
        .expect(200);

      expect(mockGetOrdersWithFilters).toHaveBeenCalledWith({
        search: 'lumber'
      });
      expect(response.body.data).toHaveLength(1);
    });

    it('should handle database errors', async () => {
      mockGetOrdersWithFilters.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/car-orders')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /:id', () => {
    it('should return single car order with enriched data', async () => {
      const enrichedOrder = {
        ...mockOrder,
        industry: { _id: 'lumber-mill', name: 'Lumber Mill' }
      };
      mockGetEnrichedOrder.mockResolvedValue(enrichedOrder);

      const response = await request(app)
        .get('/api/v1/car-orders/order1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.industry).toMatchObject({
        _id: 'lumber-mill',
        name: 'Lumber Mill'
      });
      expect(mockGetEnrichedOrder).toHaveBeenCalledWith('order1');
    });

    it('should include assigned car data when present', async () => {
      const enrichedOrder = {
        ...mockOrder,
        assignedCarId: 'car1',
        assignedCar: mockCar
      };
      mockGetEnrichedOrder.mockResolvedValue(enrichedOrder);

      const response = await request(app)
        .get('/api/v1/car-orders/order1')
        .expect(200);

      expect(response.body.data.assignedCar).toMatchObject({
        _id: 'car1',
        reportingMarks: 'UP',
        reportingNumber: '12345'
      });
    });

    it('should handle order not found', async () => {
      mockGetEnrichedOrder.mockRejectedValue(
        new ApiError('Car order not found', 404)
      );

      const response = await request(app)
        .get('/api/v1/car-orders/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Car order not found');
    });

    it('should handle database errors', async () => {
      mockGetEnrichedOrder.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/car-orders/order1')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /', () => {
    const newOrderData = {
      industryId: 'lumber-mill',
      aarTypeId: 'flatcar',
      sessionNumber: 1
    };

    it('should create new car order successfully', async () => {
      const createdOrder = { ...newOrderData, _id: 'order1' };
      mockCreateOrder.mockResolvedValue(createdOrder);

      const response = await request(app)
        .post('/api/v1/car-orders')
        .send(newOrderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockCreateOrder).toHaveBeenCalledWith(expect.objectContaining(newOrderData));
    });

    it('should handle validation errors', async () => {
      mockCreateOrder.mockRejectedValue(
        new ApiError('Validation failed', 400)
      );

      const response = await request(app)
        .post('/api/v1/car-orders')
        .send(newOrderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle industry not found', async () => {
      mockCreateOrder.mockRejectedValue(
        new ApiError('Industry not found', 404)
      );

      const response = await request(app)
        .post('/api/v1/car-orders')
        .send(newOrderData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Industry not found');
    });

    it('should handle AAR type not found', async () => {
      mockCreateOrder.mockRejectedValue(
        new ApiError('AAR type not found', 404)
      );

      const response = await request(app)
        .post('/api/v1/car-orders')
        .send(newOrderData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('AAR type not found');
    });

    it('should prevent duplicate orders', async () => {
      mockCreateOrder.mockRejectedValue(
        new ApiError('Duplicate order', 409)
      );

      const response = await request(app)
        .post('/api/v1/car-orders')
        .send(newOrderData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Duplicate order');
    });
  });

  describe('PUT /:id', () => {
    const updateData = { status: 'assigned' };

    it('should update car order successfully', async () => {
      const updatedOrder = { ...mockOrder, ...updateData };
      mockUpdateOrder.mockResolvedValue(updatedOrder);

      const response = await request(app)
        .put('/api/v1/car-orders/order1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Car order updated successfully');
      expect(mockUpdateOrder).toHaveBeenCalledWith('order1', updateData);
    });

    it('should handle order not found', async () => {
      mockUpdateOrder.mockRejectedValue(
        new ApiError('Car order not found', 404)
      );

      const response = await request(app)
        .put('/api/v1/car-orders/nonexistent')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Car order not found');
    });

    it('should validate status transitions', async () => {
      mockUpdateOrder.mockRejectedValue(
        new ApiError('Invalid status transition', 400)
      );

      const response = await request(app)
        .put('/api/v1/car-orders/order1')
        .send({ status: 'pending' })
        .expect(400);

      expect(response.body.error).toBe('Invalid status transition');
    });

    it('should validate car assignments', async () => {
      mockUpdateOrder.mockRejectedValue(
        new ApiError('Invalid car assignment', 400)
      );

      const response = await request(app)
        .put('/api/v1/car-orders/order1')
        .send({ assignedCarId: 'car1' })
        .expect(400);

      expect(response.body.error).toBe('Invalid car assignment');
    });
  });

  describe('DELETE /:id', () => {
    it('should delete car order successfully', async () => {
      mockDeleteOrder.mockResolvedValue();

      const response = await request(app)
        .delete('/api/v1/car-orders/order1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockDeleteOrder).toHaveBeenCalledWith('order1');
    });

    it('should handle order not found', async () => {
      mockDeleteOrder.mockRejectedValue(
        new ApiError('Car order not found', 404)
      );

      const response = await request(app)
        .delete('/api/v1/car-orders/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Car order not found');
    });

    it('should prevent deletion of assigned orders', async () => {
      mockDeleteOrder.mockRejectedValue(
        new ApiError('Cannot delete assigned order', 409)
      );

      const response = await request(app)
        .delete('/api/v1/car-orders/order1')
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot delete assigned order');
    });
  });

  describe('POST /generate', () => {
    const mockSession = { currentSessionNumber: 2 };
    const mockIndustryWithDemand = {
      _id: 'lumber-mill',
      name: 'Lumber Mill',
      carDemandConfig: [
        { aarTypeId: 'flatcar', carsPerSession: 2, frequency: 1 },
        { aarTypeId: 'boxcar', carsPerSession: 1, frequency: 2 }
      ]
    };

    it('should generate orders successfully', async () => {
      const generateResult = {
        ordersGenerated: 3,
        sessionNumber: 2,
        industriesProcessed: 1,
        ordersByIndustry: { 'lumber-mill': 3 },
        ordersByAarType: { 'flatcar': 2, 'boxcar': 1 }
      };
      mockGenerateOrders.mockResolvedValue(generateResult);

      const response = await request(app)
        .post('/api/v1/car-orders/generate')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ordersGenerated).toBe(3);
      expect(mockGenerateOrders).toHaveBeenCalledWith(expect.objectContaining({}));
    });

    it('should handle no current session', async () => {
      mockGenerateOrders.mockRejectedValue(
        new ApiError('No current session found', 404)
      );

      const response = await request(app)
        .post('/api/v1/car-orders/generate')
        .send({})
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No current session found');
    });

    it('should use provided session number', async () => {
      const generateResult = {
        ordersGenerated: 1,
        sessionNumber: 5,
        industriesProcessed: 1
      };
      mockGenerateOrders.mockResolvedValue(generateResult);

      const response = await request(app)
        .post('/api/v1/car-orders/generate')
        .send({ sessionNumber: 5 })
        .expect(200);

      expect(response.body.data.sessionNumber).toBe(5);
      expect(mockGenerateOrders).toHaveBeenCalledWith(expect.objectContaining({ sessionNumber: 5 }));
    });

    it('should filter by industry IDs when provided', async () => {
      const generateResult = {
        ordersGenerated: 3,
        sessionNumber: 2,
        industriesProcessed: 1
      };
      mockGenerateOrders.mockResolvedValue(generateResult);

      const response = await request(app)
        .post('/api/v1/car-orders/generate')
        .send({ industryIds: ['lumber-mill'] })
        .expect(200);

      expect(response.body.data.ordersGenerated).toBe(3);
      expect(mockGenerateOrders).toHaveBeenCalledWith(expect.objectContaining({ industryIds: ['lumber-mill'] }));
    });

    it('should respect frequency settings', async () => {
      const generateResult = {
        ordersGenerated: 0,
        sessionNumber: 3,
        industriesProcessed: 1
      };
      mockGenerateOrders.mockResolvedValue(generateResult);

      const response = await request(app)
        .post('/api/v1/car-orders/generate')
        .send({ sessionNumber: 3 })
        .expect(200);

      expect(response.body.data.ordersGenerated).toBe(0);
    });

    it('should handle validation errors', async () => {
      mockGenerateOrders.mockRejectedValue(
        new ApiError('Validation failed', 400)
      );

      const response = await request(app)
        .post('/api/v1/car-orders/generate')
        .send({ sessionNumber: -1 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockGetOrdersWithFilters.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/v1/car-orders')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle unexpected errors during creation', async () => {
      mockCreateOrder.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/v1/car-orders')
        .send({
          industryId: 'test',
          aarTypeId: 'test',
          sessionNumber: 1
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle unexpected errors during generation', async () => {
      mockGenerateOrders.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/v1/car-orders/generate')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
